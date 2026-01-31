/**
 * RxNorm API Integration
 * ======================
 * 
 * This file handles all communication with the RxNorm REST API from the
 * National Library of Medicine (NLM).
 * 
 * RxNorm provides:
 * - Normalized drug names (brand and generic)
 * - Drug identifiers (RxCUI)
 * - Dosage forms and strengths
 * - Drug relationships
 * 
 * API Documentation: https://lhncbc.nlm.nih.gov/RxNav/APIs/RxNormAPIs.html
 * 
 * Key benefits over OpenFDA:
 * - Complete drug name data (brand AND generic names always present)
 * - Modern drugs included (GLP-1s like Wegovy, Saxenda)
 * - No rate limiting issues
 * - Free, no API key required
 * 
 * Rate Limits:
 * - Soft limit: 25 requests/second (advisory)
 * - No strict enforcement, but be respectful
 */

// =============================================================================
// Configuration
// =============================================================================

/** RxNorm REST API base URL */
const RXNORM_BASE_URL = 'https://rxnav.nlm.nih.gov/REST';

/** Cache TTL in milliseconds (24 hours) */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// =============================================================================
// TypeScript Interfaces
// =============================================================================

/**
 * RxNorm concept properties from the API response.
 */
interface RxNormConceptProperty {
  /** Unique RxNorm concept identifier */
  rxcui: string;
  
  /** Full drug name including strength and form */
  name: string;
  
  /** Simplified name (often the brand name with strength) */
  synonym?: string;
  
  /** Term type - SBD (Semantic Branded Drug), SCD (Semantic Clinical Drug), etc. */
  tty: string;
  
  /** Language (usually "ENG") */
  language: string;
  
  /** Suppress flag */
  suppress: string;
  
  /** UMLS CUI (often empty) */
  umlscui?: string;
}

/**
 * Concept group in the RxNorm response.
 */
interface RxNormConceptGroup {
  /** Term type for this group */
  tty?: string;
  
  /** Array of concept properties */
  conceptProperties?: RxNormConceptProperty[];
}

/**
 * Full RxNorm API response structure.
 */
interface RxNormResponse {
  drugGroup?: {
    name: string | null;
    conceptGroup?: RxNormConceptGroup[];
  };
}

/**
 * Simplified drug result returned to callers.
 */
export interface RxNormDrug {
  /** Unique RxNorm identifier */
  rxcui: string;
  
  /** Brand name (e.g., "Wegovy") */
  brandName: string;
  
  /** Generic name (e.g., "semaglutide") */
  genericName: string;
  
  /** Full RxNorm name with dosage */
  fullName: string;
  
  /** Dosage form (e.g., "Auto-Injector", "Tablet") */
  dosageForm?: string;
  
  /** Strength (e.g., "0.25 MG per 0.5 ML") */
  strength?: string;
}

// =============================================================================
// Cache
// =============================================================================

interface CachedDrug {
  drug: RxNormDrug | null;
  timestamp: number;
}

/** In-memory cache for RxNorm drug lookups */
const drugCache = new Map<string, CachedDrug>();

/**
 * Checks if a cached entry is still valid.
 */
function isCacheValid(cached: CachedDrug): boolean {
  return Date.now() - cached.timestamp < CACHE_TTL_MS;
}

/**
 * Gets cache key from drug name (normalized).
 */
function getCacheKey(drugName: string): string {
  return drugName.toLowerCase().trim();
}

// =============================================================================
// Main Search Function
// =============================================================================

/**
 * Searches RxNorm for drug information by drug name.
 * 
 * @param drugName - Drug name to search (generic or brand)
 * @returns RxNormDrug object with details, or null if not found
 * 
 * @example
 * const drug = await searchRxNormDrug('semaglutide');
 * // Returns: { rxcui: "2553506", brandName: "Wegovy", genericName: "semaglutide", ... }
 * 
 * @example
 * const drug = await searchRxNormDrug('metformin');
 * // Returns: { rxcui: "...", brandName: "Glucophage", genericName: "metformin", ... }
 */
export async function searchRxNormDrug(drugName: string): Promise<RxNormDrug | null> {
  const cacheKey = getCacheKey(drugName);
  
  // Check cache first
  const cached = drugCache.get(cacheKey);
  if (cached && isCacheValid(cached)) {
    if (cached.drug) {
      console.log(`[RxNorm] Cache HIT: ${drugName} → ${cached.drug.brandName}`);
    } else {
      console.log(`[RxNorm] Cache HIT (no result): ${drugName}`);
    }
    return cached.drug;
  }
  
  try {
    // Build API URL
    const url = `${RXNORM_BASE_URL}/drugs.json?name=${encodeURIComponent(drugName)}`;
    
    console.log(`[RxNorm] Fetching: ${drugName}`);
    
    // Make API request
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`[RxNorm] API error: ${response.status} ${response.statusText}`);
      // Cache the failure to avoid repeated requests
      drugCache.set(cacheKey, { drug: null, timestamp: Date.now() });
      return null;
    }
    
    const data: RxNormResponse = await response.json();
    
    // Parse response to find best drug match
    const drug = parseRxNormResponse(data, drugName);
    
    // Cache the result (even if null)
    drugCache.set(cacheKey, { drug, timestamp: Date.now() });
    
    if (drug) {
      console.log(`[RxNorm] Found: ${drug.brandName} (${drug.genericName})`);
    } else {
      console.log(`[RxNorm] Not found: ${drugName}`);
    }
    
    return drug;
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[RxNorm] Failed to fetch ${drugName}:`, message);
    
    // Cache the failure to avoid repeated requests
    drugCache.set(cacheKey, { drug: null, timestamp: Date.now() });
    return null;
  }
}

/**
 * Searches for multiple drugs in parallel.
 * 
 * @param drugNames - Array of drug names to search
 * @returns Array of RxNormDrug objects (nulls filtered out)
 */
export async function searchMultipleRxNormDrugs(drugNames: string[]): Promise<RxNormDrug[]> {
  console.log(`[RxNorm] Fetching ${drugNames.length} drugs in parallel`);
  
  const promises = drugNames.map(name => searchRxNormDrug(name));
  const results = await Promise.all(promises);
  
  // Filter out nulls
  const validDrugs = results.filter((drug): drug is RxNormDrug => drug !== null);
  
  console.log(`[RxNorm] Successfully fetched ${validDrugs.length}/${drugNames.length} drugs`);
  
  return validDrugs;
}

// =============================================================================
// Response Parsing
// =============================================================================

/**
 * Parses RxNorm API response to extract best drug match.
 * 
 * Priority:
 * 1. Semantic Branded Drug (SBD) - has brand name in square brackets
 * 2. Semantic Clinical Drug (SCD) - generic drug with dosage
 * 
 * @param response - Raw RxNorm API response
 * @param originalDrugName - Original search term for fallback
 * @returns Parsed RxNormDrug or null
 */
function parseRxNormResponse(response: RxNormResponse, originalDrugName: string): RxNormDrug | null {
  const conceptGroups = response.drugGroup?.conceptGroup;
  
  if (!conceptGroups || conceptGroups.length === 0) {
    return null;
  }
  
  // First, try to find a Semantic Branded Drug (SBD) - these have brand names
  const sbdGroup = conceptGroups.find(g => g.tty === 'SBD');
  if (sbdGroup?.conceptProperties && sbdGroup.conceptProperties.length > 0) {
    return parseConceptProperty(sbdGroup.conceptProperties[0], originalDrugName);
  }
  
  // Fallback to Semantic Clinical Drug (SCD) - generic drugs
  const scdGroup = conceptGroups.find(g => g.tty === 'SCD');
  if (scdGroup?.conceptProperties && scdGroup.conceptProperties.length > 0) {
    return parseConceptProperty(scdGroup.conceptProperties[0], originalDrugName);
  }
  
  // Try any group that has concept properties
  for (const group of conceptGroups) {
    if (group.conceptProperties && group.conceptProperties.length > 0) {
      return parseConceptProperty(group.conceptProperties[0], originalDrugName);
    }
  }
  
  return null;
}

/**
 * Parses a single concept property into RxNormDrug format.
 */
function parseConceptProperty(concept: RxNormConceptProperty, originalDrugName: string): RxNormDrug {
  const fullName = concept.name;
  
  return {
    rxcui: concept.rxcui,
    brandName: extractBrandName(fullName, originalDrugName),
    genericName: extractGenericName(fullName, originalDrugName),
    fullName: fullName,
    dosageForm: extractDosageForm(fullName),
    strength: extractStrength(fullName),
  };
}

// =============================================================================
// Name Extraction Helpers
// =============================================================================

/**
 * Extracts brand name from RxNorm full name.
 * 
 * RxNorm branded drugs have format: "... [BrandName]"
 * 
 * @example
 * extractBrandName("0.5 ML semaglutide 0.5 MG/ML Auto-Injector [Wegovy]", "semaglutide")
 * // Returns: "Wegovy"
 */
function extractBrandName(fullName: string, fallback: string): string {
  // Look for text in square brackets [BrandName]
  const bracketMatch = fullName.match(/\[([^\]]+)\]/);
  if (bracketMatch && bracketMatch[1]) {
    return bracketMatch[1];
  }
  
  // If no brackets, use the fallback (original search term) with title case
  return toTitleCase(fallback);
}

/**
 * Extracts generic name from RxNorm full name.
 * 
 * Generic names are typically lowercase words before dosage numbers.
 * 
 * @example
 * extractGenericName("0.5 ML semaglutide 0.5 MG/ML Auto-Injector [Wegovy]", "semaglutide")
 * // Returns: "semaglutide"
 */
function extractGenericName(fullName: string, fallback: string): string {
  // Pattern: lowercase word(s) (possibly with /) followed by a number
  // This catches "semaglutide 0.5", "naltrexone/bupropion 8"
  const genericMatch = fullName.match(/\b([a-z]+(?:\s*\/\s*[a-z]+)?)\s+\d/i);
  
  if (genericMatch && genericMatch[1]) {
    return genericMatch[1].toLowerCase();
  }
  
  // Try another pattern: look for the first all-lowercase word that's not a unit
  const words = fullName.split(/\s+/);
  const units = ['ml', 'mg', 'mcg', 'g', 'hr', 'per', 'dose'];
  
  for (const word of words) {
    const cleaned = word.toLowerCase().replace(/[^a-z\/]/g, '');
    if (cleaned.length > 2 && !units.includes(cleaned) && /^[a-z]/.test(cleaned)) {
      return cleaned;
    }
  }
  
  // Fallback to original search term
  return fallback.toLowerCase();
}

/**
 * Extracts dosage form from RxNorm full name.
 * 
 * Common forms: Tablet, Capsule, Injection, Auto-Injector, Pen Injector, etc.
 */
function extractDosageForm(fullName: string): string | undefined {
  const forms = [
    'Auto-Injector',
    'Pen Injector',
    'Prefilled Syringe',
    'Extended Release Oral Tablet',
    'Extended Release Oral Capsule',
    'Oral Tablet',
    'Oral Capsule',
    'Oral Solution',
    'Tablet',
    'Capsule',
    'Injection',
    'Solution',
    'Suspension',
    'Inhaler',
    'Nasal Spray',
    'Topical',
    'Patch',
    'Cream',
    'Ointment',
  ];
  
  const lowerName = fullName.toLowerCase();
  
  for (const form of forms) {
    if (lowerName.includes(form.toLowerCase())) {
      return form;
    }
  }
  
  return undefined;
}

/**
 * Extracts strength/dosage from RxNorm full name.
 * 
 * Patterns: "0.5 MG", "10 MG/ML", "2.4 MG per 0.75 ML"
 */
function extractStrength(fullName: string): string | undefined {
  // Pattern for complex strengths like "2.4 MG per 0.75 ML" or "10 MG/ML"
  const strengthMatch = fullName.match(
    /(\d+(?:\.\d+)?\s*(?:MG|ML|MCG|G|UNT)(?:\s*(?:per|\/)\s*\d+(?:\.\d+)?\s*(?:MG|ML|MCG|G))?)/i
  );
  
  if (strengthMatch && strengthMatch[1]) {
    return strengthMatch[1];
  }
  
  return undefined;
}

/**
 * Converts a string to title case.
 */
function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(/[\s\/]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// =============================================================================
// Cache Management (Exported)
// =============================================================================

/**
 * Clears the RxNorm drug cache.
 */
export function clearRxNormCache(): void {
  drugCache.clear();
  console.log('[RxNorm] Cache cleared');
}

/**
 * Gets the current cache size.
 */
export function getRxNormCacheSize(): number {
  return drugCache.size;
}

/**
 * Gets cache statistics.
 */
export function getRxNormCacheStats(): { total: number; valid: number; expired: number } {
  let valid = 0;
  let expired = 0;
  
  for (const entry of drugCache.values()) {
    if (isCacheValid(entry)) {
      valid++;
    } else {
      expired++;
    }
  }
  
  return {
    total: drugCache.size,
    valid,
    expired,
  };
}
