/**
 * Query Normalizer - Pattern-Based Search Transformation
 * ======================================================
 * 
 * Transforms common cancer/tumor search patterns into ICD-10 compatible terminology.
 * 
 * Problem: Users search "pancreas cancer" or "cancer of pancreas" but these phrases
 * don't match well in ICD-10 databases. The proper term is "malignant neoplasm of pancreas".
 * 
 * Solution: Pattern-based regex transformation BEFORE hitting any API.
 * 
 * Patterns Handled:
 * 1. "[organ] cancer" → "malignant neoplasm of [organ]"
 * 2. "cancer of [the] [organ]" → "malignant neoplasm of [organ]"
 * 3. "[organ] tumor" → "neoplasm of [organ]"
 * 4. "[organ] carcinoma" → "malignant neoplasm of [organ]"
 * 
 * @example
 * normalizeQuery("pancreas cancer")
 * // → { normalizedQuery: "malignant neoplasm of pancreas", wasNormalized: true }
 * 
 * normalizeQuery("cancer of the liver")
 * // → { normalizedQuery: "malignant neoplasm of liver", wasNormalized: true }
 * 
 * normalizeQuery("diabetes")
 * // → { normalizedQuery: null, wasNormalized: false }
 */

// =============================================================================
// Types
// =============================================================================

/**
 * Result of query normalization.
 */
export interface NormalizationResult {
  /** The original user query */
  originalQuery: string;
  
  /** The normalized query, or null if no pattern matched */
  normalizedQuery: string | null;
  
  /** Whether normalization was applied */
  wasNormalized: boolean;
  
  /** Which pattern matched (for debugging) */
  matchedPattern?: 'organ_cancer' | 'cancer_of_organ' | 'organ_tumor' | 'organ_carcinoma';
}

// =============================================================================
// Organ Names Database
// =============================================================================

/**
 * Known organ/body part names for validation.
 * Only transforms phrases if the extracted word is a recognized organ.
 * This prevents false positives like "car cancer" or "job cancer".
 */
const ORGAN_NAMES = new Set([
  // Digestive System
  'pancreas', 'pancreatic',
  'liver', 'hepatic',
  'stomach', 'gastric',
  'colon', 'colonic',
  'rectum', 'rectal',
  'esophagus', 'esophageal', 'oesophagus',
  'intestine', 'intestinal',
  'bowel',
  'gallbladder',
  'bile', 'biliary',
  'duodenum', 'duodenal',
  'appendix',
  
  // Respiratory System
  'lung', 'pulmonary',
  'bronchus', 'bronchial',
  'throat',
  'larynx', 'laryngeal',
  'trachea', 'tracheal',
  'nasopharynx', 'nasopharyngeal',
  'pharynx', 'pharyngeal',
  'sinus', 'nasal',
  
  // Reproductive System - Female
  'breast',
  'ovary', 'ovarian',
  'uterus', 'uterine',
  'cervix', 'cervical',
  'fallopian',
  'vulva', 'vulvar',
  'vagina', 'vaginal',
  'endometrium', 'endometrial',
  
  // Reproductive System - Male
  'prostate', 'prostatic',
  'testicle', 'testicular',
  'testis',
  'penis', 'penile',
  
  // Urinary System
  'kidney', 'renal',
  'bladder',
  'ureter', 'ureteral',
  'urethra', 'urethral',
  
  // Nervous System
  'brain', 'cerebral',
  'spine', 'spinal',
  'meninges', 'meningeal',
  'nerve',
  'pituitary',
  
  // Head & Neck
  'mouth', 'oral',
  'tongue',
  'lip',
  'eye', 'ocular',
  'ear',
  'salivary',
  'thyroid',
  'parathyroid',
  
  // Musculoskeletal
  'bone', 'osseous',
  'muscle', 'muscular',
  'cartilage',
  'joint',
  'soft tissue',
  
  // Lymphatic & Blood
  'lymph', 'lymphatic',
  'blood',
  'marrow',
  'spleen', 'splenic',
  'plasma',
  
  // Endocrine
  'adrenal',
  'pineal',
  'pancreatic islet',
  
  // Skin
  'skin', 'cutaneous', 'dermal',
  'melanoma',  // Special case - already implies skin
  
  // Other
  'heart', 'cardiac',
  'peritoneum', 'peritoneal',
  'pleura', 'pleural',
  'retroperitoneum',
  'mediastinum',
]);

// =============================================================================
// Pattern Matching
// =============================================================================

/**
 * Pattern 1: "[organ] cancer" → "malignant neoplasm of [organ]"
 * Examples: "pancreas cancer", "liver cancer", "breast cancer"
 */
function matchOrganCancer(query: string): { organ: string } | null {
  // Match: word + space + "cancer" (with optional trailing content)
  const match = query.match(/^(\w+)\s+cancer$/i);
  if (!match) return null;
  
  const organ = match[1].toLowerCase();
  if (!ORGAN_NAMES.has(organ)) return null;
  
  return { organ };
}

/**
 * Pattern 2: "cancer of [the] [organ]" → "malignant neoplasm of [organ]"
 * Examples: "cancer of pancreas", "cancer of the liver"
 */
function matchCancerOfOrgan(query: string): { organ: string } | null {
  // Match: "cancer of" + optional "the" + word
  const match = query.match(/^cancer\s+of\s+(the\s+)?(\w+)$/i);
  if (!match) return null;
  
  const organ = match[2].toLowerCase();
  if (!ORGAN_NAMES.has(organ)) return null;
  
  return { organ };
}

/**
 * Pattern 3: "[organ] tumor" → "neoplasm of [organ]"
 * Examples: "brain tumor", "liver tumor"
 * Note: Uses "neoplasm" (not "malignant neoplasm") since tumors can be benign
 */
function matchOrganTumor(query: string): { organ: string } | null {
  // Match: word + space + "tumor" or "tumour"
  const match = query.match(/^(\w+)\s+tumou?r$/i);
  if (!match) return null;
  
  const organ = match[1].toLowerCase();
  if (!ORGAN_NAMES.has(organ)) return null;
  
  return { organ };
}

/**
 * Pattern 4: "[organ] carcinoma" → "malignant neoplasm of [organ]"
 * Examples: "lung carcinoma", "breast carcinoma"
 */
function matchOrganCarcinoma(query: string): { organ: string } | null {
  // Match: word + space + "carcinoma"
  const match = query.match(/^(\w+)\s+carcinoma$/i);
  if (!match) return null;
  
  const organ = match[1].toLowerCase();
  if (!ORGAN_NAMES.has(organ)) return null;
  
  return { organ };
}

/**
 * Pattern 5: "[adjective] [organ] cancer" → "malignant neoplasm of [organ]"
 * Examples: "metastatic liver cancer", "advanced breast cancer"
 * Handles common medical adjectives before organ name
 */
function matchAdjectiveOrganCancer(query: string): { organ: string; adjective: string } | null {
  // Common medical adjectives that precede organ names
  const adjectives = [
    'metastatic', 'advanced', 'early', 'late', 'stage', 'primary',
    'secondary', 'terminal', 'aggressive', 'invasive', 'localized',
    'small', 'large', 'non-small', 'squamous', 'adenocarcinoma'
  ];
  
  const adjectivePattern = adjectives.join('|');
  const regex = new RegExp(`^(${adjectivePattern})\\s+(\\w+)\\s+cancer$`, 'i');
  const match = query.match(regex);
  
  if (!match) return null;
  
  const adjective = match[1].toLowerCase();
  const organ = match[2].toLowerCase();
  
  if (!ORGAN_NAMES.has(organ)) return null;
  
  return { organ, adjective };
}

// =============================================================================
// Main Normalizer Function
// =============================================================================

/**
 * Normalizes a search query by transforming cancer/tumor patterns.
 * 
 * This function should be called BEFORE any other query processing
 * (termMapper, Conditions API, etc.) to convert lay terms to medical terminology.
 * 
 * @param query - The user's original search query
 * @returns NormalizationResult with normalized query or null if no match
 * 
 * @example
 * normalizeQuery("pancreas cancer")
 * // { originalQuery: "pancreas cancer", normalizedQuery: "malignant neoplasm of pancreas", wasNormalized: true, matchedPattern: "organ_cancer" }
 * 
 * @example
 * normalizeQuery("diabetes")
 * // { originalQuery: "diabetes", normalizedQuery: null, wasNormalized: false }
 */
export function normalizeQuery(query: string): NormalizationResult {
  const logPrefix = '[Normalizer]';
  
  // Clean the input
  const trimmedQuery = query.trim().toLowerCase();
  
  // Handle empty input
  if (!trimmedQuery) {
    return {
      originalQuery: query,
      normalizedQuery: null,
      wasNormalized: false,
    };
  }
  
  // Try each pattern in order of specificity
  
  // Pattern 5: [adjective] [organ] cancer (most specific, check first)
  const adjOrganCancer = matchAdjectiveOrganCancer(trimmedQuery);
  if (adjOrganCancer) {
    const normalized = `malignant neoplasm of ${adjOrganCancer.organ}`;
    console.log(`${logPrefix} Input: "${query}" → Normalized: "${normalized}" (pattern: adjective_organ_cancer, adjective: ${adjOrganCancer.adjective})`);
    return {
      originalQuery: query,
      normalizedQuery: normalized,
      wasNormalized: true,
      matchedPattern: 'organ_cancer', // Group with organ_cancer for simplicity
    };
  }
  
  // Pattern 1: [organ] cancer
  const organCancer = matchOrganCancer(trimmedQuery);
  if (organCancer) {
    const normalized = `malignant neoplasm of ${organCancer.organ}`;
    console.log(`${logPrefix} Input: "${query}" → Normalized: "${normalized}" (pattern: organ_cancer)`);
    return {
      originalQuery: query,
      normalizedQuery: normalized,
      wasNormalized: true,
      matchedPattern: 'organ_cancer',
    };
  }
  
  // Pattern 2: cancer of [the] [organ]
  const cancerOfOrgan = matchCancerOfOrgan(trimmedQuery);
  if (cancerOfOrgan) {
    const normalized = `malignant neoplasm of ${cancerOfOrgan.organ}`;
    console.log(`${logPrefix} Input: "${query}" → Normalized: "${normalized}" (pattern: cancer_of_organ)`);
    return {
      originalQuery: query,
      normalizedQuery: normalized,
      wasNormalized: true,
      matchedPattern: 'cancer_of_organ',
    };
  }
  
  // Pattern 3: [organ] tumor
  const organTumor = matchOrganTumor(trimmedQuery);
  if (organTumor) {
    // Use "neoplasm" (not "malignant neoplasm") since tumors can be benign
    const normalized = `neoplasm of ${organTumor.organ}`;
    console.log(`${logPrefix} Input: "${query}" → Normalized: "${normalized}" (pattern: organ_tumor)`);
    return {
      originalQuery: query,
      normalizedQuery: normalized,
      wasNormalized: true,
      matchedPattern: 'organ_tumor',
    };
  }
  
  // Pattern 4: [organ] carcinoma
  const organCarcinoma = matchOrganCarcinoma(trimmedQuery);
  if (organCarcinoma) {
    const normalized = `malignant neoplasm of ${organCarcinoma.organ}`;
    console.log(`${logPrefix} Input: "${query}" → Normalized: "${normalized}" (pattern: organ_carcinoma)`);
    return {
      originalQuery: query,
      normalizedQuery: normalized,
      wasNormalized: true,
      matchedPattern: 'organ_carcinoma',
    };
  }
  
  // No pattern matched - return unchanged
  console.log(`${logPrefix} Input: "${query}" → No match`);
  return {
    originalQuery: query,
    normalizedQuery: null,
    wasNormalized: false,
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Checks if a query would be normalized.
 * Useful for UI hints without performing full normalization.
 * 
 * @param query - The query to check
 * @returns True if normalization would occur
 */
export function wouldNormalize(query: string): boolean {
  const result = normalizeQuery(query);
  return result.wasNormalized;
}

/**
 * Gets the list of recognized organ names.
 * Useful for debugging and testing.
 * 
 * @returns Array of organ names
 */
export function getOrganNames(): string[] {
  return Array.from(ORGAN_NAMES).sort();
}

/**
 * Adds custom organ names to the set.
 * Useful for extending the normalizer dynamically.
 * 
 * @param organs - Array of organ names to add
 */
export function addOrganNames(organs: string[]): void {
  for (const organ of organs) {
    ORGAN_NAMES.add(organ.toLowerCase());
  }
  console.log(`[Normalizer] Added ${organs.length} custom organ names`);
}

/**
 * Gets normalizer statistics.
 * 
 * @returns Object with normalizer metadata
 */
export function getNormalizerStats(): { organCount: number; patterns: string[] } {
  return {
    organCount: ORGAN_NAMES.size,
    patterns: ['organ_cancer', 'cancer_of_organ', 'organ_tumor', 'organ_carcinoma'],
  };
}
