// ============================================================================
// CMS Medicare Coverage Client
// ============================================================================
// Client-side helper that calls our /api/cms-coverage route.
// Same pattern as rxNormApi.ts and other client helpers in this project.
//
// NCDs = National Coverage Determinations (apply everywhere in the US)
// LCDs = Local Coverage Determinations (vary by Medicare contractor/region)
// ============================================================================

// ---------------------------------------------------------------------------
// Types (client-side — clean, camelCase)
// ---------------------------------------------------------------------------

/** A single National Coverage Determination (NCD) summary */
export interface NCDSummary {
  documentId: number;
  version: number;
  displayId: string;          // e.g., "40.1"
  title: string;              // e.g., "Diabetes Outpatient Self-Management Training"
  lastUpdated: string;        // e.g., "11/27/2024"
  url: string;                // Link to full CMS page
  type: 'NCD';
}

/** A single Local Coverage Determination (LCD) summary */
export interface LCDSummary {
  documentId: number;
  version: number;
  displayId: string;          // e.g., "L35132"
  title: string;
  contractorName: string;     // e.g., "Palmetto GBA (HHH MAC)"
  effectiveDate: string;
  retirementDate: string;
  url: string;
  type: 'LCD';
}

/** NCD with full policy details */
export interface NCDDetail {
  documentId: string;
  displayId: string;
  title: string;
  benefitCategory: string;
  effectiveDate: string;
  endDate: string;
  coveragePolicy: string;     // Plain text (HTML stripped)
  coveragePolicyHtml: string; // Original HTML for rich display
  transmittalUrl: string;
}

/** Combined coverage results for a condition */
export interface CoverageResults {
  ncds: NCDSummary[];
  lcds: LCDSummary[];
  totalResults: number;
  searchTerm: string;
}

/** Union type for any coverage item (useful for lists) */
export type CoverageItem = NCDSummary | LCDSummary;

// ---------------------------------------------------------------------------
// Client-side cache (same pattern as other API clients)
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const coverageCache = new Map<string, CacheEntry<CoverageResults>>();
const detailCache = new Map<number, CacheEntry<NCDDetail>>();

function getCached<T>(map: Map<string | number, CacheEntry<T>>, key: string | number): T | null {
  const entry = map.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    map.delete(key);
    return null;
  }
  return entry.data;
}

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

/**
 * Search for Medicare coverage related to a medical condition.
 * Calls our server route which queries the CMS Coverage Database.
 *
 * @param conditionName - The condition to search (e.g., "diabetes mellitus")
 * @returns Combined NCD + LCD results
 */
export async function searchMedicareCoverage(
  conditionName: string
): Promise<CoverageResults> {
  const cacheKey = conditionName.toLowerCase().trim();

  // Check client-side cache
  const cached = getCached(coverageCache, cacheKey);
  if (cached) return cached;

  try {
    const params = new URLSearchParams({ condition: conditionName });
    const response = await fetch(`/api/cms-coverage?${params}`);

    if (!response.ok) {
      throw new Error(`CMS Coverage API returned ${response.status}`);
    }

    const data: CoverageResults = await response.json();

    // Cache the result
    coverageCache.set(cacheKey, { data, timestamp: Date.now() });

    return data;
  } catch (error) {
    console.error('[CMS Coverage] Search failed:', error);
    return {
      ncds: [],
      lcds: [],
      totalResults: 0,
      searchTerm: conditionName,
    };
  }
}

/**
 * Get full details for a specific NCD (National Coverage Determination).
 * Returns the complete policy text and metadata.
 *
 * @param documentId - The NCD document ID (e.g., 251)
 * @param version - Optional version number
 * @returns Full NCD detail or null
 */
export async function getNCDDetail(
  documentId: number,
  version?: number
): Promise<NCDDetail | null> {
  // Check cache
  const cached = getCached(detailCache, documentId);
  if (cached) return cached;

  try {
    const params = new URLSearchParams({ ncdId: documentId.toString() });
    if (version) params.set('version', version.toString());

    const response = await fetch(`/api/cms-coverage?${params}`);

    if (!response.ok) {
      throw new Error(`NCD detail fetch returned ${response.status}`);
    }

    const data: NCDDetail = await response.json();
    detailCache.set(documentId, { data, timestamp: Date.now() });

    return data;
  } catch (error) {
    console.error('[CMS Coverage] Detail fetch failed:', error);
    return null;
  }
}

/**
 * Extract a clean condition name from an ICD-10 description.
 * Strips common prefixes/suffixes to get better CMS search results.
 *
 * Example:
 *   "Type 2 diabetes mellitus without complications" → "diabetes mellitus"
 *   "Essential (primary) hypertension" → "hypertension"
 */
export function extractConditionForCoverage(icdDescription: string): string {
  return icdDescription
    .replace(/\b(type\s*[12]|unspecified|without complications|with .+|essential)\b/gi, '')
    .replace(/\([^)]*\)/g, '')   // Remove parenthetical text
    .replace(/\s+/g, ' ')
    .trim();
}
