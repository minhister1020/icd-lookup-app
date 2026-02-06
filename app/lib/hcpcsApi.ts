/**
 * HCPCS Level II API Client
 *
 * Uses the NLM ClinicalTables API to search HCPCS Level II codes.
 * HCPCS covers outpatient services, equipment, and supplies (e.g., glucose monitors,
 * wheelchairs, injectable drugs administered by providers).
 *
 * API Docs: https://clinicaltables.nlm.nih.gov/apidoc/hcpcs/v3/doc.html
 *
 * This is a FREE public API — no authentication required.
 * Same API pattern as our existing ICD-10-CM search in api.ts.
 *
 * @module hcpcsApi
 */

import { ProcedureResult, CachedProcedures } from '../types/icd';

// ============================================================
// Constants
// ============================================================

const HCPCS_API_BASE = 'https://clinicaltables.nlm.nih.gov/api/hcpcs/v3/search';

/** Cache HCPCS results for 24 hours (same as drug ingredient cache) */
const HCPCS_CACHE_TTL = 24 * 60 * 60 * 1000;

/** Maximum results to fetch per query */
const MAX_RESULTS = 50;

/** Request timeout in milliseconds */
const REQUEST_TIMEOUT = 5000;

// ============================================================
// Cache
// ============================================================

const hcpcsCache = new Map<string, CachedProcedures>();

function isCacheValid(cached: CachedProcedures): boolean {
  return Date.now() - cached.timestamp < HCPCS_CACHE_TTL;
}

// ============================================================
// API Functions
// ============================================================

/**
 * Search HCPCS Level II codes by keyword.
 *
 * ClinicalTables returns an array of 4 elements:
 * [0] = total count of matches
 * [1] = array of matched codes
 * [2] = extra field values (null if not requested)
 * [3] = array of [code, shortDescription, longDescription] arrays
 *
 * Example: searching "glucose monitor" returns codes like E0607, E2100, etc.
 *
 * @param query - Search term (e.g., "glucose monitor", "insulin pump", "wheelchair")
 * @param maxResults - Max results to return (default 50)
 * @returns Array of ProcedureResult objects with codeSystem = 'HCPCS'
 */
export async function searchHcpcs(
  query: string,
  maxResults: number = MAX_RESULTS
): Promise<ProcedureResult[]> {
  if (!query || query.trim().length === 0) return [];

  const cacheKey = `hcpcs:${query.toLowerCase().trim()}:${maxResults}`;

  // Check cache first
  const cached = hcpcsCache.get(cacheKey);
  if (cached && isCacheValid(cached)) {
    return cached.data;
  }

  try {
    const params = new URLSearchParams({
      terms: query.trim(),
      maxList: maxResults.toString(),
      // Request extra fields: short description, long description
      ef: 'short_desc,long_desc,add_dt,term_dt',
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(`${HCPCS_API_BASE}?${params}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`[HCPCS] API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();

    // ClinicalTables response format: [totalCount, codes[], null, displayStrings[][]]
    const totalCount: number = data[0] || 0;
    const codes: string[] = data[1] || [];
    const extraFields: Record<string, string[]> = data[2] || {};

    if (totalCount === 0 || codes.length === 0) {
      // Cache empty results too (negative caching)
      hcpcsCache.set(cacheKey, { data: [], timestamp: Date.now() });
      return [];
    }

    const shortDescs: string[] = extraFields['short_desc'] || [];
    const longDescs: string[] = extraFields['long_desc'] || [];
    const termDates: string[] = extraFields['term_dt'] || [];

    const results: ProcedureResult[] = codes.map((code, index) => {
      // Use long description if available, fall back to short
      const description = longDescs[index] || shortDescs[index] || 'No description available';
      const isActive = !termDates[index]; // No termination date = still active

      return {
        code: code.trim(),
        codeSystem: 'HCPCS' as const,
        description: description.trim(),
        category: categorizeHcpcsCode(code),
        relevanceScore: -1, // Will be scored by the AI relevance agent later
        source: 'clinicaltables' as const,
        setting: 'outpatient' as const, // HCPCS is primarily outpatient
        isActive,
      };
    });

    // Cache the results
    hcpcsCache.set(cacheKey, { data: results, timestamp: Date.now() });

    return results;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[HCPCS] Request timed out');
    } else {
      console.error('[HCPCS] Search error:', error);
    }
    return [];
  }
}

/**
 * Look up a specific HCPCS code by exact code value.
 * Useful for validating AI-suggested codes.
 *
 * @param code - Exact HCPCS code (e.g., "E0607")
 * @returns Single ProcedureResult or null if not found
 */
export async function lookupHcpcsCode(code: string): Promise<ProcedureResult | null> {
  if (!code || code.trim().length === 0) return null;

  const results = await searchHcpcs(code.trim(), 5);

  // Find exact match (ClinicalTables search is fuzzy)
  const exactMatch = results.find(
    (r) => r.code.toUpperCase() === code.trim().toUpperCase()
  );

  return exactMatch || null;
}

// ============================================================
// HCPCS Code Categorization
// ============================================================

/**
 * Categorize HCPCS code by its prefix letter.
 *
 * HCPCS Level II codes start with a letter:
 * - A: Transportation, medical/surgical supplies, miscellaneous
 * - B: Enteral and parenteral therapy
 * - C: Outpatient PPS (temporary hospital codes)
 * - D: Dental procedures
 * - E: Durable Medical Equipment (DME)
 * - G: Procedures/professional services (temporary)
 * - H: Behavioral health services
 * - J: Drugs administered by provider (not self-administered)
 * - K: DME (temporary)
 * - L: Orthotic/prosthetic procedures
 * - M: Medical services
 * - P: Pathology/laboratory services
 * - Q: Miscellaneous/temporary codes
 * - R: Diagnostic radiology services
 * - S: Private payer codes (temporary)
 * - T: State Medicaid agency codes
 * - U: Coronavirus-related codes
 * - V: Vision/hearing services
 */
function categorizeHcpcsCode(code: string): 'diagnostic' | 'therapeutic' | 'monitoring' | 'equipment' | 'other' {
  if (!code || code.length === 0) return 'other';

  const prefix = code.charAt(0).toUpperCase();

  switch (prefix) {
    // Equipment and supplies
    case 'A': // Medical/surgical supplies
    case 'E': // Durable Medical Equipment
    case 'K': // DME temporary
    case 'L': // Orthotics/prosthetics
      return 'equipment';

    // Diagnostic
    case 'P': // Pathology/lab
    case 'R': // Diagnostic radiology
      return 'diagnostic';

    // Therapeutic
    case 'J': // Drugs administered by provider
    case 'C': // Outpatient PPS
    case 'G': // Procedures/services
    case 'H': // Behavioral health
    case 'S': // Private payer procedures
    case 'T': // State Medicaid procedures
      return 'therapeutic';

    // Monitoring
    case 'M': // Medical services (often monitoring)
    case 'V': // Vision/hearing services
      return 'monitoring';

    // Other
    case 'B': // Enteral/parenteral
    case 'D': // Dental
    case 'Q': // Miscellaneous
    case 'U': // Coronavirus
    default:
      return 'other';
  }
}

// ============================================================
// Cache Management
// ============================================================

/** Clear the entire HCPCS cache */
export function clearHcpcsCache(): void {
  hcpcsCache.clear();
}

/** Get cache statistics for debugging */
export function getHcpcsCacheStats(): { size: number; entries: string[] } {
  return {
    size: hcpcsCache.size,
    entries: Array.from(hcpcsCache.keys()),
  };
}
