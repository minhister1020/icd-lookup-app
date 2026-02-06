/**
 * SNOMED CT Procedure Lookup via UMLS API
 *
 * This module provides the FIRST real usage of the UMLS_API_KEY in the project.
 * It authenticates with the UMLS Ticket Granting Service and uses the
 * Metathesaurus REST API to traverse from ICD-10 diagnoses to related
 * SNOMED CT procedure concepts.
 *
 * Auth Flow (required for all UMLS API calls):
 * 1. API Key → POST to /cas/v1/api-key → Ticket Granting Ticket (TGT), valid 8hrs
 * 2. TGT → POST to TGT URL → Service Ticket (ST), single-use
 * 3. ST → GET any UMLS endpoint with ?ticket=ST
 *
 * Traversal Flow:
 * ICD-10 code → UMLS CUI → SNOMED CT concept → Related procedures
 *
 * API Docs: https://documentation.uts.nlm.nih.gov/rest/authentication.html
 * UMLS REST: https://documentation.uts.nlm.nih.gov/rest/home.html
 *
 * @module snomedProcedureApi
 */

import { ProcedureResult, CachedProcedures } from '../types/icd';

// ============================================================
// Constants
// ============================================================

/** UMLS Authentication endpoint */
const UMLS_AUTH_BASE = 'https://utslogin.nlm.nih.gov';

/** UMLS REST API base */
const UMLS_API_BASE = 'https://uts-ws.nlm.nih.gov/rest';

/** Service name required for ticket requests */
const UMLS_SERVICE = 'http://umlsks.nlm.nih.gov';

/** TGT is valid for 8 hours, refresh at 7 to be safe */
const TGT_TTL = 7 * 60 * 60 * 1000;

/** Cache procedure lookups for 7 days (procedures for conditions rarely change) */
const PROCEDURE_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

/** Request timeout for UMLS API calls */
const REQUEST_TIMEOUT = 8000;

/** Max results to return per traversal */
const MAX_PROCEDURE_RESULTS = 30;

// ============================================================
// TGT (Ticket Granting Ticket) Management
// ============================================================

/** Cached TGT URL — reusable for ~8 hours */
let cachedTgtUrl: string | null = null;
let tgtTimestamp: number = 0;

/**
 * Get or refresh the Ticket Granting Ticket (TGT).
 *
 * Think of this as getting a "day pass" to the UMLS movie theater.
 * You show your membership card (API key) once, and get a pass
 * that works for 8 hours.
 *
 * @returns TGT URL string used to request service tickets
 * @throws Error if API key is missing or auth fails
 */
async function getTgt(): Promise<string> {
  // Return cached TGT if still valid
  if (cachedTgtUrl && Date.now() - tgtTimestamp < TGT_TTL) {
    return cachedTgtUrl;
  }

  const apiKey = process.env.UMLS_API_KEY;
  if (!apiKey) {
    throw new Error('[SNOMED] UMLS_API_KEY not found in environment variables');
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(`${UMLS_AUTH_BASE}/cas/v1/api-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `apikey=${encodeURIComponent(apiKey)}`,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`UMLS auth failed: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();

    // The response is HTML containing a form with the TGT URL in the action attribute
    // Example: <form action="https://utslogin.nlm.nih.gov/cas/v1/api-key/TGT-xxxxx-cas">
    const match = html.match(/action="([^"]+)"/);
    if (!match || !match[1]) {
      throw new Error('[SNOMED] Could not parse TGT URL from UMLS response');
    }

    cachedTgtUrl = match[1];
    tgtTimestamp = Date.now();

    return cachedTgtUrl;
  } catch (error) {
    // Reset cached TGT on failure
    cachedTgtUrl = null;
    tgtTimestamp = 0;

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('[SNOMED] UMLS authentication timed out');
    }
    throw error;
  }
}

/**
 * Get a single-use Service Ticket (ST) from the TGT.
 *
 * Think of this as showing your "day pass" at the screening door
 * to get a single-entry ticket for one specific movie.
 *
 * @returns Service ticket string to use in one API call
 */
async function getServiceTicket(): Promise<string> {
  const tgtUrl = await getTgt();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(tgtUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `service=${encodeURIComponent(UMLS_SERVICE)}`,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      // TGT might have expired, clear it so next call gets a fresh one
      cachedTgtUrl = null;
      tgtTimestamp = 0;
      throw new Error(`[SNOMED] Service ticket request failed: ${response.status}`);
    }

    const ticket = await response.text();
    return ticket.trim();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('[SNOMED] Service ticket request timed out');
    }
    throw error;
  }
}

// ============================================================
// UMLS API Helper
// ============================================================

/**
 * Make an authenticated UMLS REST API call.
 * Automatically gets a fresh service ticket for each request.
 *
 * @param endpoint - API path after /rest/ (e.g., "search/current")
 * @param params - URL search parameters (ticket is added automatically)
 * @returns Parsed JSON response
 */
async function umlsFetch(endpoint: string, params: Record<string, string> = {}): Promise<unknown> {
  const ticket = await getServiceTicket();

  const searchParams = new URLSearchParams({ ...params, ticket });
  const url = `${UMLS_API_BASE}/${endpoint}?${searchParams}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[SNOMED] UMLS API error: ${response.status} ${response.statusText} for ${endpoint}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn(`[SNOMED] UMLS API request timed out for ${endpoint}`);
    } else {
      console.warn(`[SNOMED] UMLS API fetch error for ${endpoint}:`, error);
    }
    return null;
  }
}

// ============================================================
// Procedure Cache
// ============================================================

const procedureCache = new Map<string, CachedProcedures>();

function isCacheValid(cached: CachedProcedures): boolean {
  return Date.now() - cached.timestamp < PROCEDURE_CACHE_TTL;
}

// ============================================================
// Core Lookup Functions
// ============================================================

/**
 * Find the UMLS CUI (Concept Unique Identifier) for an ICD-10 code.
 *
 * This is Step 1 of the traversal: ICD-10 → CUI
 * Think of CUI as a "universal translator" ID that connects different
 * coding systems together.
 *
 * @param icd10Code - ICD-10-CM code (e.g., "E11.9")
 * @returns CUI string or null if not found
 */
async function findCuiForIcd10(icd10Code: string): Promise<string | null> {
  const data = await umlsFetch('search/current', {
    string: icd10Code,
    inputType: 'sourceUi',
    sabs: 'ICD10CM',
    returnIdType: 'concept',
    pageSize: '1',
  }) as { result?: { results?: Array<{ ui?: string; name?: string }> } } | null;

  if (!data?.result?.results?.length) {
    console.warn(`[SNOMED] No CUI found for ICD-10 code: ${icd10Code}`);
    return null;
  }

  const cui = data.result.results[0]?.ui;
  if (!cui || cui === 'NONE') {
    return null;
  }

  return cui;
}

/**
 * Find SNOMED CT concepts for an ICD-10 code using the UMLS Crosswalk API.
 *
 * This replaces the old CUI → atoms approach which failed because narrow
 * ICD-10 CUIs often have no SNOMED CT atoms.
 *
 * The crosswalk API directly maps between coding systems:
 * GET /crosswalk/current/source/ICD10CM/{code}?targetSource=SNOMEDCT_US
 *
 * @param icd10Code - ICD-10-CM code (e.g., "E11.9")
 * @returns Array of SNOMED concept IDs (may include obsolete ones)
 */
async function findSnomedConceptsViaXwalk(icd10Code: string): Promise<string[]> {
  const data = await umlsFetch(`crosswalk/current/source/ICD10CM/${encodeURIComponent(icd10Code)}`, {
    targetSource: 'SNOMEDCT_US',
    pageSize: '10',
  }) as { result?: Array<{ ui?: string; name?: string; obsolete?: boolean | string }> } | null;

  if (!data?.result?.length) {
    console.warn(`[SNOMED] No crosswalk results for ICD-10: ${icd10Code}`);
    return [];
  }

  // Separate active and obsolete concepts
  const activeSnomedIds: string[] = [];
  const obsoleteSnomedIds: string[] = [];

  for (const entry of data.result) {
    if (entry.ui && entry.ui !== 'NONE') {
      // The API returns obsolete as boolean or string "true"/"false"
      const isObsolete = entry.obsolete === true || entry.obsolete === 'true';
      if (isObsolete) {
        obsoleteSnomedIds.push(entry.ui);
      } else {
        activeSnomedIds.push(entry.ui);
      }
    }
  }

  // If we have active concepts, use those directly
  if (activeSnomedIds.length > 0) {
    return activeSnomedIds;
  }

  // If all concepts are obsolete, follow replaced_by to find active ones
  const resolvedIds = new Set<string>();
  for (const obsId of obsoleteSnomedIds.slice(0, 3)) {
    const relData = await umlsFetch(`content/current/source/SNOMEDCT_US/${obsId}/relations`, {
      pageSize: '10',
    }) as { result?: Array<{
      additionalRelationLabel?: string;
      relationLabel?: string;
      relatedId?: string
    }> } | null;

    if (relData?.result) {
      for (const rel of relData.result) {
        const label = (rel.additionalRelationLabel || rel.relationLabel || '').toLowerCase();
        if (label.includes('replaced_by') && rel.relatedId) {
          const parts = rel.relatedId.split('/');
          const activeId = parts[parts.length - 1];
          if (activeId) {
            resolvedIds.add(activeId);
          }
        }
      }
    }
  }

  if (resolvedIds.size > 0) {
    return Array.from(resolvedIds);
  }

  // Last resort: return the obsolete IDs (some still have useful relations)
  return obsoleteSnomedIds;
}

/**
 * Find procedures related to a SNOMED CT concept.
 *
 * This is Step 3: SNOMED concept → Related procedures
 * We look at SNOMED CT relationships to find procedure concepts
 * that are clinically associated with the diagnosis.
 *
 * We search for relationships like:
 * - "Associated procedure"
 * - "Method" relationships
 * - Concepts with semantic type "Procedure" or "Therapeutic or Preventive Procedure"
 *
 * @param snomedId - SNOMED CT concept ID
 * @returns Array of ProcedureResult objects
 */
async function findProceduresForSnomedConcept(snomedId: string): Promise<ProcedureResult[]> {
  // Strategy 1: Get relations of the SNOMED concept
  const relationsData = await umlsFetch(`content/current/source/SNOMEDCT_US/${snomedId}/relations`, {
    pageSize: '50',
  }) as { result?: Array<{
    relatedIdName?: string;
    relationLabel?: string;
    additionalRelationLabel?: string;
    relatedId?: string;
    classType?: string;
  }> } | null;

  const procedures: ProcedureResult[] = [];
  const seenCodes = new Set<string>();

  if (relationsData?.result) {
    for (const rel of relationsData.result) {
      // Look for procedure-related relationships
      const relLabel = (rel.additionalRelationLabel || rel.relationLabel || '').toLowerCase();
      const name = rel.relatedIdName || '';

      // Broadened filter based on live testing - includes relationships
      // like focus_of (educational procedures), cause_of (complications
      // that need procedures), and has_realization
      const isProcedureRel =
        relLabel.includes('associated_procedure') ||
        relLabel.includes('method') ||
        relLabel.includes('procedure_site') ||
        relLabel.includes('finding_site') ||
        relLabel.includes('interprets') ||
        relLabel.includes('focus_of') ||
        relLabel.includes('has_realization') ||
        relLabel.includes('treated_by') ||
        relLabel.includes('may_be_treated_by') ||
        relLabel.includes('may_be_prevented_by') ||
        relLabel.includes('has_procedure_context');

      if (isProcedureRel && rel.relatedId && !seenCodes.has(rel.relatedId)) {
        // Extract SNOMED ID from the relatedId URL
        const parts = rel.relatedId.split('/');
        const relatedSnomedId = parts[parts.length - 1];

        seenCodes.add(relatedSnomedId);
        procedures.push({
          code: relatedSnomedId,
          codeSystem: 'SNOMED',
          description: name,
          category: categorizeSnomedProcedure(name, relLabel),
          relevanceScore: -1, // Will be scored by AI agent
          source: 'umls_api',
          setting: 'both',
        });
      }
    }
  }

  // Strategy 2: Search UMLS for procedure concepts related to this condition
  // Searching for the exact condition name only returns diagnosis variations.
  // Instead, we extract the core condition keyword and search with procedure
  // suffixes like "screening", "management", "therapy", etc.
  if (procedures.length < 5) {
    // First get the concept name
    const conceptData = await umlsFetch(`content/current/source/SNOMEDCT_US/${snomedId}`, {
    }) as { result?: { name?: string } } | null;

    const conceptName = conceptData?.result?.name;
    if (conceptName) {
      // Extract the core keyword(s) — e.g., "Type 2 diabetes mellitus" → "diabetes"
      const coreKeyword = extractCoreKeyword(conceptName);

      // Search with procedure-oriented suffixes
      const procedureSuffixes = ['screening', 'management', 'therapy', 'monitoring', 'education', 'test'];

      for (const suffix of procedureSuffixes) {
        if (procedures.length >= MAX_PROCEDURE_RESULTS) break;

        const searchData = await umlsFetch('search/current', {
          string: `${coreKeyword} ${suffix}`,
          pageSize: '15',
        }) as { result?: { results?: Array<{ ui?: string; name?: string; rootSource?: string }> } } | null;

        if (searchData?.result?.results) {
          for (const result of searchData.result.results) {
            const name = result.name || '';
            const code = result.ui || '';
            const source = result.rootSource || '';

            // Only keep SNOMED CT results
            if (!source.includes('SNOMEDCT')) continue;

            // Skip if it's clearly a diagnosis, not a procedure
            const nameLower = name.toLowerCase();
            const isDiagnosis =
              nameLower.includes('disorder') ||
              nameLower.includes('disease') ||
              (nameLower.includes('mellitus') && !nameLower.includes('management') && !nameLower.includes('education') && !nameLower.includes('screening'));

            if (isDiagnosis) continue;

            if (code && !seenCodes.has(code)) {
              seenCodes.add(code);
              procedures.push({
                code,
                codeSystem: 'SNOMED',
                description: name,
                category: categorizeSnomedProcedure(name, ''),
                relevanceScore: -1,
                source: 'umls_api',
                setting: 'both',
              });
            }
          }
        }
      }
    }
  }

  return procedures.slice(0, MAX_PROCEDURE_RESULTS);
}

// ============================================================
// Main Export: ICD-10 → SNOMED Procedures
// ============================================================

/**
 * Main entry point: Find SNOMED CT procedures related to an ICD-10 diagnosis.
 *
 * Full traversal: ICD-10 → CUI → SNOMED CT → Related Procedures
 *
 * @param icd10Code - ICD-10-CM code (e.g., "E11.9", "I10", "J44.1")
 * @returns Array of ProcedureResult objects with codeSystem = 'SNOMED'
 */
export async function getSnomedProceduresForDiagnosis(
  icd10Code: string
): Promise<ProcedureResult[]> {
  if (!icd10Code || icd10Code.trim().length === 0) return [];

  const normalizedCode = icd10Code.trim().toUpperCase();
  const cacheKey = `snomed-proc:${normalizedCode}`;

  // Check cache
  const cached = procedureCache.get(cacheKey);
  if (cached && isCacheValid(cached)) {
    return cached.data;
  }

  try {
    // Step 1+2 combined: ICD-10 → SNOMED CT concepts via crosswalk
    // (Replaces old CUI → atoms path that returned 404 for narrow ICD-10 concepts)
    let snomedIds = await findSnomedConceptsViaXwalk(normalizedCode);

    // If crosswalk returned nothing, try the CUI path as fallback
    if (snomedIds.length === 0) {
      const cui = await findCuiForIcd10(normalizedCode);
      if (cui) {
        // Try to get SNOMED concepts from CUI atoms (works for broader concepts)
        const atomData = await umlsFetch(`content/current/CUI/${cui}/atoms`, {
          sabs: 'SNOMEDCT_US',
          ttys: 'PT,FN',
          pageSize: '10',
        }) as { result?: Array<{ sourceConcept?: string }> } | null;

        if (atomData?.result) {
          for (const atom of atomData.result) {
            if (atom.sourceConcept) {
              const parts = atom.sourceConcept.split('/');
              const id = parts[parts.length - 1];
              if (id) snomedIds.push(id);
            }
          }
        }
      }
    }

    if (snomedIds.length === 0) {
      procedureCache.set(cacheKey, { data: [], timestamp: Date.now() });
      return [];
    }

    // Step 3: SNOMED concepts → Related procedures (check all concepts)
    const allProcedures: ProcedureResult[] = [];
    const seenCodes = new Set<string>();

    // Limit to first 3 SNOMED concepts to avoid excessive API calls
    for (const snomedId of snomedIds.slice(0, 3)) {
      const procedures = await findProceduresForSnomedConcept(snomedId);
      for (const proc of procedures) {
        if (!seenCodes.has(proc.code)) {
          seenCodes.add(proc.code);
          allProcedures.push(proc);
        }
      }
    }

    // Cache results
    procedureCache.set(cacheKey, { data: allProcedures, timestamp: Date.now() });

    return allProcedures;
  } catch (error) {
    console.warn('[SNOMED] Procedure lookup failed:', error instanceof Error ? error.message : error);
    // Cache empty on error to avoid hammering the API
    procedureCache.set(cacheKey, { data: [], timestamp: Date.now() });
    return [];
  }
}

// ============================================================
// Helper: Extract Core Keyword
// ============================================================

/**
 * Extract the clinically meaningful keyword from a SNOMED concept name.
 * Strips qualifiers like "Type 2", "mellitus", "essential", etc.
 *
 * Examples:
 * - "Type 2 diabetes mellitus" → "diabetes"
 * - "Essential hypertension" → "hypertension"
 * - "Chronic obstructive lung disease" → "obstructive lung disease"
 */
function extractCoreKeyword(conceptName: string): string {
  const stopWords = [
    'type', '1', '2', 'ii', 'i', 'mellitus', 'essential', 'primary',
    'secondary', 'chronic', 'acute', 'unspecified', 'without',
    'complication', 'complications', 'with', 'the', 'of', 'and', 'or',
    'non', 'insulin', 'dependent',
  ];

  const words = conceptName
    .toLowerCase()
    .replace(/[(),]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 1 && !stopWords.includes(w));

  // Return the first 2 meaningful words, or fallback to first word of original
  if (words.length === 0) {
    return conceptName.split(' ')[0];
  }
  return words.slice(0, 2).join(' ');
}

// ============================================================
// SNOMED Procedure Categorization
// ============================================================

/**
 * Categorize a SNOMED procedure by its name and relationship type.
 * Uses keyword matching on the procedure description.
 */
function categorizeSnomedProcedure(
  name: string,
  relationLabel: string
): 'diagnostic' | 'therapeutic' | 'monitoring' | 'equipment' | 'other' {
  const lower = (name + ' ' + relationLabel).toLowerCase();

  // Diagnostic
  if (
    lower.includes('test') ||
    lower.includes('imaging') ||
    lower.includes('x-ray') ||
    lower.includes('scan') ||
    lower.includes('biopsy') ||
    lower.includes('examination') ||
    lower.includes('screening') ||
    lower.includes('laboratory') ||
    lower.includes('assay') ||
    lower.includes('culture') ||
    lower.includes('pathology')
  ) {
    return 'diagnostic';
  }

  // Monitoring (includes education/counseling — they support ongoing management)
  if (
    lower.includes('monitor') ||
    lower.includes('measurement') ||
    lower.includes('assessment') ||
    lower.includes('surveillance') ||
    lower.includes('follow-up') ||
    lower.includes('tracking') ||
    lower.includes('evaluation') ||
    lower.includes('education') ||
    lower.includes('counseling') ||
    lower.includes('management program')
  ) {
    return 'monitoring';
  }

  // Equipment
  if (
    lower.includes('device') ||
    lower.includes('prosthe') ||
    lower.includes('orthotic') ||
    lower.includes('implant') ||
    lower.includes('pump') ||
    lower.includes('equipment')
  ) {
    return 'equipment';
  }

  // Therapeutic (default for most procedures)
  if (
    lower.includes('therapy') ||
    lower.includes('surgery') ||
    lower.includes('operation') ||
    lower.includes('procedure') ||
    lower.includes('injection') ||
    lower.includes('infusion') ||
    lower.includes('transplant') ||
    lower.includes('repair') ||
    lower.includes('removal') ||
    lower.includes('insertion') ||
    lower.includes('treatment') ||
    lower.includes('excision') ||
    lower.includes('drainage')
  ) {
    return 'therapeutic';
  }

  return 'other';
}

// ============================================================
// Cache Management
// ============================================================

/** Clear the SNOMED procedure cache */
export function clearSnomedProcedureCache(): void {
  procedureCache.clear();
}

/** Reset the TGT (forces re-authentication on next call) */
export function resetUmlsAuth(): void {
  cachedTgtUrl = null;
  tgtTimestamp = 0;
}

/** Get cache statistics for debugging */
export function getSnomedCacheStats(): {
  procedureCacheSize: number;
  hasTgt: boolean;
  tgtAgeMinutes: number;
} {
  return {
    procedureCacheSize: procedureCache.size,
    hasTgt: cachedTgtUrl !== null,
    tgtAgeMinutes: tgtTimestamp > 0 ? Math.round((Date.now() - tgtTimestamp) / 60000) : 0,
  };
}
