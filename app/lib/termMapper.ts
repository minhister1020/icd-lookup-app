/**
 * Common Terms Translation Logic
 * ==============================
 * 
 * This module translates user search queries from everyday language
 * into proper medical terminology for better ICD-10 search results.
 * 
 * Flow:
 * 1. User enters: "heart attack"
 * 2. translateQuery() looks up the term
 * 3. Returns: { searchTerms: ["myocardial infarction", "heart attack"], ... }
 * 4. API searches the medical term, user sees relevant results
 * 5. UI shows: "Showing results for 'myocardial infarction'"
 * 
 * Key Features:
 * - Exact match lookup (O(1) with Map)
 * - Case-insensitive matching
 * - Returns BOTH original and medical terms for best coverage
 * - Handles edge cases gracefully
 */

import { TranslationResult } from '../types/icd';
import { TERM_MAPPINGS, getMapping, TermMapping } from './termMappings';

// =============================================================================
// Main Translation Function
// =============================================================================

/**
 * Translates a user's search query to medical terminology.
 * 
 * This is the main function called before searching the API.
 * It checks if the query matches any known common terms and
 * returns appropriate search terms.
 * 
 * Strategy:
 * - If translation found: Search BOTH medical term (primary) AND original term
 * - If no translation: Search original term only
 * - This ensures maximum coverage while prioritizing medical terminology
 * 
 * @param query - The user's original search query
 * @returns TranslationResult with search terms and metadata
 * 
 * @example
 * // Common term - translates
 * translateQuery("heart attack")
 * // Returns: {
 * //   searchTerms: ["myocardial infarction", "heart attack"],
 * //   wasTranslated: true,
 * //   originalTerm: "heart attack",
 * //   medicalTerm: "myocardial infarction",
 * //   message: "Showing results for 'myocardial infarction'"
 * // }
 * 
 * @example
 * // Medical term - no translation needed
 * translateQuery("diabetes mellitus")
 * // Returns: {
 * //   searchTerms: ["diabetes mellitus"],
 * //   wasTranslated: false,
 * //   originalTerm: "diabetes mellitus"
 * // }
 * 
 * @example
 * // Unknown term - no translation
 * translateQuery("xyz123")
 * // Returns: {
 * //   searchTerms: ["xyz123"],
 * //   wasTranslated: false,
 * //   originalTerm: "xyz123"
 * // }
 */
export function translateQuery(query: string): TranslationResult {
  // Step 1: Normalize the query
  // --------------------------
  // Convert to lowercase and trim whitespace for consistent matching
  const normalizedQuery = query.toLowerCase().trim();
  
  // Handle empty query
  if (!normalizedQuery) {
    return {
      searchTerms: [],
      wasTranslated: false,
      originalTerm: query
    };
  }
  
  // Step 2: Look up exact match in our mappings
  // -------------------------------------------
  // This is O(1) lookup since we're using a Map
  const mapping = getMapping(normalizedQuery);
  
  // Step 3: If we found a mapping, return translated result
  // -------------------------------------------------------
  if (mapping) {
    return createTranslatedResult(query, mapping);
  }
  
  // Step 4: Try partial matching for multi-word queries
  // ---------------------------------------------------
  // If the exact query wasn't found, check if any known term
  // is contained within the query or vice versa
  const partialMatch = findPartialMatch(normalizedQuery);
  
  if (partialMatch) {
    return createTranslatedResult(query, partialMatch.mapping, partialMatch.matchedTerm);
  }
  
  // Step 5: No translation found - return original
  // ----------------------------------------------
  return {
    searchTerms: [query],
    wasTranslated: false,
    originalTerm: query
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Creates a TranslationResult for a successful translation.
 * 
 * @param originalQuery - The user's original query
 * @param mapping - The matched term mapping
 * @param matchedTerm - The term that was matched (for partial matches)
 * @returns Formatted TranslationResult
 */
function createTranslatedResult(
  originalQuery: string,
  mapping: TermMapping,
  matchedTerm?: string
): TranslationResult {
  const medicalTerm = mapping.medical;
  
  // Include both medical term (primary) and original term (secondary)
  // This ensures we get results from the medical term while also
  // catching any matches from the original phrasing
  const searchTerms = [medicalTerm];
  
  // Only add original term if it's different from medical term
  const normalizedOriginal = originalQuery.toLowerCase().trim();
  const normalizedMedical = medicalTerm.toLowerCase();
  
  if (normalizedOriginal !== normalizedMedical) {
    searchTerms.push(originalQuery);
  }
  
  return {
    searchTerms,
    wasTranslated: true,
    originalTerm: originalQuery,
    medicalTerm,
    matchedTerm: matchedTerm || originalQuery.toLowerCase(),
    icdHint: mapping.icdHint,
    message: `Showing results for "${medicalTerm}"`
  };
}

/**
 * Attempts to find a partial match for multi-word queries.
 * 
 * This handles cases like:
 * - "my heart attack symptoms" → matches "heart attack"
 * - "severe back pain" → matches "back pain"
 * 
 * @param normalizedQuery - Lowercase, trimmed query
 * @returns Matched term and mapping, or undefined
 */
function findPartialMatch(normalizedQuery: string): { 
  mapping: TermMapping; 
  matchedTerm: string;
} | undefined {
  // Get all keys from the mapping
  const allTerms = Array.from(TERM_MAPPINGS.keys());
  
  // First, check if any known term is contained in the query
  // (e.g., "bad heart attack yesterday" contains "heart attack")
  for (const term of allTerms) {
    if (normalizedQuery.includes(term) && term.length >= 3) {
      const mapping = TERM_MAPPINGS.get(term);
      if (mapping) {
        return { mapping, matchedTerm: term };
      }
    }
  }
  
  // Second, check if the query is contained in any known term
  // (e.g., "heart" is contained in "heart attack")
  // Only do this for queries with 4+ characters to avoid false matches
  if (normalizedQuery.length >= 4) {
    for (const term of allTerms) {
      if (term.includes(normalizedQuery)) {
        const mapping = TERM_MAPPINGS.get(term);
        if (mapping) {
          return { mapping, matchedTerm: term };
        }
      }
    }
  }
  
  return undefined;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Checks if a query would be translated.
 * Useful for UI hints without performing full translation.
 * 
 * @param query - The query to check
 * @returns True if translation would occur
 */
export function wouldTranslate(query: string): boolean {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return false;
  
  // Check exact match
  if (TERM_MAPPINGS.has(normalizedQuery)) {
    return true;
  }
  
  // Check partial match
  return findPartialMatch(normalizedQuery) !== undefined;
}

/**
 * Gets a preview of what the translation would be.
 * Useful for autocomplete or "Did you mean?" suggestions.
 * 
 * @param query - The query to preview
 * @returns Medical term preview or undefined
 */
export function getTranslationPreview(query: string): string | undefined {
  const result = translateQuery(query);
  return result.wasTranslated ? result.medicalTerm : undefined;
}

/**
 * Gets example common terms for UI display.
 * Returns a curated list of the most useful examples.
 * 
 * @param count - Number of examples to return (default: 5)
 * @returns Array of common term examples
 */
export function getExampleTerms(count: number = 5): string[] {
  // Curated list of the most impactful/common terms
  const examples = [
    'heart attack',
    'stroke',
    'flu',
    'back pain',
    'anxiety',
    'broken bone',
    'heartburn',
    'high blood pressure',
    'headache',
    'uti'
  ];
  
  return examples.slice(0, count);
}
