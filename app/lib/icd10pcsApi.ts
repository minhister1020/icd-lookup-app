/**
 * ICD-10-PCS API Client
 *
 * Uses the NLM ClinicalTables API to search ICD-10-PCS procedure codes.
 * ICD-10-PCS covers INPATIENT hospital procedures (surgeries, insertions,
 * removals, etc.). These are the codes hospitals use for billing.
 *
 * API Docs: https://clinicaltables.nlm.nih.gov/apidoc/icd10pcs/v3/doc.html
 *
 * This is a FREE public API — no authentication required.
 * Same API pattern as our existing ICD-10-CM search in api.ts and hcpcsApi.ts.
 *
 * Note: ICD-10-PCS codes are 7 characters long and ONLY for inpatient procedures.
 * For outpatient procedures and equipment, see hcpcsApi.ts (HCPCS Level II).
 *
 * @module icd10pcsApi
 */

import { ProcedureResult, CachedProcedures } from '../types/icd';

// ============================================================
// Constants
// ============================================================

const ICD10PCS_API_BASE = 'https://clinicaltables.nlm.nih.gov/api/icd10pcs/v3/search';

/** Cache ICD-10-PCS results for 24 hours */
const ICD10PCS_CACHE_TTL = 24 * 60 * 60 * 1000;

/** Maximum results to fetch per query */
const MAX_RESULTS = 50;

/** Request timeout in milliseconds */
const REQUEST_TIMEOUT = 5000;

// ============================================================
// Cache
// ============================================================

const pcsCache = new Map<string, CachedProcedures>();

function isCacheValid(cached: CachedProcedures): boolean {
  return Date.now() - cached.timestamp < ICD10PCS_CACHE_TTL;
}

// ============================================================
// API Functions
// ============================================================

/**
 * Search ICD-10-PCS procedure codes by keyword.
 *
 * ClinicalTables response format is the same as HCPCS:
 * [0] = total count
 * [1] = array of matched codes
 * [2] = extra fields object
 * [3] = array of display strings
 *
 * Example: searching "insulin pump" returns codes like 3E0436Z (Introduction
 * of insulin into peripheral vein).
 *
 * @param query - Search term (e.g., "amputation", "bypass", "drainage")
 * @param maxResults - Max results to return (default 50)
 * @returns Array of ProcedureResult objects with codeSystem = 'ICD10PCS'
 */
export async function searchIcd10Pcs(
  query: string,
  maxResults: number = MAX_RESULTS
): Promise<ProcedureResult[]> {
  if (!query || query.trim().length === 0) return [];

  const cacheKey = `pcs:${query.toLowerCase().trim()}:${maxResults}`;

  // Check cache first
  const cached = pcsCache.get(cacheKey);
  if (cached && isCacheValid(cached)) {
    return cached.data;
  }

  try {
    const params = new URLSearchParams({
      terms: query.trim(),
      maxList: maxResults.toString(),
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(`${ICD10PCS_API_BASE}?${params}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`[ICD10PCS] API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();

    // ClinicalTables response: [totalCount, codes[], extraFields, displayStrings[][]]
    const totalCount: number = data[0] || 0;
    const codes: string[] = data[1] || [];
    // ICD-10-PCS display strings come in data[3] as [code, description] pairs
    const displayStrings: string[][] = data[3] || [];

    if (totalCount === 0 || codes.length === 0) {
      // Negative caching
      pcsCache.set(cacheKey, { data: [], timestamp: Date.now() });
      return [];
    }

    const results: ProcedureResult[] = codes.map((code, index) => {
      // Display strings are [code, description] pairs
      const displayPair = displayStrings[index] || [];
      const description = displayPair[1] || displayPair[0] || 'No description available';

      return {
        code: code.trim(),
        codeSystem: 'ICD10PCS' as const,
        description: description.trim(),
        category: categorizeIcd10PcsCode(code),
        relevanceScore: -1, // Will be scored by AI relevance agent later
        source: 'clinicaltables' as const,
        setting: 'inpatient' as const, // ICD-10-PCS is always inpatient
      };
    });

    // Cache results
    pcsCache.set(cacheKey, { data: results, timestamp: Date.now() });

    return results;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[ICD10PCS] Request timed out');
    } else {
      console.error('[ICD10PCS] Search error:', error);
    }
    return [];
  }
}

/**
 * Look up a specific ICD-10-PCS code by exact value.
 * Useful for validating AI-suggested codes.
 *
 * @param code - Exact 7-character ICD-10-PCS code (e.g., "0DTJ4ZZ")
 * @returns Single ProcedureResult or null if not found
 */
export async function lookupIcd10PcsCode(code: string): Promise<ProcedureResult | null> {
  if (!code || code.trim().length === 0) return null;

  const results = await searchIcd10Pcs(code.trim(), 5);

  // Find exact match
  const exactMatch = results.find(
    (r) => r.code.toUpperCase() === code.trim().toUpperCase()
  );

  return exactMatch || null;
}

// ============================================================
// ICD-10-PCS Code Categorization
// ============================================================

/**
 * Categorize ICD-10-PCS code by its first character (Section).
 *
 * ICD-10-PCS codes are 7 characters. The FIRST character is the Section:
 * - 0: Medical and Surgical (most common — surgeries, biopsies, etc.)
 * - 1: Obstetrics
 * - 2: Placement (casts, splints, packing)
 * - 3: Administration (transfusions, infusions, injections)
 * - 4: Measurement and Monitoring
 * - 5: Extracorporeal/Systemic Assistance (ventilators, ECMO, pacemakers)
 * - 6: Extracorporeal/Systemic Therapies (dialysis, phototherapy)
 * - 7: Osteopathic
 * - 8: Other Procedures (acupuncture, chiropractic)
 * - 9: Chiropractic
 * - B: Imaging (X-ray, CT, MRI, ultrasound)
 * - C: Nuclear Medicine
 * - D: Radiation Therapy
 * - F: Physical Rehabilitation
 * - G: Mental Health
 * - H: Substance Abuse Treatment
 * - X: New Technology
 */
function categorizeIcd10PcsCode(code: string): 'diagnostic' | 'therapeutic' | 'monitoring' | 'equipment' | 'other' {
  if (!code || code.length === 0) return 'other';

  const section = code.charAt(0).toUpperCase();

  switch (section) {
    // Diagnostic — imaging, nuclear medicine, measurement
    case 'B': // Imaging
    case 'C': // Nuclear Medicine
      return 'diagnostic';

    // Monitoring — measurement, monitoring, rehab assessment
    case '4': // Measurement and Monitoring
      return 'monitoring';

    // Therapeutic — surgeries, treatments, therapies
    case '0': // Medical and Surgical
    case '1': // Obstetrics
    case '2': // Placement
    case '3': // Administration
    case '5': // Extracorporeal Assistance
    case '6': // Extracorporeal Therapies
    case 'D': // Radiation Therapy
    case 'F': // Physical Rehabilitation
    case 'G': // Mental Health
    case 'H': // Substance Abuse Treatment
    case 'X': // New Technology
      return 'therapeutic';

    // Other
    case '7': // Osteopathic
    case '8': // Other Procedures
    case '9': // Chiropractic
    default:
      return 'other';
  }
}

// ============================================================
// Cache Management
// ============================================================

/** Clear the entire ICD-10-PCS cache */
export function clearIcd10PcsCache(): void {
  pcsCache.clear();
}

/** Get cache statistics for debugging */
export function getIcd10PcsCacheStats(): { size: number; entries: string[] } {
  return {
    size: pcsCache.size,
    entries: Array.from(pcsCache.keys()),
  };
}
