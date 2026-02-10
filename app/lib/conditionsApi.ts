/**
 * NIH Medical Conditions API Client
 * ==================================
 * 
 * Provides smart synonym/translation lookup using NIH's Medical Conditions API.
 * This replaces manual synonym maintenance with a dynamic, comprehensive database
 * of 2,400+ medical conditions with built-in synonyms.
 * 
 * API Documentation: https://clinicaltables.nlm.nih.gov/apidoc/conditions/v3/doc.html
 * 
 * KEY FEATURES:
 * - Returns ICD-10 codes directly (can skip ICD-10 API for matched conditions)
 * - Provides consumer-friendly names and medical terms
 * - Includes comprehensive synonyms for common language search
 * - 3-second timeout prevents slow UX
 * - 24-hour cache reduces API calls
 * 
 * USAGE:
 * ```typescript
 * const result = await searchConditionsAPI("heart attack");
 * if (result.found) {
 *   console.log(result.primaryName);  // "Myocardial infarction"
 *   console.log(result.icdCodes);     // [{code: "I21.9", name: "..."}]
 * }
 * ```
 */

import { ConditionsAPIResult, CodeType } from '../types/icd';

// =============================================================================
// Configuration
// =============================================================================

/**
 * NIH Medical Conditions API endpoint.
 */
const API_URL = 'https://clinicaltables.nlm.nih.gov/api/conditions/v3/search';

/**
 * Timeout for API calls in milliseconds.
 * 3 seconds is a good balance between UX and reliability.
 */
const API_TIMEOUT_MS = 3000;

/**
 * Maximum number of conditions to fetch from the API.
 */
const MAX_RESULTS = 10;

/**
 * Extra fields to request from the API.
 */
const EXTRA_FIELDS = 'icd10cm_codes,icd10cm,primary_name,synonyms,consumer_name';

/**
 * Cache TTL: 24 hours in milliseconds.
 */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Maximum number of cache entries.
 */
const CACHE_MAX_SIZE = 500;

// =============================================================================
// Cache Implementation
// =============================================================================

/**
 * Cache entry with TTL tracking.
 */
interface CacheEntry {
  result: ConditionsAPIResult;
  timestamp: number;
  query: string; // Original query for debugging
}

/**
 * In-memory cache for Conditions API results.
 * Map maintains insertion order for LRU eviction.
 */
const cache = new Map<string, CacheEntry>();

/**
 * Telemetry counters for monitoring.
 */
let cacheHits = 0;
let cacheMisses = 0;
let apiCalls = 0;
let apiErrors = 0;

/**
 * Normalizes a query string for cache key.
 * - Lowercase
 * - Trim whitespace
 * - Collapse multiple spaces
 * 
 * @param query - Raw search query
 * @returns Normalized cache key
 */
function normalizeCacheKey(query: string): string {
  return query.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Checks if a cache entry is still valid.
 * 
 * @param entry - Cache entry to check
 * @returns True if entry is valid (not expired)
 */
function isCacheValid(entry: CacheEntry): boolean {
  return Date.now() - entry.timestamp < CACHE_TTL_MS;
}

/**
 * Gets a result from cache if valid.
 * 
 * @param key - Normalized cache key
 * @returns Cached result or null if not found/expired
 */
function getFromCache(key: string): ConditionsAPIResult | null {
  const entry = cache.get(key);
  
  if (!entry) {
    return null;
  }
  
  if (!isCacheValid(entry)) {
    cache.delete(key);
    console.log(`[ConditionsAPI:Cache] Expired entry removed: "${key}"`);
    return null;
  }
  
  // Move to end for LRU (delete and re-add to maintain order)
  cache.delete(key);
  cache.set(key, entry);
  
  cacheHits++;
  return entry.result;
}

/**
 * Stores a result in cache with LRU eviction.
 * 
 * @param key - Normalized cache key
 * @param result - Result to cache
 * @param query - Original query (for debugging)
 */
function setInCache(key: string, result: ConditionsAPIResult, query: string): void {
  // Evict oldest entries if at capacity
  if (cache.size >= CACHE_MAX_SIZE) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) {
      cache.delete(oldestKey);
      console.log(`[ConditionsAPI:Cache] LRU eviction: "${oldestKey}"`);
    }
  }
  
  cache.set(key, {
    result,
    timestamp: Date.now(),
    query,
  });
  
  console.log(`[ConditionsAPI:Cache] Stored: "${key}" (${cache.size}/${CACHE_MAX_SIZE} entries)`);
}

/**
 * Clears the entire cache.
 * Useful for testing or forcing fresh data.
 */
export function clearConditionsCache(): void {
  const size = cache.size;
  cache.clear();
  console.log(`[ConditionsAPI:Cache] Cleared ${size} entries`);
}

/**
 * Gets cache statistics for monitoring.
 */
export function getConditionsCacheStats() {
  return {
    size: cache.size,
    maxSize: CACHE_MAX_SIZE,
    hits: cacheHits,
    misses: cacheMisses,
    apiCalls,
    apiErrors,
    hitRate: cacheHits + cacheMisses > 0 
      ? (cacheHits / (cacheHits + cacheMisses) * 100).toFixed(1) + '%'
      : 'N/A',
  };
}

// =============================================================================
// API Response Types (internal)
// =============================================================================

/**
 * Raw API response structure.
 * Format: [totalCount, keyIds, extraFields, displayFields]
 */
interface RawAPIResponse {
  0: number;                    // Total count
  1: string[];                  // Key IDs
  2: {                          // Extra fields
    icd10cm_codes?: string[];
    icd10cm?: Array<Array<{ code: string; name: string }>>;
    primary_name?: string[];
    synonyms?: string[][];
    consumer_name?: string[];
  };
  3: string[][];                // Display fields
}

// =============================================================================
// Response Parsing
// =============================================================================

/**
 * Parses the raw API response into a structured result.
 * 
 * The API returns an unusual array format:
 * [totalCount, keyIds, extraFields, displayFields]
 * 
 * We extract and flatten:
 * - icd10cm: Nested arrays of {code, name} objects
 * - primary_name: Array of clinical names
 * - synonyms: Nested arrays of synonym strings
 * - consumer_name: Array of friendly names
 * 
 * @param response - Raw API response
 * @param originalQuery - The original search query
 * @returns Structured ConditionsAPIResult
 */
function parseResponse(response: RawAPIResponse, originalQuery: string): ConditionsAPIResult {
  const logPrefix = '[ConditionsAPI:Parse]';
  
  try {
    const totalCount = response[0];
    const extraFields = response[2] || {};
    
    // No results found
    if (totalCount === 0) {
      console.log(`${logPrefix} No conditions found for "${originalQuery}"`);
      return createEmptyResult(originalQuery);
    }
    
    // Extract primary names
    const primaryNames = extraFields.primary_name || [];
    const primaryName = primaryNames[0] || null;
    
    // Extract consumer names
    const consumerNames = extraFields.consumer_name || [];
    const consumerName = consumerNames[0] || null;
    
    // Extract and flatten synonyms
    const synonymArrays = extraFields.synonyms || [];
    const allSynonyms = new Set<string>();
    for (const synonymList of synonymArrays) {
      if (Array.isArray(synonymList)) {
        for (const syn of synonymList) {
          if (syn && typeof syn === 'string') {
            allSynonyms.add(syn.toLowerCase());
          }
        }
      }
    }
    
    // Extract and flatten ICD codes
    const icdArrays = extraFields.icd10cm || [];
    const icdCodesMap = new Map<string, string>(); // Dedupe by code
    
    for (const icdList of icdArrays) {
      if (Array.isArray(icdList)) {
        for (const icd of icdList) {
          if (icd && icd.code && icd.name) {
            // Keep first occurrence (usually most relevant)
            if (!icdCodesMap.has(icd.code)) {
              icdCodesMap.set(icd.code, icd.name);
            }
          }
        }
      }
    }
    
    const icdCodes = Array.from(icdCodesMap.entries()).map(([code, name]) => ({
      code,
      name,
    }));
    
    // Build search terms to use
    const searchTermsToUse: string[] = [];
    if (primaryName) {
      searchTermsToUse.push(primaryName);
    }
    // Add original query if different from primary name
    if (primaryName?.toLowerCase() !== originalQuery.toLowerCase()) {
      searchTermsToUse.push(originalQuery);
    }
    
    // Related conditions (other matched conditions)
    const relatedConditions = primaryNames.slice(1, 5); // Skip first (primary)
    
    console.log(`${logPrefix} Found: "${primaryName}" with ${icdCodes.length} ICD codes, ${allSynonyms.size} synonyms`);
    
    return {
      found: true,
      primaryName,
      consumerName,
      synonyms: Array.from(allSynonyms),
      icdCodes,
      searchTermsToUse,
      relatedConditions: relatedConditions.length > 0 ? relatedConditions : undefined,
    };
    
  } catch (error) {
    console.error(`${logPrefix} Parse error:`, error);
    return createEmptyResult(originalQuery);
  }
}

/**
 * Creates an empty result for failed/empty searches.
 * 
 * @param originalQuery - The original search query
 * @returns Empty ConditionsAPIResult
 */
function createEmptyResult(originalQuery: string): ConditionsAPIResult {
  return {
    found: false,
    primaryName: null,
    consumerName: null,
    synonyms: [],
    icdCodes: [],
    searchTermsToUse: [originalQuery],
  };
}

// =============================================================================
// Main API Function
// =============================================================================

/**
 * Searches the NIH Medical Conditions API for a query.
 * 
 * This function:
 * 1. Checks cache first (fast path)
 * 2. Calls API with 3-second timeout
 * 3. Parses response into structured format
 * 4. Caches successful results
 * 5. Returns empty result on error (never throws)
 * 
 * @param query - The search query (e.g., "heart attack", "lung cancer")
 * @returns Promise resolving to ConditionsAPIResult
 * 
 * @example
 * const result = await searchConditionsAPI("heart attack");
 * if (result.found) {
 *   console.log(result.primaryName);  // "Myocardial infarction"
 *   console.log(result.icdCodes);     // [{code: "I21.9", name: "..."}]
 * }
 */
export async function searchConditionsAPI(query: string): Promise<ConditionsAPIResult> {
  const logPrefix = `[ConditionsAPI:${query.slice(0, 20)}]`;
  
  // Input validation
  if (!query || query.trim().length === 0) {
    console.warn(`${logPrefix} Empty query provided`);
    return createEmptyResult('');
  }
  
  const normalizedQuery = query.trim();
  const cacheKey = normalizeCacheKey(normalizedQuery);
  
  // Check cache first
  const cached = getFromCache(cacheKey);
  if (cached) {
    console.log(`${logPrefix} ✅ CACHE HIT`);
    return cached;
  }
  
  cacheMisses++;
  console.log(`${logPrefix} 🔍 Fetching from API...`);
  
  // Build API URL
  const params = new URLSearchParams({
    terms: normalizedQuery,
    maxList: MAX_RESULTS.toString(),
    ef: EXTRA_FIELDS,
  });
  
  const url = `${API_URL}?${params.toString()}`;
  
  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  
  try {
    apiCalls++;
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`${logPrefix} API returned ${response.status}`);
      apiErrors++;
      return createEmptyResult(normalizedQuery);
    }
    
    const data = await response.json() as RawAPIResponse;
    
    // Parse the response
    const result = parseResponse(data, normalizedQuery);
    
    // Cache successful results (even empty ones to avoid repeated calls)
    setInCache(cacheKey, result, normalizedQuery);
    
    if (result.found) {
      console.log(`${logPrefix} ✅ Found: "${result.primaryName}" (${result.icdCodes.length} codes)`);
    } else {
      console.log(`${logPrefix} ⚠️ No conditions found`);
    }
    
    return result;
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    if ((error as Error).name === 'AbortError') {
      console.warn(`${logPrefix} ⏱️ Request timed out after ${API_TIMEOUT_MS}ms`);
    } else {
      console.error(`${logPrefix} ❌ API error:`, error);
    }
    
    apiErrors++;
    return createEmptyResult(normalizedQuery);
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Checks if a query looks like an ICD-10 code.
 * If so, we should skip the Conditions API and go directly to ICD-10 API.
 * 
 * @param query - The search query
 * @returns True if query looks like an ICD-10 code
 * 
 * @example
 * isICD10Code("E11.9")  // true
 * isICD10Code("diabetes")  // false
 * isICD10Code("I21")  // true
 */
export function isICD10Code(query: string): boolean {
  // ICD-10 codes start with a letter followed by digits
  // Pattern: Letter + digit(s) + optional dot + more digits/letters
  const icdPattern = /^[A-Za-z]\d{1,2}(\.[\dA-Za-z]+)?$/;
  return icdPattern.test(query.trim());
}

/**
 * Checks if a query looks like a HCPCS Level II code.
 * 
 * HCPCS Level II codes follow the pattern: one letter (A-V) + exactly 4 digits.
 * This is distinct from ICD-10 codes which have 1-2 digits after the letter.
 * 
 * @param query - The search query
 * @returns True if query looks like a HCPCS Level II code
 * 
 * @example
 * isHCPCSCode("E0607")   // true  — DME glucose monitor
 * isHCPCSCode("J0120")   // true  — Injectable drug
 * isHCPCSCode("A4253")   // true  — Blood glucose test strips
 * isHCPCSCode("E11.9")   // false — ICD-10 code (has dot, only 2 digits before dot)
 * isHCPCSCode("diabetes") // false — Condition name
 * isHCPCSCode("I10")     // false — ICD-10 code (only 2 digits)
 */
export function isHCPCSCode(query: string): boolean {
  // HCPCS Level II: Letter (A-V) followed by exactly 4 digits
  // Letters W, X, Y, Z are not used in HCPCS Level II
  const hcpcsPattern = /^[A-Va-v]\d{4}$/;
  return hcpcsPattern.test(query.trim());
}

/**
 * Detects whether user input is an ICD-10 code, HCPCS code, or condition name.
 * 
 * Detection priority:
 * 1. HCPCS Level II — checked first because its pattern (letter + 4 digits)
 *    is more specific and would NOT match the ICD-10 regex anyway
 * 2. ICD-10-CM — letter + 1-2 digits + optional dot + more characters
 * 3. Condition name — anything else (free text)
 * 
 * @param query - The search query
 * @returns CodeType: 'hcpcs' | 'icd10' | 'condition'
 * 
 * @example
 * detectCodeType("E0607")     // 'hcpcs'     — DME code
 * detectCodeType("J0120")     // 'hcpcs'     — Drug injection code
 * detectCodeType("E11.9")     // 'icd10'     — Diabetes code
 * detectCodeType("I21")       // 'icd10'     — Heart attack code
 * detectCodeType("diabetes")  // 'condition' — Free text
 * detectCodeType("heart attack") // 'condition'
 */
export function detectCodeType(query: string): CodeType {
  const trimmed = query.trim();
  
  if (!trimmed) return 'condition';
  
  // Check HCPCS first (more specific pattern: letter + exactly 4 digits)
  if (isHCPCSCode(trimmed)) return 'hcpcs';
  
  // Check ICD-10 (letter + 1-2 digits + optional dot extension)
  if (isICD10Code(trimmed)) return 'icd10';
  
  // Default: treat as condition name / free text search
  return 'condition';
}

/**
 * Logs telemetry periodically.
 * Call this from the main search function to track performance.
 */
export function logConditionsTelemetry(): void {
  const stats = getConditionsCacheStats();
  console.log(
    `[ConditionsAPI:Telemetry] Cache: ${stats.size}/${stats.maxSize} entries, ` +
    `Hit rate: ${stats.hitRate}, API calls: ${stats.apiCalls}, Errors: ${stats.apiErrors}`
  );
}
