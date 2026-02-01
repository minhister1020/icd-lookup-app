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
import { normalizeQuery } from './queryNormalizer';

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

  // Step 2: Normalize common phrases (e.g., "pancreas cancer" → "malignant neoplasm of pancreas")
  // -------------------------------------------------------------------------------------------
  // This pattern-based transformation handles cancer/tumor phrases that don't match well
  // in standard ICD-10 searches. Must run BEFORE termMapper translation.
  const normalization = normalizeQuery(trimmedQuery);
  
  // Step 3: Translate query if it's a common term (Phase 5)
  // -------------------------------------------------------
  // This converts lay terms like "heart attack" to medical terms
  // like "myocardial infarction" for better API results.
  // Use normalized query if available, otherwise use original.
  const queryToTranslate = normalization.normalizedQuery || trimmedQuery;
  const translation = translateQuery(queryToTranslate);
  
  // Step 4: Build comprehensive search terms array
  // ----------------------------------------------
  // Include: normalized query (if exists) + translated terms + original query
  // This ensures maximum coverage while prioritizing medical terminology
  const searchTerms: string[] = [];
  
  // Add normalized query first (highest priority for cancer searches)
  if (normalization.wasNormalized && normalization.normalizedQuery) {
    searchTerms.push(normalization.normalizedQuery);
  }
  
  // Add translated terms from termMapper
  if (translation.searchTerms) {
    for (const term of translation.searchTerms) {
      if (!searchTerms.includes(term.toLowerCase()) && 
          !searchTerms.some(t => t.toLowerCase() === term.toLowerCase())) {
        searchTerms.push(term);
      }
    }
  }
  
  // Always include original query for broader matching (lowest priority)
  if (!searchTerms.some(t => t.toLowerCase() === trimmedQuery.toLowerCase())) {
    searchTerms.push(trimmedQuery);
  }
  
  // Log for debugging
  console.log(`[Search] Query: "${trimmedQuery}" → Normalized: ${normalization.wasNormalized ? `"${normalization.normalizedQuery}"` : 'none'} → Search terms: [${searchTerms.join(', ')}]`);
  
  // Step 5: Search for all terms and combine results
  // ------------------------------------------------
  try {
    let allResults: ICD10Result[] = [];
    let maxTotalCount = 0;
    
    // Search for each term in searchTerms array
    for (const searchTerm of searchTerms) {
      const { results, totalCount } = await searchSingleTerm(searchTerm);
      allResults = allResults.concat(results);
      maxTotalCount = Math.max(maxTotalCount, totalCount);
    }
    
    // Step 6: Deduplicate results by ICD code
    // ---------------------------------------
    // When searching multiple terms (normalized, translated, original),
    // some codes might appear in multiple result sets
    const uniqueResults = deduplicateResults(allResults);
    
    // Step 7: Apply relevance scoring
    // -------------------------------
    // Score against the best available term for keyword matching
    // Priority: normalized term > translated medical term > original query
    const primarySearchTerm = normalization.normalizedQuery 
      || (translation.wasTranslated ? translation.medicalTerm! : trimmedQuery);
    
    const scoredResults = scoreAndRankResults(uniqueResults, primarySearchTerm);
    
    // Step 8: Return top results with metadata
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

// =============================================================================
// Related Codes Functions (Phase 10)
// =============================================================================

/**
 * Maximum results to fetch when looking for related codes.
 */
const RELATED_CODES_LIMIT = 100;

/**
 * Cache entry for related codes lookup.
 */
interface RelatedCodesCacheEntry {
  data: ICD10Result[];
  timestamp: number;
}

/**
 * In-memory cache for related codes by parent category.
 */
const relatedCodesCache = new Map<string, RelatedCodesCacheEntry>();

/**
 * Cache TTL for related codes: 24 hours.
 */
const RELATED_CACHE_TTL = 24 * 60 * 60 * 1000;

/**
 * Extracts the parent category (first 3 characters) from an ICD-10 code.
 * 
 * @param code - Any ICD-10 code
 * @returns The 3-character category prefix
 * 
 * @example
 * extractParentCode("I21.9")    // → "I21"
 * extractParentCode("S72.001A") // → "S72"
 */
export function extractParentCode(code: string): string {
  return code.trim().substring(0, 3).toUpperCase();
}

/**
 * Checks if an ICD-10 code is specific (has a decimal) vs category-only.
 * 
 * @param code - Any ICD-10 code
 * @returns True if code has a decimal (specific), false if category-only
 * 
 * @example
 * isSpecificCode("I21.9")    // → true
 * isSpecificCode("I21")      // → false
 */
export function isSpecificCode(code: string): boolean {
  return code.includes('.');
}

/**
 * Fetches related/sibling ICD-10 codes for a given code.
 * 
 * When a user searches for a specific code like "I21.9", this function
 * returns all other codes in the same family (I21.0, I21.1, etc.)
 * 
 * @param code - The ICD-10 code user searched for (e.g., "I21.9")
 * @returns Promise resolving to array of related codes (excluding searched code)
 */
export async function getRelatedCodes(code: string): Promise<ICD10Result[]> {
  const logPrefix = '[RelatedCodes]';
  const trimmedCode = code.trim().toUpperCase();
  
  if (!trimmedCode || trimmedCode.length < 3) {
    console.warn(`${logPrefix} Invalid code provided: "${code}"`);
    return [];
  }
  
  const parentCode = extractParentCode(trimmedCode);
  
  console.log(`${logPrefix} Finding siblings for "${trimmedCode}" (parent: ${parentCode})`);
  
  // Check cache first
  const cached = relatedCodesCache.get(parentCode);
  if (cached && Date.now() - cached.timestamp < RELATED_CACHE_TTL) {
    console.log(`${logPrefix} ✅ Cache hit for parent "${parentCode}"`);
    return cached.data.filter(r => r.code.toUpperCase() !== trimmedCode);
  }
  
  try {
    console.log(`${logPrefix} 🔍 Fetching from API for parent "${parentCode}"...`);
    
    const params = new URLSearchParams({
      sf: 'code,name',
      terms: parentCode,
      maxList: String(RELATED_CODES_LIMIT)
    });
    
    const url = `${API_BASE_URL}?${params.toString()}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`${logPrefix} API request failed with status: ${response.status}`);
      return [];
    }
    
    const data: SearchResponse = await response.json();
    const allCodes = parseSearchResponse(data);
    
    // Filter to only codes that start with the parent category
    const familyCodes = allCodes.filter(r => 
      r.code.toUpperCase().startsWith(parentCode)
    );
    
    // Sort by code
    familyCodes.sort((a, b) => a.code.localeCompare(b.code));
    
    // Cache the full family
    relatedCodesCache.set(parentCode, {
      data: familyCodes,
      timestamp: Date.now(),
    });
    
    console.log(`${logPrefix} ✅ Found ${familyCodes.length} codes in family "${parentCode}"`);
    
    // Return excluding the searched code
    return familyCodes.filter(r => r.code.toUpperCase() !== trimmedCode);
    
  } catch (error) {
    console.error(`${logPrefix} ❌ Error fetching related codes:`, error);
    return [];
  }
}

/**
 * Clears the related codes cache.
 */
export function clearRelatedCodesCache(): void {
  const size = relatedCodesCache.size;
  relatedCodesCache.clear();
  console.log(`[RelatedCodes:Cache] Cleared ${size} entries`);
}

/**
 * Returns cache statistics for related codes.
 */
export function getRelatedCodesCacheStats(): { size: number; entries: string[] } {
  return {
    size: relatedCodesCache.size,
    entries: Array.from(relatedCodesCache.keys()),
  };
}
