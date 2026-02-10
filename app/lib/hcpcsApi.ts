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

import { 
  ProcedureResult, 
  CachedProcedures,
  HCPCSResult, 
  HCPCSCategory, 
  HCPCSCategoryPrefix,
  HCPCSCoverageCode,
  HCPCSPricingIndicator 
} from '../types/icd';

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

// ============================================================
// HCPCS Category Definitions
// ============================================================

/** All HCPCS Level II categories with human-readable descriptions */
const HCPCS_CATEGORIES: Record<HCPCSCategoryPrefix, { name: string; description: string }> = {
  'A': { name: 'Transportation & Supplies', description: 'Transportation, medical/surgical supplies, and miscellaneous' },
  'B': { name: 'Enteral & Parenteral', description: 'Enteral and parenteral therapy supplies and equipment' },
  'C': { name: 'Outpatient PPS', description: 'Temporary outpatient prospective payment system codes' },
  'D': { name: 'Dental Procedures', description: 'Dental procedures and services' },
  'E': { name: 'Durable Medical Equipment', description: 'Durable medical equipment (DME) such as wheelchairs, hospital beds' },
  'G': { name: 'Procedures & Services', description: 'Temporary procedures and professional services' },
  'H': { name: 'Behavioral Health', description: 'Behavioral health and substance abuse treatment services' },
  'J': { name: 'Drugs (Provider-Administered)', description: 'Drugs administered by healthcare providers, not self-administered' },
  'K': { name: 'DME (Temporary)', description: 'Temporary codes for durable medical equipment' },
  'L': { name: 'Orthotics & Prosthetics', description: 'Orthotic and prosthetic procedures and devices' },
  'M': { name: 'Medical Services', description: 'Medical services including quality measures' },
  'P': { name: 'Pathology & Laboratory', description: 'Pathology and laboratory services' },
  'Q': { name: 'Miscellaneous (Temporary)', description: 'Temporary miscellaneous codes' },
  'R': { name: 'Diagnostic Radiology', description: 'Diagnostic radiology services' },
  'S': { name: 'Private Payer Codes', description: 'Temporary codes for private payer use' },
  'T': { name: 'State Medicaid Codes', description: 'Codes established by state Medicaid agencies' },
  'U': { name: 'Coronavirus Codes', description: 'Coronavirus diagnostic and treatment codes' },
  'V': { name: 'Vision & Hearing', description: 'Vision and hearing services and supplies' },
};

/** Human-readable labels for HCPCS coverage codes */
const COVERAGE_CODE_DESCRIPTIONS: Record<string, string> = {
  'C': 'Carrier judgment — coverage determined by local Medicare contractor',
  'B': 'Bundled — not separately payable, included in another service',
  'D': 'Special coverage instructions apply',
  'E': 'Excluded from coverage — not covered by Medicare',
  'I': 'Not valid for Medicare purposes',
  'N': 'Non-covered by Medicare',
  'S': 'Non-covered by Medicare, but billable to beneficiary',
};

/** Human-readable labels for common HCPCS pricing indicators */
const PRICING_INDICATOR_DESCRIPTIONS: Record<string, string> = {
  '00': 'Service not separately priced',
  '11': 'Price established by each carrier',
  '12': 'Price by carrier, subject to limitation',
  '21': 'Price set by carrier',
  '31': 'Frequently serviced DME',
  '32': 'Infrequently serviced DME',
  '33': 'Oxygen and oxygen equipment',
  '34': 'DME supplies',
  '35': 'Surgical dressings',
  '36': 'Capped rental DME',
  '37': 'Osteoporosis DME',
  '38': 'Orthotics and prosthetics',
  '39': 'Parenteral and enteral nutrition',
  '45': 'Customized DME',
  '46': 'Carrier judgment on DME',
  '51': 'Drugs',
  '52': 'Reasonable charge drugs',
  '53': 'Blood products',
  '54': 'DMEPOS vaccines',
  '55': 'Excluded from DMEPOS fee schedule',
  '56': 'Furnished under competitive bidding',
  '57': 'Subject to DMEPOS competitive bidding',
};

// ============================================================
// Enhanced HCPCS Search (returns full HCPCSResult)
// ============================================================

/** Cache for detailed HCPCS results */
const hcpcsDetailCache = new Map<string, { data: HCPCSResult[]; timestamp: number }>();

/**
 * Search HCPCS codes with full detail — returns HCPCSResult[] with
 * coverage codes, pricing indicators, type of service, and dates.
 * 
 * This is the "rich" version for standalone HCPCS lookup.
 * The existing searchHcpcs() returns ProcedureResult[] for the procedures section.
 */
export async function searchHcpcsDetailed(
  query: string,
  maxResults: number = MAX_RESULTS
): Promise<HCPCSResult[]> {
  if (!query || query.trim().length === 0) return [];

  const cacheKey = `hcpcs-detail:${query.toLowerCase().trim()}:${maxResults}`;

  // Check cache
  const cached = hcpcsDetailCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < HCPCS_CACHE_TTL) {
    return cached.data;
  }

  try {
    const params = new URLSearchParams({
      terms: query.trim(),
      maxList: maxResults.toString(),
      // Request ALL available extra fields from ClinicalTables
      ef: 'short_desc,long_desc,add_dt,term_dt,act_eff_dt',
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(`${HCPCS_API_BASE}?${params}`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`[HCPCS-Detail] API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();

    const totalCount: number = data[0] || 0;
    const codes: string[] = data[1] || [];
    const extraFields: Record<string, string[]> = data[2] || {};

    if (totalCount === 0 || codes.length === 0) {
      hcpcsDetailCache.set(cacheKey, { data: [], timestamp: Date.now() });
      return [];
    }

    const shortDescs: string[] = extraFields['short_desc'] || [];
    const longDescs: string[] = extraFields['long_desc'] || [];
    const addDates: string[] = extraFields['add_dt'] || [];
    const termDates: string[] = extraFields['term_dt'] || [];

    const results: HCPCSResult[] = codes.map((code, index) => {
      const prefix = code.charAt(0).toUpperCase() as HCPCSCategoryPrefix;
      const categoryInfo = HCPCS_CATEGORIES[prefix] || { name: 'Unknown', description: 'Unknown category' };

      return {
        code: code.trim(),
        shortDescription: (shortDescs[index] || '').trim(),
        longDescription: (longDescs[index] || '').trim(),
        // ClinicalTables doesn't return coverage/pricing fields — 
        // these come from CMS data. Default to empty, Phase 3 enriches.
        coverageCode: '' as HCPCSCoverageCode,
        coverageDescription: '',
        pricingIndicator: '' as HCPCSPricingIndicator,
        pricingDescription: '',
        typeOfService: '',
        addDate: addDates[index] || null,
        termDate: termDates[index] || null,
        isActive: !termDates[index],
        category: {
          prefix,
          name: categoryInfo.name,
          description: categoryInfo.description,
        },
      };
    });

    hcpcsDetailCache.set(cacheKey, { data: results, timestamp: Date.now() });
    return results;

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[HCPCS-Detail] Request timed out');
    } else {
      console.error('[HCPCS-Detail] Search error:', error);
    }
    return [];
  }
}

/**
 * Look up a single HCPCS code with full detail.
 * Returns null if code not found.
 */
export async function lookupHcpcsDetailed(code: string): Promise<HCPCSResult | null> {
  if (!code || code.trim().length === 0) return null;

  const results = await searchHcpcsDetailed(code.trim(), 10);
  const exactMatch = results.find(
    (r) => r.code.toUpperCase() === code.trim().toUpperCase()
  );

  return exactMatch || null;
}

// ============================================================
// Category Browsing
// ============================================================

/**
 * Get all HCPCS categories with metadata.
 * Used by the /hcpcs browse page to show category cards.
 */
export function getHcpcsCategories(): HCPCSCategory[] {
  return (Object.entries(HCPCS_CATEGORIES) as [HCPCSCategoryPrefix, { name: string; description: string }][])
    .map(([prefix, info]) => ({
      prefix,
      name: info.name,
      description: info.description,
    }));
}

/**
 * Search HCPCS codes within a specific category (letter prefix).
 * Uses ClinicalTables "q" parameter to filter by code prefix.
 * 
 * @param prefix - Category letter (e.g., 'J' for drugs)
 * @param searchTerm - Optional search within category (e.g., "insulin")
 * @param maxResults - Max results to return
 */
export async function searchHcpcsByCategory(
  prefix: HCPCSCategoryPrefix,
  searchTerm: string = '',
  maxResults: number = 100
): Promise<HCPCSResult[]> {
  // If there's a search term, search for it then filter by prefix
  // If no search term, search for the prefix letter itself
  const query = searchTerm.trim() || prefix;
  
  const results = await searchHcpcsDetailed(query, Math.min(maxResults, 500));

  // Filter to only codes starting with the requested prefix
  if (searchTerm.trim()) {
    return results.filter(r => r.code.charAt(0).toUpperCase() === prefix.toUpperCase());
  }

  return results;
}

// ============================================================
// Helper: Coverage/Pricing Descriptions
// ============================================================

/** Get human-readable description for a coverage code */
export function getCoverageDescription(code: HCPCSCoverageCode): string {
  return COVERAGE_CODE_DESCRIPTIONS[code] || `Coverage code: ${code}`;
}

/** Get human-readable description for a pricing indicator */
export function getPricingDescription(indicator: HCPCSPricingIndicator): string {
  return PRICING_INDICATOR_DESCRIPTIONS[indicator] || `Pricing indicator: ${indicator}`;
}
