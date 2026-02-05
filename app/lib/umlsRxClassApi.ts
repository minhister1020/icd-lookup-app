/**
 * UMLS RxClass API Integration
 * =============================
 *
 * Provides drug classification, ingredients, and related drug information
 * using the RxClass API from NLM.
 *
 * API Documentation: https://lhncbc.nlm.nih.gov/RxNav/APIs/RxClassAPIs.html
 *
 * Features:
 * - Drug class/category lookup (ATC, EPC, MOA, etc.)
 * - Ingredient breakdown for combination drugs
 * - Related drug suggestions (different strengths/forms)
 *
 * Note: RxClass API is free and doesn't require authentication.
 * The UMLS_API_KEY is only needed for future UMLS-specific endpoints.
 */

// =============================================================================
// Configuration
// =============================================================================

/** RxClass API base URL */
const RXCLASS_BASE_URL = 'https://rxnav.nlm.nih.gov/REST/rxclass';

/** RxNorm REST API base URL (for ingredient/related drug queries) */
const RXNORM_BASE_URL = 'https://rxnav.nlm.nih.gov/REST';

/** Cache TTL in milliseconds (24 hours) */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/** Extended cache TTL for drug classes (7 days - more stable data) */
const CLASS_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// =============================================================================
// TypeScript Interfaces
// =============================================================================

/**
 * Drug classification from RxClass API.
 */
export interface DrugClass {
  /** Unique identifier for the class */
  classId: string;

  /** Human-readable class name (e.g., "GLP-1 Agonist") */
  className: string;

  /** Classification system type */
  classType: 'ATC' | 'EPC' | 'MOA' | 'PE' | 'DISEASE' | 'VA' | 'MESH' | string;
}

/**
 * Related drug information.
 */
export interface RelatedDrug {
  /** RxNorm Concept Unique Identifier */
  rxcui: string;

  /** Full drug name */
  name: string;

  /** Dosage form (e.g., "Tablet", "Injection") */
  dosageForm: string;

  /** Drug strength (e.g., "10 MG", "0.5 MG/ML") */
  strength: string;
}

/**
 * RxClass API response structure for class lookup.
 */
interface RxClassResponse {
  rxclassDrugInfoList?: {
    rxclassDrugInfo?: Array<{
      rxclassMinConceptItem: {
        classId: string;
        className: string;
        classType: string;
      };
    }>;
  };
}

/**
 * RxNorm related concepts response structure.
 */
interface RxNormRelatedResponse {
  relatedGroup?: {
    conceptGroup?: Array<{
      tty: string;
      conceptProperties?: Array<{
        rxcui: string;
        name: string;
        tty: string;
      }>;
    }>;
  };
}

// =============================================================================
// Cache
// =============================================================================

interface CachedClasses {
  classes: DrugClass[];
  timestamp: number;
}

interface CachedIngredients {
  ingredients: string[];
  timestamp: number;
}

interface CachedRelated {
  drugs: RelatedDrug[];
  timestamp: number;
}

/** In-memory cache for drug classes */
const classCache = new Map<string, CachedClasses>();

/** In-memory cache for ingredients */
const ingredientCache = new Map<string, CachedIngredients>();

/** In-memory cache for related drugs */
const relatedCache = new Map<string, CachedRelated>();

/**
 * Checks if a cached entry is still valid.
 */
function isCacheValid<T extends { timestamp: number }>(cached: T, ttl: number): boolean {
  return Date.now() - cached.timestamp < ttl;
}

// =============================================================================
// Drug Class Lookup
// =============================================================================

/**
 * Gets drug classifications for a given RxCUI.
 *
 * Returns classifications from multiple systems (EPC, MOA, ATC, etc.)
 * prioritizing the most clinically useful ones.
 *
 * @param rxcui - RxNorm Concept Unique Identifier
 * @returns Array of DrugClass objects, empty array if not found
 *
 * @example
 * const classes = await getDrugClasses("1649574");
 * // Returns: [{ classId: "N0000175408", className: "GLP-1 Agonist", classType: "EPC" }]
 */
export async function getDrugClasses(rxcui: string): Promise<DrugClass[]> {
  if (!rxcui) {
    return [];
  }

  const cacheKey = `class:${rxcui}`;

  // Check cache first
  const cached = classCache.get(cacheKey);
  if (cached && isCacheValid(cached, CLASS_CACHE_TTL_MS)) {
    console.log(`[RxClass] Cache HIT for classes: ${rxcui}`);
    return cached.classes;
  }

  try {
    // Query RxClass API for drug classes
    const url = `${RXCLASS_BASE_URL}/class/byRxcui.json?rxcui=${encodeURIComponent(rxcui)}`;

    console.log(`[RxClass] Fetching classes for rxcui: ${rxcui}`);

    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`[RxClass] API error: ${response.status} ${response.statusText}`);
      classCache.set(cacheKey, { classes: [], timestamp: Date.now() });
      return [];
    }

    const data: RxClassResponse = await response.json();

    // Parse and deduplicate classes
    const classes = parseRxClassResponse(data);

    // Cache the result
    classCache.set(cacheKey, { classes, timestamp: Date.now() });

    console.log(`[RxClass] Found ${classes.length} classes for rxcui: ${rxcui}`);

    return classes;

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`[RxClass] Failed to fetch classes for ${rxcui}:`, message);

    // Cache the failure
    classCache.set(cacheKey, { classes: [], timestamp: Date.now() });
    return [];
  }
}

/**
 * Parses RxClass API response to extract drug classes.
 * Prioritizes EPC (Established Pharmacologic Class) and MOA (Mechanism of Action).
 */
function parseRxClassResponse(data: RxClassResponse): DrugClass[] {
  const drugInfoList = data.rxclassDrugInfoList?.rxclassDrugInfo;

  if (!drugInfoList || drugInfoList.length === 0) {
    return [];
  }

  // Extract unique classes
  const classMap = new Map<string, DrugClass>();

  for (const info of drugInfoList) {
    const concept = info.rxclassMinConceptItem;
    if (concept && concept.classId && concept.className) {
      // Use classId as key to deduplicate
      if (!classMap.has(concept.classId)) {
        classMap.set(concept.classId, {
          classId: concept.classId,
          className: concept.className,
          classType: concept.classType,
        });
      }
    }
  }

  // Sort by class type priority: EPC > MOA > ATC > others
  const typePriority: Record<string, number> = {
    'EPC': 1,    // Established Pharmacologic Class (most clinically useful)
    'MOA': 2,    // Mechanism of Action
    'ATC': 3,    // Anatomical Therapeutic Chemical
    'PE': 4,     // Physiologic Effect
    'DISEASE': 5, // Disease
  };

  return Array.from(classMap.values()).sort((a, b) => {
    const priorityA = typePriority[a.classType] || 99;
    const priorityB = typePriority[b.classType] || 99;
    return priorityA - priorityB;
  });
}

// =============================================================================
// Ingredient Lookup
// =============================================================================

/**
 * Gets active ingredients for a drug by RxCUI.
 *
 * Useful for combination drugs (e.g., Qsymia → phentermine + topiramate).
 *
 * @param rxcui - RxNorm Concept Unique Identifier
 * @returns Array of ingredient names, empty array if not found
 *
 * @example
 * const ingredients = await getDrugIngredients("1302824"); // Qsymia
 * // Returns: ["phentermine", "topiramate"]
 */
export async function getDrugIngredients(rxcui: string): Promise<string[]> {
  if (!rxcui) {
    return [];
  }

  const cacheKey = `ingredients:${rxcui}`;

  // Check cache first
  const cached = ingredientCache.get(cacheKey);
  if (cached && isCacheValid(cached, CACHE_TTL_MS)) {
    console.log(`[RxClass] Cache HIT for ingredients: ${rxcui}`);
    return cached.ingredients;
  }

  try {
    // Use RxNorm related API to find ingredients (tty=IN)
    const url = `${RXNORM_BASE_URL}/rxcui/${encodeURIComponent(rxcui)}/related.json?tty=IN`;

    console.log(`[RxClass] Fetching ingredients for rxcui: ${rxcui}`);

    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`[RxClass] Ingredients API error: ${response.status}`);
      ingredientCache.set(cacheKey, { ingredients: [], timestamp: Date.now() });
      return [];
    }

    const data: RxNormRelatedResponse = await response.json();

    // Extract ingredient names
    const ingredients = parseIngredientsResponse(data);

    // Cache the result
    ingredientCache.set(cacheKey, { ingredients, timestamp: Date.now() });

    console.log(`[RxClass] Found ${ingredients.length} ingredients for rxcui: ${rxcui}`);

    return ingredients;

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`[RxClass] Failed to fetch ingredients for ${rxcui}:`, message);

    // Cache the failure
    ingredientCache.set(cacheKey, { ingredients: [], timestamp: Date.now() });
    return [];
  }
}

/**
 * Parses RxNorm related response to extract ingredient names.
 */
function parseIngredientsResponse(data: RxNormRelatedResponse): string[] {
  const conceptGroups = data.relatedGroup?.conceptGroup;

  if (!conceptGroups || conceptGroups.length === 0) {
    return [];
  }

  const ingredients: string[] = [];

  for (const group of conceptGroups) {
    if (group.tty === 'IN' && group.conceptProperties) {
      for (const concept of group.conceptProperties) {
        if (concept.name) {
          // Capitalize first letter for display
          const name = concept.name.charAt(0).toUpperCase() + concept.name.slice(1).toLowerCase();
          ingredients.push(name);
        }
      }
    }
  }

  return ingredients;
}

// =============================================================================
// Related Drugs Lookup
// =============================================================================

/**
 * Gets related drugs (different strengths/forms) for a given RxCUI.
 *
 * @param rxcui - RxNorm Concept Unique Identifier
 * @param limit - Maximum number of related drugs to return (default: 5)
 * @returns Array of RelatedDrug objects
 *
 * @example
 * const related = await getRelatedDrugs("1649574"); // Wegovy 0.25mg
 * // Returns: [{ rxcui: "...", name: "Wegovy 0.5 MG", ... }, ...]
 */
export async function getRelatedDrugs(rxcui: string, limit: number = 5): Promise<RelatedDrug[]> {
  if (!rxcui) {
    return [];
  }

  const cacheKey = `related:${rxcui}`;

  // Check cache first
  const cached = relatedCache.get(cacheKey);
  if (cached && isCacheValid(cached, CACHE_TTL_MS)) {
    console.log(`[RxClass] Cache HIT for related drugs: ${rxcui}`);
    return cached.drugs.slice(0, limit);
  }

  try {
    // Use RxNorm related API to find related branded/clinical drugs
    // SBD = Semantic Branded Drug, SCD = Semantic Clinical Drug
    const url = `${RXNORM_BASE_URL}/rxcui/${encodeURIComponent(rxcui)}/related.json?tty=SBD+SCD`;

    console.log(`[RxClass] Fetching related drugs for rxcui: ${rxcui}`);

    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`[RxClass] Related drugs API error: ${response.status}`);
      relatedCache.set(cacheKey, { drugs: [], timestamp: Date.now() });
      return [];
    }

    const data: RxNormRelatedResponse = await response.json();

    // Parse related drugs
    const drugs = parseRelatedDrugsResponse(data, rxcui);

    // Cache the result
    relatedCache.set(cacheKey, { drugs, timestamp: Date.now() });

    console.log(`[RxClass] Found ${drugs.length} related drugs for rxcui: ${rxcui}`);

    return drugs.slice(0, limit);

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`[RxClass] Failed to fetch related drugs for ${rxcui}:`, message);

    // Cache the failure
    relatedCache.set(cacheKey, { drugs: [], timestamp: Date.now() });
    return [];
  }
}

/**
 * Parses RxNorm related response to extract related drugs.
 * Excludes the original drug to prevent circular references.
 */
function parseRelatedDrugsResponse(data: RxNormRelatedResponse, originalRxcui: string): RelatedDrug[] {
  const conceptGroups = data.relatedGroup?.conceptGroup;

  if (!conceptGroups || conceptGroups.length === 0) {
    return [];
  }

  const drugs: RelatedDrug[] = [];
  const seen = new Set<string>();

  // Add original rxcui to prevent circular references
  seen.add(originalRxcui);

  for (const group of conceptGroups) {
    if ((group.tty === 'SBD' || group.tty === 'SCD') && group.conceptProperties) {
      for (const concept of group.conceptProperties) {
        // Skip if we've already seen this drug or it's the original
        if (seen.has(concept.rxcui)) {
          continue;
        }
        seen.add(concept.rxcui);

        const parsed = parseRelatedDrugName(concept.name);

        drugs.push({
          rxcui: concept.rxcui,
          name: concept.name,
          dosageForm: parsed.dosageForm,
          strength: parsed.strength,
        });
      }
    }
  }

  return drugs;
}

/**
 * Parses a drug name to extract dosage form and strength.
 *
 * RxNorm names typically follow format:
 * "Drug Name Strength Form [Brand]"
 * Example: "semaglutide 0.25 MG/0.5 ML Pen Injector [Wegovy]"
 */
function parseRelatedDrugName(name: string): { dosageForm: string; strength: string } {
  // Default values
  let dosageForm = 'Unknown';
  let strength = '';

  // Common dosage forms to look for
  const dosageForms = [
    'Tablet', 'Capsule', 'Solution', 'Suspension', 'Injection',
    'Pen Injector', 'Auto-Injector', 'Patch', 'Cream', 'Gel',
    'Ointment', 'Oral Powder', 'Oral Liquid', 'Inhalant',
    'Nasal Spray', 'Eye Drops', 'Ear Drops', 'Suppository',
  ];

  // Find dosage form in name
  for (const form of dosageForms) {
    if (name.toLowerCase().includes(form.toLowerCase())) {
      dosageForm = form;
      break;
    }
  }

  // Extract strength using regex (e.g., "0.25 MG", "10 MG/ML")
  const strengthMatch = name.match(/(\d+(?:\.\d+)?)\s*(MG|MCG|G|ML|MG\/ML|MCG\/ML)(?:\s*\/\s*(\d+(?:\.\d+)?)\s*(ML))?/i);
  if (strengthMatch) {
    strength = strengthMatch[0];
  }

  return { dosageForm, strength };
}

// =============================================================================
// Batch Operations
// =============================================================================

/**
 * Fetches all UMLS enrichment data for a drug in parallel.
 *
 * @param rxcui - RxNorm Concept Unique Identifier
 * @returns Object with classes, ingredients, and related drugs
 */
export async function getFullDrugEnrichment(rxcui: string): Promise<{
  classes: DrugClass[];
  ingredients: string[];
  relatedDrugs: RelatedDrug[];
}> {
  if (!rxcui) {
    return { classes: [], ingredients: [], relatedDrugs: [] };
  }

  console.log(`[RxClass] Fetching full enrichment for rxcui: ${rxcui}`);

  // Fetch all data in parallel
  const [classes, ingredients, relatedDrugs] = await Promise.all([
    getDrugClasses(rxcui),
    getDrugIngredients(rxcui),
    getRelatedDrugs(rxcui),
  ]);

  return { classes, ingredients, relatedDrugs };
}

// =============================================================================
// Cache Management
// =============================================================================

/**
 * Clears all UMLS/RxClass caches.
 * Useful for testing or forcing fresh data.
 */
export function clearRxClassCache(): void {
  classCache.clear();
  ingredientCache.clear();
  relatedCache.clear();
  console.log('[RxClass] All caches cleared');
}

/**
 * Gets cache statistics for debugging.
 */
export function getRxClassCacheStats(): {
  classCount: number;
  ingredientCount: number;
  relatedCount: number;
} {
  return {
    classCount: classCache.size,
    ingredientCount: ingredientCache.size,
    relatedCount: relatedCache.size,
  };
}
