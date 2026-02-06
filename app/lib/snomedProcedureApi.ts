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
 * Find SNOMED CT atoms (concepts) linked to a CUI.
 *
 * This is Step 2: CUI → SNOMED CT concept
 * A CUI can map to multiple SNOMED concepts. We want the
 * "clinical finding" type, which represents the diagnosis in SNOMED terms.
 *
 * @param cui - UMLS CUI (e.g., "C0011860" for Type 2 Diabetes)
 * @returns Array of SNOMED concept IDs
 */
async function findSnomedConceptsForCui(cui: string): Promise<string[]> {
  const data = await umlsFetch(`content/current/CUI/${cui}/atoms`, {
    sabs: 'SNOMEDCT_US',
    ttys: 'PT,FN', // Preferred Term, Fully Specified Name
    pageSize: '10',
  }) as { result?: Array<{ sourceConcept?: string; ui?: string; name?: string }> } | null;

  if (!data?.result?.length) {
    return [];
  }

  // Extract unique SNOMED concept IDs from the source concept URLs
  const snomedIds = new Set<string>();
  for (const atom of data.result) {
    if (atom.sourceConcept) {
      // sourceConcept is a URL like "/rest/content/current/source/SNOMEDCT_US/73211009"
      const parts = atom.sourceConcept.split('/');
      const snomedId = parts[parts.length - 1];
      if (snomedId) {
        snomedIds.add(snomedId);
      }
    }
  }

  return Array.from(snomedIds);
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

      // Filter for procedure-indicating relationships
      const isProcedureRel =
        relLabel.includes('associated_procedure') ||
        relLabel.includes('method') ||
        relLabel.includes('procedure_site') ||
        relLabel.includes('finding_site') ||
        relLabel.includes('interprets');

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

  // Strategy 2: Search UMLS for procedures mentioning this condition
  // This catches procedures not directly linked via relationships
  if (procedures.length < 5) {
    const searchData = await umlsFetch('search/current', {
      string: snomedId,
      sabs: 'SNOMEDCT_US',
      returnIdType: 'sourceUi',
      pageSize: '25',
    }) as { result?: { results?: Array<{ ui?: string; name?: string; rootSource?: string }> } } | null;

    if (searchData?.result?.results) {
      for (const result of searchData.result.results) {
        const name = result.name || '';
        const code = result.ui || '';

        // Filter for procedure-like results by checking the name
        const nameLower = name.toLowerCase();
        const isProcedureName =
          nameLower.includes('procedure') ||
          nameLower.includes('therapy') ||
          nameLower.includes('surgery') ||
          nameLower.includes('operation') ||
          nameLower.includes('examination') ||
          nameLower.includes('assessment') ||
          nameLower.includes('measurement') ||
          nameLower.includes('monitoring') ||
          nameLower.includes('test') ||
          nameLower.includes('screening') ||
          nameLower.includes('injection') ||
          nameLower.includes('infusion') ||
          nameLower.includes('transplant') ||
          nameLower.includes('implant');

        if (isProcedureName && code && !seenCodes.has(code)) {
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
    // Step 1: ICD-10 → CUI
    const cui = await findCuiForIcd10(normalizedCode);
    if (!cui) {
      // Negative cache
      procedureCache.set(cacheKey, { data: [], timestamp: Date.now() });
      return [];
    }

    // Step 2: CUI → SNOMED CT concepts
    const snomedIds = await findSnomedConceptsForCui(cui);
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

  // Monitoring
  if (
    lower.includes('monitor') ||
    lower.includes('measurement') ||
    lower.includes('assessment') ||
    lower.includes('surveillance') ||
    lower.includes('follow-up') ||
    lower.includes('tracking') ||
    lower.includes('evaluation')
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
