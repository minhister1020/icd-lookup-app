/**
 * API Helper Functions
 * ====================
 * 
 * This file contains functions that communicate with external APIs.
 * Keeping API logic separate from UI components makes code:
 * - Easier to test
 * - Easier to maintain
 * - Reusable across different components
 * 
 * Phase 4 Update: Added intelligent relevance scoring
 * - Fetches 150 results for better ranking pool
 * - Scores results by clinical relevance
 * - Returns top 100 sorted by score (not alphabetically)
 * 
 * Phase 5 Update: Added common terms translation
 * - Translates lay terms to medical terminology before search
 * - "heart attack" → searches "myocardial infarction"
 * - Combines results from both original and translated terms
 * - Returns translation metadata for UI display
 */

import { ICD10Result, SearchResponse, SearchResultsWithTranslation, ScoredICD10Result } from '../types/icd';
import { scoreAndRankResults } from './scoring';
import { translateQuery } from './termMapper';

// =============================================================================
// Configuration
// =============================================================================

/**
 * Base URL for the ClinicalTables ICD-10 API
 * 
 * ClinicalTables is a free, public API provided by the National Library of Medicine.
 * Documentation: https://clinicaltables.nlm.nih.gov/
 */
const API_BASE_URL = 'https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search';

/**
 * Number of results to fetch from the API for scoring pool.
 * We fetch more than we display to find the most relevant codes.
 * Increased to 150 to support displaying 100 results initially.
 */
const FETCH_LIMIT = 150;

/**
 * Number of results to display initially.
 * Users can load more with the "Load More" button.
 * Set to 100 to show enough variety for chapter filtering.
 */
const DISPLAY_LIMIT = 100;

// =============================================================================
// Main Search Function
// =============================================================================

/**
 * Searches the ClinicalTables API for ICD-10 codes matching the query.
 * 
 * Phase 4 Enhancement:
 * - Fetches 150 results for better ranking pool
 * - Applies multi-factor relevance scoring (keyword, popularity, specificity, exactness)
 * - Returns top 100 results sorted by clinical relevance, not alphabetically
 * 
 * Phase 5 Enhancement:
 * - Translates common terms to medical terminology
 * - "heart attack" → searches "myocardial infarction"
 * - Combines results from both terms for best coverage
 * - Returns translation metadata for UI display
 * 
 * @param query - The search term (e.g., "diabetes", "heart attack", or "E11.9")
 * @returns Promise that resolves to SearchResultsWithTranslation containing:
 *          - results: Top 100 scored results
 *          - totalCount: Total matching results in API
 *          - displayedCount: Number currently shown
 *          - hasMore: Whether more results can be loaded
 *          - translation: Translation metadata (if query was translated)
 * @throws Error if the network request fails or response is invalid
 * 
 * @example
 * // Search with common term - gets translated
 * const { results, translation } = await searchICD10('heart attack');
 * // translation.medicalTerm = "myocardial infarction"
 * // Results include I21.9, I21.3, etc.
 * 
 * @example
 * // Search with medical term - no translation
 * const { results, translation } = await searchICD10('diabetes mellitus');
 * // translation.wasTranslated = false
 */
export async function searchICD10(query: string): Promise<SearchResultsWithTranslation> {
  // Step 1: Validate the input
  // --------------------------
  const trimmedQuery = query.trim();
  
  if (!trimmedQuery) {
    return {
      results: [],
      totalCount: 0,
      displayedCount: 0,
      hasMore: false
    };
  }

  // Step 2: Translate query if it's a common term (Phase 5)
  // -------------------------------------------------------
  // This converts lay terms like "heart attack" to medical terms
  // like "myocardial infarction" for better API results
  const translation = translateQuery(trimmedQuery);
  
  // Step 3: Search for all terms and combine results
  // ------------------------------------------------
  try {
    let allResults: ICD10Result[] = [];
    let maxTotalCount = 0;
    
    // Search for each term in searchTerms array
    // (Usually 1 term, or 2 if translated: [medical, original])
    for (const searchTerm of translation.searchTerms) {
      const { results, totalCount } = await searchSingleTerm(searchTerm);
      allResults = allResults.concat(results);
      maxTotalCount = Math.max(maxTotalCount, totalCount);
    }
    
    // Step 4: Deduplicate results by ICD code
    // ---------------------------------------
    // When searching both "myocardial infarction" and "heart attack",
    // some codes might appear in both result sets
    const uniqueResults = deduplicateResults(allResults);
    
    // Step 5: Apply relevance scoring
    // -------------------------------
    // Score against the ORIGINAL query for best keyword matching
    // This ensures "heart attack" matches score well even when
    // we searched "myocardial infarction"
    const primarySearchTerm = translation.wasTranslated 
      ? translation.medicalTerm! 
      : trimmedQuery;
    
    const scoredResults = scoreAndRankResults(uniqueResults, primarySearchTerm);
    
    // Step 6: Return top results with metadata
    // ----------------------------------------
    const displayResults = scoredResults.slice(0, DISPLAY_LIMIT);
    
    return {
      results: displayResults,
      totalCount: maxTotalCount,
      displayedCount: displayResults.length,
      hasMore: maxTotalCount > displayResults.length,
      translation: translation.wasTranslated ? translation : undefined
    };
    
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to search ICD-10 codes: ${error.message}`);
    }
    throw new Error('Failed to search ICD-10 codes: Unknown error');
  }
}

/**
 * Searches the API for a single term (internal helper).
 * 
 * @param term - The search term
 * @returns Raw results and total count
 */
async function searchSingleTerm(term: string): Promise<{ results: ICD10Result[]; totalCount: number }> {
  const params = new URLSearchParams({
    sf: 'code,name',
    terms: term,
    maxList: String(FETCH_LIMIT)
  });
  
  const url = `${API_BASE_URL}?${params.toString()}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`API request failed with status: ${response.status}`);
  }
  
  const data: SearchResponse = await response.json();
  const totalCount = data[0];
  const results = parseSearchResponse(data);
  
  return { results, totalCount };
}

/**
 * Removes duplicate ICD codes from combined results.
 * 
 * When searching both "myocardial infarction" and "heart attack",
 * some codes might appear in both result sets. This function
 * keeps only the first occurrence of each code.
 * 
 * @param results - Combined results from multiple searches
 * @returns Deduplicated results
 */
function deduplicateResults(results: ICD10Result[]): ICD10Result[] {
  const seen = new Set<string>();
  const unique: ICD10Result[] = [];
  
  for (const result of results) {
    if (!seen.has(result.code)) {
      seen.add(result.code);
      unique.push(result);
    }
  }
  
  return unique;
}

/**
 * Fetches additional results for "Load More" functionality.
 * 
 * Note: Since ClinicalTables API doesn't support true pagination with offset,
 * we fetch a larger batch and score them. This function increases the display limit.
 * 
 * Phase 5: Also supports translated queries - uses the same translation
 * that was applied in the initial search.
 * 
 * @param query - The search term (original user input)
 * @param currentCount - Number of results already displayed
 * @returns Promise with additional scored results
 */
export async function searchICD10More(
  query: string,
  currentCount: number
): Promise<SearchResultsWithTranslation> {
  const trimmedQuery = query.trim();
  
  if (!trimmedQuery) {
    return {
      results: [],
      totalCount: 0,
      displayedCount: 0,
      hasMore: false
    };
  }

  // Apply translation (same as initial search)
  const translation = translateQuery(trimmedQuery);
  
  // Fetch a larger batch for more results
  const fetchLimit = Math.min(currentCount + DISPLAY_LIMIT + 25, 500);
  
  try {
    let allResults: ICD10Result[] = [];
    let maxTotalCount = 0;
    
    // Search for each term
    for (const searchTerm of translation.searchTerms) {
      const params = new URLSearchParams({
        sf: 'code,name',
        terms: searchTerm,
        maxList: String(fetchLimit)
      });
      
      const url = `${API_BASE_URL}?${params.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }
      
      const data: SearchResponse = await response.json();
      const totalCount = data[0];
      const results = parseSearchResponse(data);
      
      allResults = allResults.concat(results);
      maxTotalCount = Math.max(maxTotalCount, totalCount);
    }
    
    // Deduplicate and score
    const uniqueResults = deduplicateResults(allResults);
    const primarySearchTerm = translation.wasTranslated 
      ? translation.medicalTerm! 
      : trimmedQuery;
    const scoredResults = scoreAndRankResults(uniqueResults, primarySearchTerm);
    
    // Return next batch of results
    const newDisplayLimit = currentCount + DISPLAY_LIMIT;
    const displayResults = scoredResults.slice(0, newDisplayLimit);
    
    return {
      results: displayResults,
      totalCount: maxTotalCount,
      displayedCount: displayResults.length,
      hasMore: maxTotalCount > displayResults.length && scoredResults.length > displayResults.length,
      translation: translation.wasTranslated ? translation : undefined
    };
    
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to load more results: ${error.message}`);
    }
    throw new Error('Failed to load more results: Unknown error');
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Parses the raw API response into an array of ICD10Result objects.
 * 
 * The ClinicalTables API returns data in an unusual format:
 * [totalCount, codesArray, null, namesArray]
 * 
 * Where namesArray contains 2-element arrays: [[code, name], [code, name], ...]
 * Example: [["E23.2", "Diabetes insipidus"], ["N25.1", "Nephrogenic diabetes"]]
 * 
 * This function transforms that into a more usable format:
 * [{ code: "E11", name: "Type 2 diabetes" }, ...]
 * 
 * @param response - The raw response from the ClinicalTables API
 * @returns Array of ICD10Result objects
 */
function parseSearchResponse(response: SearchResponse): ICD10Result[] {
  // Destructure the array response
  // This assigns each array element to a named variable
  const [totalCount, codes, , names] = response;
  //                       ^ Note: we skip index 2 (null) with empty slot
  
  // If no results, return empty array
  if (totalCount === 0 || !codes || !names) {
    return [];
  }
  
  // Map each code to an ICD10Result object
  // map() creates a new array by transforming each element
  const results: ICD10Result[] = codes.map((code, index) => {
    // names[index] is a 2-element array like ["E23.2", "Diabetes insipidus"]
    // Index 0 = the code (duplicate), Index 1 = the actual condition name
    const nameArray = names[index];
    const name = nameArray && nameArray.length > 1 
      ? nameArray[1]  // Get the SECOND element (the actual name)
      : 'Unknown condition';  // Fallback if name is missing
    
    return {
      code,  // Shorthand for code: code
      name   // Shorthand for name: name
    };
  });
  
  return results;
}
