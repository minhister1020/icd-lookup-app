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
 * - Fetches 50 results for better ranking pool
 * - Scores results by clinical relevance
 * - Returns top 25 sorted by score (not alphabetically)
 */

import { ICD10Result, SearchResponse, SearchResultsWithMeta } from '../types/icd';
import { scoreAndRankResults } from './scoring';

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
 */
const FETCH_LIMIT = 50;

/**
 * Number of results to display initially.
 * Users can load more with the "Load More" button.
 */
const DISPLAY_LIMIT = 25;

// =============================================================================
// Main Search Function
// =============================================================================

/**
 * Searches the ClinicalTables API for ICD-10 codes matching the query.
 * 
 * Phase 4 Enhancement:
 * - Fetches 50 results for better ranking pool
 * - Applies multi-factor relevance scoring (keyword, popularity, specificity, exactness)
 * - Returns top 25 results sorted by clinical relevance, not alphabetically
 * 
 * @param query - The search term (e.g., "diabetes" or "E11.9")
 * @returns Promise that resolves to SearchResultsWithMeta containing:
 *          - results: Top 25 scored results
 *          - totalCount: Total matching results in API
 *          - displayedCount: Number currently shown
 *          - hasMore: Whether more results can be loaded
 * @throws Error if the network request fails or response is invalid
 * 
 * @example
 * // Search for diabetes-related codes
 * const { results, totalCount } = await searchICD10('diabetes');
 * console.log(`Found ${totalCount} results, showing top ${results.length}`);
 * // Results are now sorted by relevance:
 * // E11.9 (Type 2 diabetes) appears before E08.0 (rare diabetes variant)
 */
export async function searchICD10(query: string): Promise<SearchResultsWithMeta> {
  // Step 1: Validate the input
  // --------------------------
  // trim() removes whitespace from both ends of the string
  // This prevents searches with just spaces
  const trimmedQuery = query.trim();
  
  if (!trimmedQuery) {
    // Return empty result with metadata if query is empty
    return {
      results: [],
      totalCount: 0,
      displayedCount: 0,
      hasMore: false
    };
  }

  // Step 2: Build the API URL
  // -------------------------
  // Phase 4: Added maxList to fetch more results for better ranking
  const params = new URLSearchParams({
    sf: 'code,name',       // sf = "search fields" - we want both code and name
    terms: trimmedQuery,   // terms = the search query
    maxList: String(FETCH_LIMIT)  // Fetch 50 results for scoring pool
  });
  
  const url = `${API_BASE_URL}?${params.toString()}`;
  
  // Step 3: Make the API request
  // ----------------------------
  try {
    const response = await fetch(url);
    
    // Check if the request was successful (status code 200-299)
    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }
    
    // Step 4: Parse the JSON response
    // -------------------------------
    const data: SearchResponse = await response.json();
    
    // Extract total count from API response (index 0)
    const apiTotalCount = data[0];
    
    // Step 5: Transform the response into ICD10Result objects
    // -------------------------------------------------------
    const rawResults = parseSearchResponse(data);
    
    // Step 6: Apply relevance scoring (Phase 4 Enhancement)
    // -----------------------------------------------------
    // This transforms alphabetically-ordered results into
    // relevance-ordered results based on:
    // - Keyword match quality (35%)
    // - Code popularity (40%)
    // - Code specificity (15%)
    // - Exactness bonus (10%)
    const scoredResults = scoreAndRankResults(rawResults, trimmedQuery);
    
    // Step 7: Return top results with metadata
    // ----------------------------------------
    // Take only the top DISPLAY_LIMIT results for initial display
    const displayResults = scoredResults.slice(0, DISPLAY_LIMIT);
    
    return {
      results: displayResults,
      totalCount: apiTotalCount,
      displayedCount: displayResults.length,
      hasMore: apiTotalCount > displayResults.length
    };
    
  } catch (error) {
    // Step 8: Handle errors gracefully
    // --------------------------------
    if (error instanceof Error) {
      throw new Error(`Failed to search ICD-10 codes: ${error.message}`);
    }
    throw new Error('Failed to search ICD-10 codes: Unknown error');
  }
}

/**
 * Fetches additional results for "Load More" functionality.
 * 
 * Note: Since ClinicalTables API doesn't support true pagination with offset,
 * we fetch a larger batch and score them. This function increases the display limit.
 * 
 * @param query - The search term
 * @param currentCount - Number of results already displayed
 * @returns Promise with additional scored results
 */
export async function searchICD10More(
  query: string,
  currentCount: number
): Promise<SearchResultsWithMeta> {
  const trimmedQuery = query.trim();
  
  if (!trimmedQuery) {
    return {
      results: [],
      totalCount: 0,
      displayedCount: 0,
      hasMore: false
    };
  }

  // Fetch a larger batch for more results
  const fetchLimit = Math.min(currentCount + DISPLAY_LIMIT + 25, 500);
  
  const params = new URLSearchParams({
    sf: 'code,name',
    terms: trimmedQuery,
    maxList: String(fetchLimit)
  });
  
  const url = `${API_BASE_URL}?${params.toString()}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }
    
    const data: SearchResponse = await response.json();
    const apiTotalCount = data[0];
    const rawResults = parseSearchResponse(data);
    const scoredResults = scoreAndRankResults(rawResults, trimmedQuery);
    
    // Return next batch of results (skip already displayed)
    const newDisplayLimit = currentCount + DISPLAY_LIMIT;
    const displayResults = scoredResults.slice(0, newDisplayLimit);
    
    return {
      results: displayResults,
      totalCount: apiTotalCount,
      displayedCount: displayResults.length,
      hasMore: apiTotalCount > displayResults.length && scoredResults.length > displayResults.length
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
