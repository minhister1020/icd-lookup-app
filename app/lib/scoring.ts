/**
 * ICD-10 Relevance Scoring Algorithm
 * ===================================
 * 
 * This module implements intelligent ranking of ICD-10 search results
 * based on clinical relevance rather than alphabetical order.
 * 
 * The Problem:
 * The ClinicalTables API returns results alphabetically by code.
 * Search "diabetes" → E08.0, E08.01, E08.10... (rare codes first!)
 * But users want: E11.9, E11.65, E10.9... (common codes first!)
 * 
 * The Solution:
 * Score each result on multiple factors and sort by total score.
 * 
 * Scoring Factors (100 points total):
 * ┌─────────────────┬────────┬─────────────────────────────────────────┐
 * │ Factor          │ Weight │ What it measures                        │
 * ├─────────────────┼────────┼─────────────────────────────────────────┤
 * │ Keyword Match   │ 35%    │ How well name matches search term       │
 * │ Popularity      │ 40%    │ Real-world usage frequency              │
 * │ Specificity     │ 15%    │ Balance of general vs. specific codes   │
 * │ Exactness       │ 10%    │ Direct code match bonus                 │
 * └─────────────────┴────────┴─────────────────────────────────────────┘
 * 
 * Example Transformation:
 * Before (alphabetical): E08.0 → E08.01 → E08.10 → E08.11 → E09.0...
 * After (relevance):     E11.9 → E11.65 → E10.9 → E11.8 → E10.65...
 */

import { ICD10Result, ScoredICD10Result, ScoreBreakdown } from '../types/icd';
import { TOP_COMMON_CODES, COMMON_CODE_FAMILIES, getCodeFamily } from './commonCodes';

// =============================================================================
// Scoring Functions
// =============================================================================

/**
 * Calculates keyword match score based on how well the condition name
 * matches the user's search term.
 * 
 * Scoring Logic:
 * - 35 pts: Search term appears at the START of the name
 *           "Diabetes" in "Diabetes mellitus type 2" ✓
 * - 30 pts: Search term appears as an exact phrase ANYWHERE
 *           "diabetes" in "Type 2 diabetes mellitus" ✓
 * - 25 pts: ALL search words appear somewhere in the name
 *           "heart attack" → both "heart" and "attack" present
 * - 15 pts: PRIMARY search word (first word) appears
 *           "heart" in "Congestive heart failure"
 * - 5 pts:  Partial/weak match (catch-all for API results)
 * 
 * @param name - The condition name from ICD-10
 * @param searchTerm - The user's search query
 * @returns Score from 0-35
 * 
 * @example
 * getKeywordScore("Type 2 diabetes mellitus", "diabetes") // Returns 30
 * getKeywordScore("Diabetes mellitus type 2", "diabetes") // Returns 35
 * getKeywordScore("Gestational diabetes", "diabetes")     // Returns 30
 */
export function getKeywordScore(name: string, searchTerm: string): number {
  // Normalize both strings for comparison
  const nameLower = name.toLowerCase();
  const termLower = searchTerm.toLowerCase().trim();
  
  // Handle empty search (shouldn't happen, but safety first)
  if (!termLower) return 5;
  
  // BEST: Search term at the very beginning of the name
  // "Diabetes" → "Diabetes mellitus type 2"
  if (nameLower.startsWith(termLower)) {
    return 35;
  }
  
  // VERY GOOD: Exact phrase found anywhere in name
  // "diabetes" found in "Type 2 diabetes mellitus"
  if (nameLower.includes(termLower)) {
    return 30;
  }
  
  // GOOD: Multi-word search where all words are present
  // "heart attack" → "heart" AND "attack" both found
  const searchWords = termLower.split(/\s+/).filter(w => w.length > 1);
  
  if (searchWords.length > 1) {
    const allWordsPresent = searchWords.every(word => 
      nameLower.includes(word)
    );
    if (allWordsPresent) {
      return 25;
    }
  }
  
  // OK: Primary search word found
  // "heart" in "Congestive heart failure"
  const primaryWord = searchWords[0];
  if (primaryWord && nameLower.includes(primaryWord)) {
    return 15;
  }
  
  // WEAK: Some kind of match (API returned it for a reason)
  return 5;
}

/**
 * Calculates popularity score based on real-world usage frequency data.
 * 
 * This is the most impactful factor (40% of total score) because
 * common codes are what users typically need.
 * 
 * Scoring Logic:
 * - Check exact code in TOP_COMMON_CODES map
 * - If not found, check if code family is common (partial credit)
 * - Unknown codes get minimal score
 * 
 * @param code - The ICD-10 code
 * @returns Score from 0-40 (scaled from popularity data)
 * 
 * @example
 * getPopularityScore("I10")    // Returns ~40 (most common code!)
 * getPopularityScore("E11.9")  // Returns ~36 (very common)
 * getPopularityScore("E11.621")// Returns ~20 (common family)
 * getPopularityScore("X99.99") // Returns 5 (unknown)
 */
export function getPopularityScore(code: string): number {
  // Check exact code match first
  const exactScore = TOP_COMMON_CODES.get(code);
  if (exactScore !== undefined) {
    // Scale from 0-100 data to 0-40 score
    // 100 in data → 40 points
    // 50 in data → 20 points
    return Math.round((exactScore / 100) * 40);
  }
  
  // Check if the code family is common (partial credit)
  const family = getCodeFamily(code);
  if (COMMON_CODE_FAMILIES.has(family)) {
    // Common family but specific code not listed
    // Give 50% of max (20 points)
    return 20;
  }
  
  // Unknown code - give minimal score
  // The API returned it, so it's valid, just not commonly used
  return 5;
}

/**
 * Calculates specificity score based on code structure.
 * 
 * ICD-10 codes have varying levels of specificity:
 * - E11      = Category (Type 2 diabetes) - too general
 * - E11.9    = Commonly used "unspecified" code - sweet spot!
 * - E11.65   = More specific variant - good
 * - E11.621  = Very specific (neuropathy, foot, right) - maybe too specific
 * 
 * Counter-intuitive finding: ".9" codes (unspecified) are often
 * MORE useful in practice because they're the default choice
 * when specific details aren't documented.
 * 
 * @param code - The ICD-10 code
 * @returns Score from 0-15
 * 
 * @example
 * getSpecificityScore("E11")     // Returns 5 (category only)
 * getSpecificityScore("E11.9")   // Returns 15 (sweet spot)
 * getSpecificityScore("E11.65")  // Returns 12 (good specificity)
 * getSpecificityScore("E11.621") // Returns 8 (very specific)
 */
export function getSpecificityScore(code: string): number {
  const parts = code.split('.');
  
  // No decimal point - category code only (E11, I10)
  // These are often too general for billing/documentation
  if (parts.length === 1) {
    return 5;
  }
  
  const decimalPart = parts[1];
  const decimalLength = decimalPart.length;
  
  // One digit after decimal (E11.9, I10.0)
  // These ".9" codes are the "unspecified" variants
  // and are VERY commonly used in practice!
  if (decimalLength === 1) {
    return 15; // Sweet spot - most clinically useful
  }
  
  // Two digits after decimal (E11.65, J45.20)
  // Good level of specificity without being overly detailed
  if (decimalLength === 2) {
    return 12;
  }
  
  // Three or more digits (E11.621, M54.51)
  // Very specific - useful for specialists but
  // might not be what a general user is searching for
  if (decimalLength >= 3) {
    return 8;
  }
  
  // Fallback (shouldn't reach here)
  return 10;
}

/**
 * Calculates exactness bonus when user searches by code directly.
 * 
 * Sometimes users search for a specific code like "E11" or "I21.9".
 * This gives a bonus to codes that match the search pattern.
 * 
 * @param code - The ICD-10 code
 * @param searchTerm - The user's search query
 * @returns Score from 0-10
 * 
 * @example
 * getExactnessScore("E11.9", "E11")     // Returns 10 (code starts with search)
 * getExactnessScore("E11.65", "E11")    // Returns 10
 * getExactnessScore("E10.9", "E11")     // Returns 0 (different code)
 * getExactnessScore("E11.9", "diabetes") // Returns 0 (name search, not code)
 */
export function getExactnessScore(code: string, searchTerm: string): number {
  const termUpper = searchTerm.toUpperCase().trim();
  const codeUpper = code.toUpperCase();
  
  // Check if the search looks like a code (starts with letter + number)
  const looksLikeCode = /^[A-Z]\d/i.test(termUpper);
  
  if (!looksLikeCode) {
    // User is searching by condition name, not code
    return 0;
  }
  
  // Exact match or code starts with search term
  // "E11" → matches E11.9, E11.65, E11, etc.
  if (codeUpper === termUpper || codeUpper.startsWith(termUpper)) {
    return 10;
  }
  
  // Partial code match (less common but possible)
  // "11" found somewhere in code
  if (codeUpper.includes(termUpper)) {
    return 5;
  }
  
  return 0;
}

// =============================================================================
// Main Scoring Function
// =============================================================================

/**
 * Scores and ranks an array of ICD-10 results by clinical relevance.
 * 
 * This is the main function called after fetching results from the API.
 * It applies all four scoring factors to each result and sorts by total score.
 * 
 * Performance Note:
 * Scoring 50 results takes ~1-2ms. The algorithm is O(n) where n = results.
 * No external calls or heavy computation involved.
 * 
 * @param results - Raw results from ClinicalTables API
 * @param searchTerm - The user's original search query
 * @returns Scored results sorted by relevance (highest first)
 * 
 * @example
 * const raw = [
 *   { code: "E08.0", name: "Diabetes due to..." },
 *   { code: "E11.9", name: "Type 2 diabetes mellitus..." }
 * ];
 * const scored = scoreAndRankResults(raw, "diabetes");
 * // E11.9 will be first due to higher popularity score
 */
export function scoreAndRankResults(
  results: ICD10Result[],
  searchTerm: string
): ScoredICD10Result[] {
  // Phase 4D: Performance timing (development only)
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  
  // Score each result
  const scoredResults = results.map(result => {
    // Calculate each scoring factor
    const keyword = getKeywordScore(result.name, searchTerm);
    const popularity = getPopularityScore(result.code);
    const specificity = getSpecificityScore(result.code);
    const exactness = getExactnessScore(result.code, searchTerm);
    
    // Build the score breakdown for transparency
    const scoreBreakdown: ScoreBreakdown = {
      keyword,
      popularity,
      specificity,
      exactness
    };
    
    // Calculate total score (max 100)
    const score = keyword + popularity + specificity + exactness;
    
    // Return enhanced result with scoring
    return {
      ...result,
      score,
      scoreBreakdown
    };
  });
  
  // Sort by score descending (highest relevance first)
  // If scores are tied, maintain original order (stable sort)
  scoredResults.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    // Tie-breaker: prefer shorter codes (more general)
    return a.code.length - b.code.length;
  });
  
  // Phase 4D: Log warning if scoring takes too long (> 10ms)
  const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const elapsed = endTime - startTime;
  if (process.env.NODE_ENV === 'development' && elapsed > 10) {
    console.warn(`[Scoring] Performance warning: Scoring ${results.length} results took ${elapsed.toFixed(2)}ms (threshold: 10ms)`);
  }
  
  return scoredResults;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Returns a human-readable relevance label based on score.
 * Useful for UI display.
 * 
 * @param score - The total relevance score (0-100)
 * @returns Label string
 * 
 * @example
 * getRelevanceLabel(85) // Returns "Highly Relevant"
 * getRelevanceLabel(60) // Returns "Relevant"
 * getRelevanceLabel(30) // Returns "Related"
 */
export function getRelevanceLabel(score: number): string {
  if (score >= 75) return 'Highly Relevant';
  if (score >= 55) return 'Relevant';
  if (score >= 35) return 'Related';
  return 'Possible Match';
}

/**
 * Returns the CSS color class for a relevance score.
 * Useful for visual indicators.
 * 
 * @param score - The total relevance score (0-100)
 * @returns Tailwind CSS color class
 */
export function getRelevanceColor(score: number): string {
  if (score >= 75) return 'text-green-600 dark:text-green-400';
  if (score >= 55) return 'text-blue-600 dark:text-blue-400';
  if (score >= 35) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-gray-500 dark:text-gray-400';
}
