/**
 * hcpcsLocalData.ts — Local HCPCS data layer powered by CMS quarterly release
 * 
 * Replaces ClinicalTables API dependency for HCPCS lookups.
 * Loads 8,623 codes from a static JSON file (public/data/hcpcs-data.json).
 * Provides instant search, browse-by-category, and Medicare coverage lookups.
 */

import { HCPCSResult, HCPCSCategory, HCPCSCategoryPrefix } from '../types/icd';

// ── Types for the raw JSON structure ──

interface HCPCSRawCode {
  code: string;
  longDesc: string;
  shortDesc: string;
  cov: string;
  tos?: string;
  addDate?: string;
  termDate?: string;
}

interface HCPCSDataFile {
  version: string;
  source: string;
  totalCodes: number;
  codes: HCPCSRawCode[];
}

// ── Medicare Coverage mapping ──

export interface MedicareCoverageInfo {
  code: string;       // C, D, I, M, S
  label: string;      // Human-readable name
  group: 'payable' | 'conditional' | 'not-payable';
  description: string; // Practical implication
  color: string;       // Tailwind color key for UI
}

const COVERAGE_MAP: Record<string, MedicareCoverageInfo> = {
  'C': {
    code: 'C',
    label: 'Carrier Judgment',
    group: 'conditional',
    description: 'Potentially payable. Submit claim; MAC decides based on notes/diagnosis.',
    color: 'amber'
  },
  'D': {
    code: 'D',
    label: 'Special Coverage',
    group: 'conditional',
    description: 'Potentially payable. Submit claim; ensure specific NCD/LCD rules are met.',
    color: 'blue'
  },
  'I': {
    code: 'I',
    label: 'Not Payable',
    group: 'not-payable',
    description: 'Do not use. Check if a better Medicare-specific code exists.',
    color: 'red'
  },
  'M': {
    code: 'M',
    label: 'Non-Covered',
    group: 'not-payable',
    description: 'Denied. Patient may be liable (ABN rules may apply).',
    color: 'red'
  },
  'S': {
    code: 'S',
    label: 'Statutory Exclusion',
    group: 'not-payable',
    description: 'Denied. Patient is fully liable (ABN often not required).',
    color: 'red'
  }
};

// ── Category definitions (same 18 categories from hcpcsApi.ts) ──

interface LocalHCPCSCategory {
  prefix: HCPCSCategoryPrefix;
  name: string;
  description: string;
  count: number; // Populated after data loads
}

const CATEGORY_DEFINITIONS: Omit<LocalHCPCSCategory, 'count'>[] = [
  { prefix: 'A', name: 'Transport, Medical/Surgical Supplies, Miscellaneous', description: 'A0000-A9999' },
  { prefix: 'B', name: 'Enteral and Parenteral Therapy', description: 'B4000-B9999' },
  { prefix: 'C', name: 'Outpatient PPS (Temporary)', description: 'C1000-C9999' },
  { prefix: 'E', name: 'Durable Medical Equipment (DME)', description: 'E0100-E9999' },
  { prefix: 'G', name: 'Procedures/Professional Services (Temporary)', description: 'G0000-G9999' },
  { prefix: 'H', name: 'Behavioral Health/Substance Abuse', description: 'H0001-H2037' },
  { prefix: 'J', name: 'Drugs Administered Other Than Oral Method', description: 'J0000-J9999' },
  { prefix: 'K', name: 'DME (Temporary)', description: 'K0000-K9999' },
  { prefix: 'L', name: 'Orthotics/Prosthetics', description: 'L0000-L9999' },
  { prefix: 'M', name: 'Quality Measures / Other Medical Services', description: 'M0000-M9999' },
  { prefix: 'P', name: 'Pathology and Laboratory', description: 'P0000-P9999' },
  { prefix: 'Q', name: 'Miscellaneous Services (Temporary)', description: 'Q0000-Q9999' },
  { prefix: 'R', name: 'Diagnostic Radiology', description: 'R0000-R5999' },
  { prefix: 'S', name: 'Private Payer Codes (Non-Medicare)', description: 'S0000-S9999' },
  { prefix: 'T', name: 'State Medicaid Agency Codes', description: 'T1000-T9999' },
  { prefix: 'U', name: 'Coronavirus Lab Tests', description: 'U0001-U0005' },
  { prefix: 'V', name: 'Vision/Hearing Services', description: 'V0000-V9999' },
];

// ── In-memory data store ──

let allCodes: HCPCSRawCode[] = [];
let codeMap: Map<string, HCPCSRawCode> = new Map();
let prefixIndex: Map<string, HCPCSRawCode[]> = new Map();
let categories: LocalHCPCSCategory[] = [];
let isLoaded = false;
let loadPromise: Promise<void> | null = null;

// ── Data loading ──

async function loadData(): Promise<void> {
  if (isLoaded) return;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const response = await fetch('/data/hcpcs-data.json');
      if (!response.ok) throw new Error(`Failed to load HCPCS data: ${response.status}`);

      const data: HCPCSDataFile = await response.json();
      allCodes = data.codes;

      // Build code lookup map
      codeMap = new Map();
      for (const code of allCodes) {
        codeMap.set(code.code.toUpperCase(), code);
      }

      // Build prefix index for browse
      prefixIndex = new Map();
      for (const code of allCodes) {
        const prefix = code.code[0].toUpperCase();
        if (!prefixIndex.has(prefix)) {
          prefixIndex.set(prefix, []);
        }
        prefixIndex.get(prefix)!.push(code);
      }

      // Build categories with counts
      categories = CATEGORY_DEFINITIONS.map(def => ({
        ...def,
        count: prefixIndex.get(def.prefix)?.length ?? 0
      }));

      isLoaded = true;
    } catch (err) {
      console.error('Failed to load HCPCS local data:', err);
      loadPromise = null;
      throw err;
    }
  })();

  return loadPromise;
}

// ── Helper: Convert raw code to HCPCSResult ──

function toHCPCSResult(raw: HCPCSRawCode): HCPCSResult {
  const isActive = !raw.termDate || raw.termDate === '';
  const catDef = CATEGORY_DEFINITIONS.find(c => c.prefix === raw.code[0]);
  const category: HCPCSCategory = catDef
    ? { prefix: catDef.prefix, name: catDef.name, description: catDef.description }
    : { prefix: 'A', name: 'Unknown', description: 'Unknown category' };

  return {
    code: raw.code,
    shortDescription: raw.shortDesc,
    longDescription: raw.longDesc,
    coverageCode: raw.cov,
    coverageDescription: '',
    pricingIndicator: '',
    pricingDescription: '',
    typeOfService: raw.tos ?? '',
    addDate: raw.addDate ? formatDate(raw.addDate) : null,
    termDate: raw.termDate ? formatDate(raw.termDate) : null,
    isActive,
    category,
  };
}

function formatDate(yyyymmdd: string): string {
  if (yyyymmdd.length !== 8) return yyyymmdd;
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

// ── Public API ──

/**
 * Look up a single HCPCS code. Returns null if not found.
 */
export async function lookupLocalHcpcs(code: string): Promise<HCPCSResult | null> {
  await loadData();
  const raw = codeMap.get(code.toUpperCase().trim());
  if (!raw) return null;
  return toHCPCSResult(raw);
}

/**
 * Search HCPCS codes by code or description text.
 * Searches both code and description fields.
 */
export async function searchLocalHcpcs(query: string, maxResults: number = 30): Promise<HCPCSResult[]> {
  await loadData();
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const results: { raw: HCPCSRawCode; score: number }[] = [];

  for (const raw of allCodes) {
    let score = 0;
    const code = raw.code.toLowerCase();
    const longDesc = raw.longDesc.toLowerCase();
    const shortDesc = raw.shortDesc.toLowerCase();

    // Exact code match = highest priority
    if (code === q) {
      score = 100;
    }
    // Code starts with query
    else if (code.startsWith(q)) {
      score = 80;
    }
    // Description starts with query
    else if (longDesc.startsWith(q) || shortDesc.startsWith(q)) {
      score = 60;
    }
    // Word-level match in description
    else if (longDesc.includes(q) || shortDesc.includes(q)) {
      score = 40;
    }

    if (score > 0) {
      // Boost active codes slightly
      if (isActive(raw)) score += 5;

      results.push({ raw, score });
    }
  }

  // Sort by score descending, then alphabetically
  results.sort((a, b) => b.score - a.score || a.raw.code.localeCompare(b.raw.code));

  return results.slice(0, maxResults).map(r => toHCPCSResult(r.raw));
}

function isActive(raw: HCPCSRawCode): boolean {
  return !raw.termDate || raw.termDate === '';
}

/**
 * Browse all codes in a category (by prefix letter).
 */
export async function browseByCategory(prefix: string): Promise<HCPCSResult[]> {
  await loadData();
  const codes = prefixIndex.get(prefix.toUpperCase()) ?? [];
  return codes.map(toHCPCSResult);
}

/**
 * Get all categories with code counts.
 */
export async function getLocalCategories(): Promise<LocalHCPCSCategory[]> {
  await loadData();
  return categories;
}

/**
 * Get Medicare coverage info for a COV code.
 */
export function getMedicareCoverage(covCode: string): MedicareCoverageInfo | null {
  return COVERAGE_MAP[covCode.toUpperCase()] ?? null;
}

/**
 * Get the data version string.
 */
export async function getDataVersion(): Promise<string> {
  await loadData();
  return `CMS HCPCS 2026-Q1 (${allCodes.length} codes)`;
}
