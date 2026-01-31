/**
 * Drug Validation Pipeline
 * ========================
 * 
 * Orchestrates the full drug validation flow:
 * 1. Check in-memory cache for existing results
 * 2. Get candidate drugs from curated condition-drug mappings
 * 3. Fetch drug details from RxNorm API
 * 4. Score relevance with Claude AI
 * 5. Filter by confidence threshold
 * 6. Cache and return validated results
 * 
 * Design Principles:
 * - Curated accuracy: Drug mappings ensure relevant drugs for each condition
 * - RxNorm integration: Complete drug names (brand + generic)
 * - AI validation: Claude scores clinical relevance
 * - Graceful degradation: If AI fails, return unfiltered results
 * - Never throw: UI should never break due to validation failures
 * - Comprehensive logging: Debug issues in production
 * - Caching: Avoid redundant API calls (24-hour TTL)
 */

import { getDrugsForCondition } from './conditionDrugMappings';
import { searchMultipleRxNormDrugs, RxNormDrug } from './rxNormApi';
import { scoreDrugRelevance, DrugScore } from './drugRelevanceAgent';
import { DrugResult } from '../types/icd';

// =============================================================================
// Configuration
// =============================================================================

/**
 * Minimum relevance score for FDA-approved drugs (0-10 scale).
 * Score 7+ means: FDA-approved for this specific indication.
 */
const FDA_APPROVED_THRESHOLD = 7;

/**
 * Minimum relevance score for off-label drugs (0-10 scale).
 * Score 4-6 means: Commonly prescribed off-label for this condition.
 * Below 4: Not clinically relevant, exclude.
 */
const OFF_LABEL_THRESHOLD = 4;

/**
 * Maximum number of validated drugs to return.
 * Increased to accommodate both FDA-approved and off-label options.
 */
const MAX_RESULTS = 8;

/**
 * Maximum number of drugs to fetch from curated mappings.
 * The mappings already have the most relevant drugs first.
 */
const FETCH_LIMIT = 10;

// =============================================================================
// Cache Configuration
// =============================================================================

/**
 * Cache time-to-live in milliseconds.
 * 24 hours balances data freshness with API cost savings.
 */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Maximum number of ICD codes to cache.
 * Prevents unbounded memory growth.
 */
const CACHE_MAX_SIZE = 500;

/**
 * Log cache stats every N operations for monitoring.
 */
const CACHE_STATS_LOG_INTERVAL = 100;

// =============================================================================
// Types
// =============================================================================

/**
 * Extended DrugResult with relevance score from AI validation.
 */
export interface ValidatedDrugResult extends DrugResult {
  /** Relevance score from Claude AI (0-10 scale) */
  relevanceScore: number;
  /** Brief reasoning from Claude about the score */
  relevanceReasoning?: string;
}

/**
 * Export thresholds so UI can categorize drugs.
 * - Score >= FDA_APPROVED_THRESHOLD: FDA-approved for this indication
 * - Score >= OFF_LABEL_THRESHOLD but < FDA_APPROVED_THRESHOLD: Off-label use
 */
export const DRUG_SCORE_THRESHOLDS = {
  FDA_APPROVED: FDA_APPROVED_THRESHOLD,
  OFF_LABEL: OFF_LABEL_THRESHOLD,
} as const;

/**
 * Cached validation result with metadata.
 */
interface CachedValidation {
  /** Validated drugs array */
  drugs: ValidatedDrugResult[];
  /** Unix timestamp when cached */
  timestamp: number;
  /** Original condition name (for debugging) */
  conditionName: string;
}

// =============================================================================
// In-Memory Cache
// =============================================================================

/**
 * In-memory cache for validated drug results.
 * Key: Normalized ICD code (e.g., "E66.2")
 * Value: Cached validation with timestamp
 * 
 * Note: This cache is lost on server restart. For persistence,
 * consider upgrading to Redis or database storage.
 */
const validationCache = new Map<string, CachedValidation>();

/**
 * Counter for cache operations (for periodic stats logging).
 */
let cacheOperationCount = 0;

// =============================================================================
// Cache Helper Functions
// =============================================================================

/**
 * Normalizes ICD code for consistent cache keys.
 * @param icdCode - Raw ICD code
 * @returns Normalized cache key (uppercase, trimmed)
 */
function getCacheKey(icdCode: string): string {
  return icdCode.toUpperCase().trim();
}

/**
 * Checks if a cached entry is still valid (not expired).
 * @param cached - Cached validation entry
 * @returns True if cache is still valid
 */
function isCacheValid(cached: CachedValidation): boolean {
  const now = Date.now();
  const age = now - cached.timestamp;
  return age < CACHE_TTL_MS;
}

/**
 * Calculates cache entry age in human-readable format.
 * @param cached - Cached validation entry
 * @returns Age string (e.g., "2.3 hours")
 */
function getCacheAge(cached: CachedValidation): string {
  const ageMs = Date.now() - cached.timestamp;
  const ageHours = ageMs / (1000 * 60 * 60);
  
  if (ageHours < 1) {
    const ageMinutes = ageMs / (1000 * 60);
    return `${ageMinutes.toFixed(1)} minutes`;
  }
  return `${ageHours.toFixed(1)} hours`;
}

/**
 * Removes expired entries when cache exceeds max size.
 * Uses LRU-style eviction: removes oldest entries first.
 */
function cleanExpiredCache(): void {
  if (validationCache.size <= CACHE_MAX_SIZE) {
    return; // No cleanup needed
  }

  const now = Date.now();
  const entriesToDelete: string[] = [];

  // First pass: identify expired entries
  for (const [key, entry] of validationCache.entries()) {
    if (!isCacheValid(entry)) {
      entriesToDelete.push(key);
    }
  }

  // Delete expired entries
  for (const key of entriesToDelete) {
    validationCache.delete(key);
  }

  console.log(`[DrugPipeline:Cache] Cleaned ${entriesToDelete.length} expired entries`);

  // If still over limit, remove oldest entries
  if (validationCache.size > CACHE_MAX_SIZE) {
    const entries = Array.from(validationCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp); // Oldest first

    const toRemove = entries.slice(0, validationCache.size - CACHE_MAX_SIZE);
    for (const [key] of toRemove) {
      validationCache.delete(key);
    }

    console.log(`[DrugPipeline:Cache] Evicted ${toRemove.length} oldest entries (LRU)`);
  }
}

/**
 * Gets current cache statistics.
 * @returns Object with total, valid, and expired counts
 */
export function getCacheStats(): { total: number; valid: number; expired: number } {
  let validCount = 0;
  let expiredCount = 0;

  for (const entry of validationCache.values()) {
    if (isCacheValid(entry)) {
      validCount++;
    } else {
      expiredCount++;
    }
  }

  return {
    total: validationCache.size,
    valid: validCount,
    expired: expiredCount,
  };
}

/**
 * Logs cache statistics periodically.
 */
function maybeLogCacheStats(): void {
  cacheOperationCount++;
  
  if (cacheOperationCount % CACHE_STATS_LOG_INTERVAL === 0) {
    const stats = getCacheStats();
    console.log(
      `[DrugPipeline:Cache] Stats after ${cacheOperationCount} ops: ` +
      `${stats.valid} valid, ${stats.expired} expired, ${stats.total} total`
    );
  }
}

/**
 * Clears the entire validation cache.
 * Useful for testing or forcing fresh data.
 */
export function clearCache(): void {
  const size = validationCache.size;
  validationCache.clear();
  cacheOperationCount = 0;
  console.log(`[DrugPipeline:Cache] Cleared ${size} entries`);
}

/**
 * Gets the current cache size.
 * @returns Number of cached ICD codes
 */
export function getCacheSize(): number {
  return validationCache.size;
}

// =============================================================================
// Main Pipeline Function
// =============================================================================

/**
 * Validates drugs for a medical condition using AI-powered relevance scoring.
 * 
 * This is the main entry point for drug validation. It:
 * 1. Fetches drug candidates from OpenFDA
 * 2. Scores each drug's relevance using Claude AI
 * 3. Filters to only clinically relevant drugs
 * 4. Returns sorted results
 * 
 * @param conditionName - The medical condition (e.g., "Type 2 diabetes mellitus")
 * @param icdCode - The ICD-10 code (e.g., "E11.9") - used for logging
 * @returns Promise resolving to validated, filtered drug results
 * 
 * @example
 * const drugs = await validateDrugs(
 *   "Morbid (severe) obesity",
 *   "E66.2"
 * );
 * // Returns [Wegovy, Saxenda, ...] but NOT Naproxen (which scores 0)
 */
export async function validateDrugs(
  conditionName: string,
  icdCode: string
): Promise<ValidatedDrugResult[]> {
  const logPrefix = `[DrugPipeline:${icdCode}]`;
  const cacheKey = getCacheKey(icdCode);

  try {
    // =========================================================================
    // Step 1: Check cache first
    // =========================================================================
    maybeLogCacheStats();
    
    const cached = validationCache.get(cacheKey);
    if (cached) {
      if (isCacheValid(cached)) {
        // Cache hit - return cached results immediately
        const age = getCacheAge(cached);
        console.log(`${logPrefix} Cache HIT, returning ${cached.drugs.length} cached drugs (age: ${age})`);
        return cached.drugs;
      } else {
        // Cache expired - remove and fetch fresh
        const age = getCacheAge(cached);
        console.log(`${logPrefix} Cache EXPIRED (age: ${age}), fetching fresh data`);
        validationCache.delete(cacheKey);
      }
    } else {
      console.log(`${logPrefix} Cache MISS, fetching fresh data`);
    }

    // =========================================================================
    // Step 2: Get drug candidates from curated mappings
    // =========================================================================
    console.log(`${logPrefix} Fetching drugs for: "${conditionName}"`);
    
    const candidateDrugNames = getDrugsForCondition(conditionName);
    
    if (candidateDrugNames.length === 0) {
      console.log(`${logPrefix} No drug mappings found for condition`);
      // Cache empty result to avoid repeated lookups
      storeInCache(cacheKey, [], conditionName, logPrefix);
      return [];
    }
    
    // Limit to FETCH_LIMIT drugs
    const drugsToFetch = candidateDrugNames.slice(0, FETCH_LIMIT);
    console.log(`${logPrefix} Found ${drugsToFetch.length} candidate drugs from mappings`);
    
    // =========================================================================
    // Step 3: Fetch drug details from RxNorm
    // =========================================================================
    let rxNormDrugs: RxNormDrug[];
    try {
      rxNormDrugs = await searchMultipleRxNormDrugs(drugsToFetch);
    } catch (fetchError) {
      console.error(`${logPrefix} RxNorm fetch failed:`, fetchError);
      return [];
    }
    
    if (rxNormDrugs.length === 0) {
      console.log(`${logPrefix} No drugs found in RxNorm`);
      storeInCache(cacheKey, [], conditionName, logPrefix);
      return [];
    }
    
    console.log(`${logPrefix} Fetched ${rxNormDrugs.length} drugs from RxNorm`);
    
    // Convert RxNorm drugs to DrugResult format
    const rawDrugs: DrugResult[] = rxNormDrugs.map(rxDrug => ({
      brandName: rxDrug.brandName,
      genericName: rxDrug.genericName,
      manufacturer: 'Various', // RxNorm doesn't provide manufacturer
      indication: rxDrug.dosageForm ? `${rxDrug.dosageForm}${rxDrug.strength ? ` - ${rxDrug.strength}` : ''}` : 'Prescription medication',
      warnings: undefined,
    }));

    // =========================================================================
    // Step 3: Prepare drugs for AI scoring
    // =========================================================================
    const drugInputs = rawDrugs.map(drug => ({
      brandName: drug.brandName,
      genericName: drug.genericName,
    }));

    // =========================================================================
    // Step 4: Score drugs with Claude AI
    // =========================================================================
    let scores: DrugScore[];
    try {
      scores = await scoreDrugRelevance(conditionName, drugInputs);
    } catch (scoreError) {
      // Graceful degradation: If AI fails, return unfiltered results
      console.warn(`${logPrefix} AI scoring failed, returning unfiltered results:`, scoreError);
      const unfilteredDrugs = rawDrugs.map(drug => ({
        ...drug,
        relevanceScore: -1, // Indicate score not available
      }));
      // Don't cache AI failures - retry next time
      return unfilteredDrugs;
    }

    if (scores.length === 0) {
      // AI returned no scores - use unfiltered results
      console.warn(`${logPrefix} AI returned no scores, returning unfiltered results`);
      const unfilteredDrugs = rawDrugs.map(drug => ({
        ...drug,
        relevanceScore: -1,
      }));
      // Don't cache empty AI responses - retry next time
      return unfilteredDrugs;
    }

    console.log(`${logPrefix} Received ${scores.length} scores from AI`);

    // =========================================================================
    // Step 5: Match scores back to original drugs
    // =========================================================================
    const scoreMap = buildScoreMap(scores);
    
    const scoredDrugs: ValidatedDrugResult[] = rawDrugs.map(drug => {
      const matchedScore = findMatchingScore(drug, scoreMap);
      return {
        ...drug,
        relevanceScore: matchedScore?.score ?? -1,
        relevanceReasoning: matchedScore?.reasoning,
      };
    });

    // =========================================================================
    // Step 6: Filter by relevance threshold (include both FDA-approved and off-label)
    // =========================================================================
    
    // Include all drugs with score >= OFF_LABEL_THRESHOLD (4+)
    // This captures both FDA-approved (7-10) and commonly used off-label (4-6)
    const filteredDrugs = scoredDrugs.filter(
      drug => drug.relevanceScore >= OFF_LABEL_THRESHOLD
    );

    // Log breakdown by category
    const fdaApproved = filteredDrugs.filter(d => d.relevanceScore >= FDA_APPROVED_THRESHOLD).length;
    const offLabel = filteredDrugs.filter(d => d.relevanceScore >= OFF_LABEL_THRESHOLD && d.relevanceScore < FDA_APPROVED_THRESHOLD).length;
    
    console.log(`${logPrefix} ${fdaApproved} FDA-approved (≥${FDA_APPROVED_THRESHOLD}), ${offLabel} off-label (${OFF_LABEL_THRESHOLD}-${FDA_APPROVED_THRESHOLD - 1})`);

    // If no drugs meet minimum threshold, cache empty and return
    if (filteredDrugs.length === 0) {
      console.log(`${logPrefix} No drugs met relevance threshold for this condition`);
      storeInCache(cacheKey, [], conditionName, logPrefix);
      return [];
    }

    // =========================================================================
    // Step 7: Sort and limit results
    // =========================================================================
    const finalDrugs = filteredDrugs
      .sort((a, b) => b.relevanceScore - a.relevanceScore) // Highest score first
      .slice(0, MAX_RESULTS);

    // =========================================================================
    // Step 8: Store in cache before returning
    // =========================================================================
    storeInCache(cacheKey, finalDrugs, conditionName, logPrefix);

    console.log(`${logPrefix} Returning ${finalDrugs.length} validated drugs`);

    return finalDrugs;

  } catch (error) {
    // Catch-all for unexpected errors
    console.error(`${logPrefix} Unexpected pipeline error:`, error);
    return [];
  }
}

/**
 * Stores validated drugs in cache.
 * Handles cache cleanup if size limit exceeded.
 */
function storeInCache(
  cacheKey: string,
  drugs: ValidatedDrugResult[],
  conditionName: string,
  logPrefix: string
): void {
  try {
    // Clean expired entries if cache is getting full
    cleanExpiredCache();

    // Store new entry
    validationCache.set(cacheKey, {
      drugs,
      timestamp: Date.now(),
      conditionName,
    });

    console.log(`${logPrefix} Cached ${drugs.length} validated drugs`);
  } catch (cacheError) {
    // Cache errors should never break the pipeline
    console.warn(`${logPrefix} Failed to cache results:`, cacheError);
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Builds a Map for fast score lookups.
 * 
 * Creates multiple lookup keys for each score:
 * - Original drugName from Claude
 * - Normalized (lowercase, no spaces) version
 * - Brand name only
 * - Generic name only
 * 
 * @param scores - Array of DrugScore objects from Claude
 * @returns Map of normalized drug names to scores
 */
function buildScoreMap(scores: DrugScore[]): Map<string, DrugScore> {
  const map = new Map<string, DrugScore>();

  for (const score of scores) {
    // Add original key
    map.set(score.drugName.toLowerCase(), score);

    // Extract brand and generic from "Brand (Generic)" format
    const match = score.drugName.match(/^(.+?)\s*\((.+?)\)$/);
    if (match) {
      const [, brand, generic] = match;
      map.set(brand.toLowerCase().trim(), score);
      map.set(generic.toLowerCase().trim(), score);
    }

    // Also add normalized version (no spaces, lowercase)
    const normalized = score.drugName.toLowerCase().replace(/\s+/g, '');
    map.set(normalized, score);
  }

  return map;
}

/**
 * Finds a matching score for a drug using multiple lookup strategies.
 * 
 * @param drug - The DrugResult to find a score for
 * @param scoreMap - Map of drug names to scores
 * @returns The matching DrugScore or undefined if no match
 */
function findMatchingScore(
  drug: DrugResult,
  scoreMap: Map<string, DrugScore>
): DrugScore | undefined {
  // Strategy 1: Try exact "Brand (Generic)" format
  const fullName = `${drug.brandName} (${drug.genericName})`.toLowerCase();
  if (scoreMap.has(fullName)) {
    return scoreMap.get(fullName);
  }

  // Strategy 2: Try brand name only
  const brandLower = drug.brandName.toLowerCase();
  if (scoreMap.has(brandLower)) {
    return scoreMap.get(brandLower);
  }

  // Strategy 3: Try generic name only
  const genericLower = drug.genericName.toLowerCase();
  if (scoreMap.has(genericLower)) {
    return scoreMap.get(genericLower);
  }

  // Strategy 4: Try normalized (no spaces)
  const normalizedBrand = brandLower.replace(/\s+/g, '');
  if (scoreMap.has(normalizedBrand)) {
    return scoreMap.get(normalizedBrand);
  }

  const normalizedGeneric = genericLower.replace(/\s+/g, '');
  if (scoreMap.has(normalizedGeneric)) {
    return scoreMap.get(normalizedGeneric);
  }

  // Strategy 5: Fuzzy match - find any key containing the brand name
  for (const [key, score] of scoreMap.entries()) {
    if (key.includes(brandLower) || brandLower.includes(key)) {
      return score;
    }
  }

  // No match found
  console.warn(`[DrugPipeline] No score match for: ${drug.brandName} (${drug.genericName})`);
  return undefined;
}

// =============================================================================
// Utility Export for Testing
// =============================================================================

/**
 * Validates drugs without AI (for testing or when AI is disabled).
 * Returns drugs from curated mappings + RxNorm without AI scoring.
 * 
 * @param conditionName - The medical condition
 * @param icdCode - The ICD-10 code
 * @returns Promise resolving to unvalidated drug results
 */
export async function fetchDrugsWithoutValidation(
  conditionName: string,
  icdCode: string
): Promise<ValidatedDrugResult[]> {
  const logPrefix = `[DrugPipeline:${icdCode}]`;
  
  try {
    // Get candidate drugs from curated mappings
    const candidateDrugNames = getDrugsForCondition(conditionName);
    
    if (candidateDrugNames.length === 0) {
      console.log(`${logPrefix} No drug mappings found (no AI validation)`);
      return [];
    }
    
    // Fetch from RxNorm
    const drugsToFetch = candidateDrugNames.slice(0, MAX_RESULTS);
    const rxNormDrugs = await searchMultipleRxNormDrugs(drugsToFetch);
    
    console.log(`${logPrefix} Fetched ${rxNormDrugs.length} drugs (no AI validation)`);
    
    return rxNormDrugs.map(rxDrug => ({
      brandName: rxDrug.brandName,
      genericName: rxDrug.genericName,
      manufacturer: 'Various',
      indication: rxDrug.dosageForm ? `${rxDrug.dosageForm}${rxDrug.strength ? ` - ${rxDrug.strength}` : ''}` : 'Prescription medication',
      warnings: undefined,
      relevanceScore: -1, // Indicate no AI scoring
    }));
  } catch (error) {
    console.error(`${logPrefix} Fetch failed:`, error);
    return [];
  }
}
