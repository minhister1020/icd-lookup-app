/**
 * Condition-Drug Mappings Database
 * =================================
 * 
 * This file maintains curated mappings of medical conditions to known drug names.
 * These mappings are used to find relevant drugs for ICD-10 conditions.
 * 
 * 3-TIER LOOKUP SYSTEM:
 * - Tier 1: Curated mappings (fastest, most accurate)
 * - Tier 2: Fallback cache (AI-generated, cached for 24hr)
 * - Tier 3: AI generation (on-demand via Claude Haiku)
 * 
 * Strategy:
 * 1. User searches for a condition (e.g., "Obesity, unspecified")
 * 2. We match the condition to known drug names using this database
 * 3. If no curated mapping exists, AI generates a drug list
 * 4. RxNorm API fetches detailed drug information (brand names, dosages)
 * 5. Claude AI validates and scores each drug for clinical relevance
 * 
 * Why this approach?
 * - OpenFDA's drug label API has incomplete data (missing brand/generic names)
 * - RxClass indication database is outdated (missing GLP-1 drugs for obesity)
 * - This curated approach ensures we include modern, relevant drugs
 * - AI fallback provides comprehensive coverage for all conditions
 * - Claude AI provides the clinical validation layer
 * 
 * Maintenance:
 * - Add new drugs when FDA approves them for conditions
 * - Order drugs by clinical preference (most commonly prescribed first)
 * - Use generic names (RxNorm will find brand names)
 * - Monitor telemetry to identify frequently AI-generated conditions for curation
 */

import { generateDrugListWithAI } from './drugListGenerator';

// =============================================================================
// Fallback Cache Configuration
// =============================================================================

/**
 * Cache for AI-generated drug lists.
 * Separate from validation cache to avoid confusion.
 * 
 * Key: Normalized condition name (lowercase, trimmed, spaces collapsed)
 * Value: Cached drug list with metadata
 */
interface FallbackCacheEntry {
  /** Array of drug names from AI */
  drugs: string[];
  /** Unix timestamp when cached */
  timestamp: number;
  /** Original condition name (for debugging) */
  conditionName: string;
}

/**
 * Statistics about the fallback cache and lookup patterns.
 */
export interface FallbackStats {
  /** Total number of drug lookups performed */
  totalLookups: number;
  /** Number of lookups resolved by curated mappings */
  curatedHits: number;
  /** Number of lookups resolved by fallback cache */
  fallbackCacheHits: number;
  /** Number of lookups that required AI generation */
  aiGenerations: number;
  /** Ratio of curated hits to total lookups (0-1) */
  curatedHitRate: number;
  /** Current number of entries in fallback cache */
  fallbackCacheSize: number;
  /** Number of valid (non-expired) cache entries */
  validEntries: number;
  /** Number of expired cache entries pending cleanup */
  expiredEntries: number;
}

/**
 * Fallback cache TTL: 24 hours (same as validation cache).
 */
const FALLBACK_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Maximum number of fallback cache entries.
 * Smaller than validation cache since most conditions will be curated.
 */
const FALLBACK_CACHE_MAX_SIZE = 200;

/**
 * In-memory cache for AI-generated drug lists.
 */
const fallbackCache = new Map<string, FallbackCacheEntry>();

/**
 * Track in-flight AI generation requests to prevent duplicates.
 * Key: Normalized condition name
 * Value: Promise of drug list generation
 */
const inFlightRequests = new Map<string, Promise<string[]>>();

// =============================================================================
// Telemetry Counters
// =============================================================================

/**
 * Telemetry counters for monitoring lookup patterns.
 */
let curatedHits = 0;
let fallbackCacheHits = 0;
let aiGenerations = 0;
let totalLookups = 0;

/**
 * Log telemetry every N lookups.
 */
const TELEMETRY_LOG_INTERVAL = 50;

// =============================================================================
// Cache Helper Functions
// =============================================================================

/**
 * Normalizes condition name for consistent cache keys.
 * - Converts to lowercase
 * - Trims whitespace
 * - Collapses multiple spaces to single space
 * 
 * @param conditionName - Raw condition name
 * @returns Normalized cache key
 */
function normalizeCacheKey(conditionName: string): string {
  return conditionName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Checks if a fallback cache entry is still valid.
 * 
 * @param entry - Cached entry
 * @returns True if cache is still valid
 */
function isFallbackCacheValid(entry: FallbackCacheEntry): boolean {
  const age = Date.now() - entry.timestamp;
  return age < FALLBACK_CACHE_TTL_MS;
}

/**
 * Retrieves drugs from fallback cache if valid.
 * 
 * @param cacheKey - Normalized cache key
 * @returns Array of drug names, or null if not cached/expired
 */
function getFallbackCached(cacheKey: string): string[] | null {
  const cached = fallbackCache.get(cacheKey);
  
  if (!cached) {
    return null;
  }
  
  if (!isFallbackCacheValid(cached)) {
    // Expired - remove and return null
    fallbackCache.delete(cacheKey);
    console.log(`[DrugMappings:FallbackCache] Expired entry removed: ${cacheKey}`);
    return null;
  }
  
  // Valid cache hit
  return cached.drugs;
}

/**
 * Stores drugs in fallback cache.
 * Handles cache size limits with LRU eviction.
 * 
 * @param cacheKey - Normalized cache key
 * @param drugs - Array of drug names
 * @param conditionName - Original condition name (for logging)
 */
function setFallbackCache(
  cacheKey: string,
  drugs: string[],
  conditionName: string
): void {
  try {
    // Clean expired entries if approaching limit
    if (fallbackCache.size >= FALLBACK_CACHE_MAX_SIZE * 0.9) {
      cleanFallbackCache();
    }

    // Store new entry
    fallbackCache.set(cacheKey, {
      drugs,
      timestamp: Date.now(),
      conditionName,
    });

    console.log(`[DrugMappings:FallbackCache] Cached ${drugs.length} drugs for: ${conditionName}`);
  } catch (error) {
    // Cache errors should never break the pipeline
    console.warn(`[DrugMappings:FallbackCache] Failed to cache:`, error);
  }
}

/**
 * Removes expired entries and enforces size limit with LRU eviction.
 */
function cleanFallbackCache(): void {
  const now = Date.now();
  const entriesToDelete: string[] = [];

  // First pass: identify expired entries
  for (const [key, entry] of fallbackCache.entries()) {
    if (!isFallbackCacheValid(entry)) {
      entriesToDelete.push(key);
    }
  }

  // Delete expired entries
  for (const key of entriesToDelete) {
    fallbackCache.delete(key);
  }

  if (entriesToDelete.length > 0) {
    console.log(`[DrugMappings:FallbackCache] Cleaned ${entriesToDelete.length} expired entries`);
  }

  // If still over limit, remove oldest entries (LRU)
  if (fallbackCache.size > FALLBACK_CACHE_MAX_SIZE) {
    const entries = Array.from(fallbackCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp); // Oldest first

    const toRemove = entries.slice(0, fallbackCache.size - FALLBACK_CACHE_MAX_SIZE);
    for (const [key] of toRemove) {
      fallbackCache.delete(key);
    }

    console.log(`[DrugMappings:FallbackCache] Evicted ${toRemove.length} oldest entries (LRU)`);
  }
}

/**
 * Logs telemetry metrics periodically.
 */
function maybeLogTelemetry(): void {
  totalLookups++;
  
  if (totalLookups % TELEMETRY_LOG_INTERVAL === 0) {
    const curatedPct = ((curatedHits / totalLookups) * 100).toFixed(1);
    const fallbackPct = ((fallbackCacheHits / totalLookups) * 100).toFixed(1);
    const aiPct = ((aiGenerations / totalLookups) * 100).toFixed(1);
    
    console.log(
      `[DrugMappings:Telemetry] After ${totalLookups} lookups: ` +
      `${curatedPct}% curated (${curatedHits}), ` +
      `${fallbackPct}% cached fallback (${fallbackCacheHits}), ` +
      `${aiPct}% AI generated (${aiGenerations})`
    );
  }
}

// =============================================================================
// Exported Functions for Monitoring
// =============================================================================

/**
 * Gets current fallback cache statistics.
 * 
 * @returns Object with cache metrics
 */
export function getFallbackStats(): FallbackStats {
  let validCount = 0;
  let expiredCount = 0;

  for (const entry of fallbackCache.values()) {
    if (isFallbackCacheValid(entry)) {
      validCount++;
    } else {
      expiredCount++;
    }
  }

  return {
    totalLookups,
    curatedHits,
    fallbackCacheHits,
    aiGenerations,
    curatedHitRate: totalLookups > 0 ? (curatedHits / totalLookups) : 0,
    fallbackCacheSize: fallbackCache.size,
    validEntries: validCount,
    expiredEntries: expiredCount,
  };
}

/**
 * Clears the fallback cache.
 * Useful for testing or forcing fresh data.
 */
export function clearFallbackCache(): void {
  const size = fallbackCache.size;
  fallbackCache.clear();
  inFlightRequests.clear();
  console.log(`[DrugMappings:FallbackCache] Cleared ${size} entries`);
}

// =============================================================================
// Shared Drug Lists (to avoid duplication)
// =============================================================================

/**
 * Obesity & Weight Management Drugs
 * 
 * FDA-APPROVED for obesity (score 8-10):
 * - Wegovy (semaglutide) - GLP-1 approved specifically for weight loss
 * - Saxenda (liraglutide) - GLP-1 approved specifically for weight loss
 * - Zepbound (tirzepatide) - GLP-1/GIP approved specifically for weight loss
 * - Qsymia (phentermine/topiramate) - Combination approved for obesity
 * - Contrave (naltrexone/bupropion) - Combination approved for obesity
 * - Phentermine (Adipex-P) - Approved for short-term weight loss
 * - Orlistat (Xenical, Alli) - Lipase inhibitor approved for obesity
 * 
 * COMMONLY PRESCRIBED OFF-LABEL (score 4-6):
 * - Ozempic (semaglutide) - Approved for diabetes, widely used off-label for weight loss
 * - Mounjaro (tirzepatide) - Approved for diabetes, widely used off-label for weight loss
 * - Metformin - Approved for diabetes, sometimes used off-label for weight
 */
const OBESITY_DRUGS = [
  // FDA-APPROVED for obesity (will score 8-10)
  'Wegovy',                  // Semaglutide - obesity indication
  'Saxenda',                 // Liraglutide - obesity indication
  'Zepbound',                // Tirzepatide - obesity indication
  'phentermine/topiramate',  // Qsymia - combination
  'naltrexone/bupropion',    // Contrave - combination
  'phentermine',             // Adipex-P, Lomaira
  'orlistat',                // Xenical, Alli (OTC)
  'diethylpropion',          // Tenuate
  // COMMONLY PRESCRIBED OFF-LABEL (will score 4-6)
  'Ozempic',                 // Semaglutide - diabetes indication, used off-label
  'Mounjaro',                // Tirzepatide - diabetes indication, used off-label
  'metformin',               // Diabetes drug, sometimes used off-label for weight
];

// =============================================================================
// Condition-Drug Mappings
// =============================================================================

/**
 * Maps condition keywords to arrays of drug names (generic names preferred).
 * 
 * Keys: Lowercase condition keywords for flexible matching
 * Values: Drug names that RxNorm can resolve to brand names and details
 * 
 * Drug ordering: Most commonly prescribed / preferred drugs first
 */
export const CONDITION_DRUG_MAPPINGS: Record<string, string[]> = {
  // =========================================================================
  // Metabolic & Endocrine Conditions
  // =========================================================================
  
  // Obesity & Weight Management - all aliases use shared list
  'obesity': OBESITY_DRUGS,
  'weight': OBESITY_DRUGS,
  'morbid': OBESITY_DRUGS,
  'overweight': OBESITY_DRUGS,
  'bmi': OBESITY_DRUGS,
  
  /**
   * Type 2 Diabetes Mellitus
   * - Metformin is first-line unless contraindicated
   * - GLP-1s and SGLT2s preferred for cardiovascular/renal benefits
   * - DPP-4 inhibitors as alternatives
   * - Sulfonylureas and insulin for additional control
   */
  'diabetes': [
    'metformin',              // First-line therapy
    'semaglutide',            // Ozempic, Rybelsus - GLP-1
    'empagliflozin',          // Jardiance - SGLT2
    'dapagliflozin',          // Farxiga - SGLT2
    'liraglutide',            // Victoza - GLP-1
    'sitagliptin',            // Januvia - DPP-4
    'glipizide',              // Sulfonylurea
    'insulin glargine',       // Lantus, Basaglar - basal insulin
    'dulaglutide',            // Trulicity - GLP-1
    'canagliflozin',          // Invokana - SGLT2
  ],
  
  // Alias for glucose/glycemic conditions
  'glucose': [
    'metformin',
    'semaglutide',
    'empagliflozin',
    'sitagliptin',
    'glipizide',
    'insulin glargine',
  ],
  
  /**
   * Thyroid Disorders
   */
  'hypothyroid': [
    'levothyroxine',          // Synthroid, Levoxyl
    'liothyronine',           // Cytomel - T3
  ],
  
  'hyperthyroid': [
    'methimazole',            // Tapazole
    'propylthiouracil',       // PTU
    'propranolol',            // For symptom control
  ],
  
  // =========================================================================
  // Cardiovascular Conditions
  // =========================================================================
  
  /**
   * Hypertension (High Blood Pressure)
   * - ACE inhibitors/ARBs first-line for most patients
   * - CCBs excellent for elderly and African American patients
   * - Thiazides for volume management
   * - Beta-blockers for specific indications
   */
  'hypertension': [
    'lisinopril',             // ACE inhibitor
    'amlodipine',             // Calcium channel blocker
    'losartan',               // ARB
    'hydrochlorothiazide',    // Thiazide diuretic
    'metoprolol',             // Beta-blocker
    'valsartan',              // ARB
    'olmesartan',             // ARB
    'chlorthalidone',         // Thiazide-like diuretic
  ],
  
  // Alias for blood pressure
  'blood pressure': [
    'lisinopril',
    'amlodipine',
    'losartan',
    'hydrochlorothiazide',
    'metoprolol',
    'valsartan',
  ],
  
  // Alias: "high blood pressure" - common lay term
  'high blood pressure': [
    'lisinopril',
    'amlodipine',
    'losartan',
    'hydrochlorothiazide',
    'metoprolol',
  ],

  /**
   * Arrhythmias (General)
   */
  'arrhythmia': [
    'metoprolol',
    'amiodarone',
    'flecainide',
    'sotalol',
    'diltiazem',
    'digoxin',
    'propafenone',
    'dronedarone',
  ],
  
  'tachycardia': [
    'metoprolol',
    'diltiazem',
    'verapamil',
    'adenosine',
    'amiodarone',
  ],
  
  'bradycardia': [
    'atropine',
    'isoproterenol',
    'dopamine',
  ],
  
  /**
   * High Cholesterol / Hyperlipidemia
   * - Statins are cornerstone therapy
   * - PCSK9 inhibitors for refractory cases
   * - Ezetimibe as add-on
   */
  'cholesterol': [
    'atorvastatin',           // Lipitor - high intensity
    'rosuvastatin',           // Crestor - high intensity
    'simvastatin',            // Zocor
    'pravastatin',            // Pravachol
    'ezetimibe',              // Zetia - add-on
    'evolocumab',             // Repatha - PCSK9
    'alirocumab',             // Praluent - PCSK9
    'fenofibrate',            // For triglycerides
  ],
  
  // Alias for lipid conditions
  'lipid': [
    'atorvastatin',
    'rosuvastatin',
    'simvastatin',
    'ezetimibe',
    'fenofibrate',
  ],
  
  /**
   * Heart Failure
   */
  'heart failure': [
    'sacubitril/valsartan',   // Entresto - ARNI
    'carvedilol',             // Beta-blocker
    'lisinopril',             // ACE inhibitor
    'spironolactone',         // MRA
    'furosemide',             // Loop diuretic
    'empagliflozin',          // SGLT2 - now approved for HF
    'dapagliflozin',          // SGLT2 - now approved for HF
  ],
  
  /**
   * Atrial Fibrillation
   */
  'atrial fibrillation': [
    'apixaban',               // Eliquis - DOAC
    'rivaroxaban',            // Xarelto - DOAC
    'warfarin',               // Coumadin - vitamin K antagonist
    'metoprolol',             // Rate control
    'diltiazem',              // Rate control
    'amiodarone',             // Rhythm control
  ],
  
  /**
   * Myocardial Infarction (Heart Attack) - I21.x codes
   * Standard MONA therapy + secondary prevention
   * - Antiplatelet: Aspirin + P2Y12 inhibitor
   * - Beta-blocker: Reduces mortality
   * - ACE inhibitor: Cardioprotective
   * - Statin: High-intensity for plaque stabilization
   * - Anticoagulation: Acute phase
   */
  'myocardial infarction': [
    'aspirin',                    // Antiplatelet - cornerstone therapy
    'clopidogrel',                // P2Y12 inhibitor
    'ticagrelor',                 // P2Y12 inhibitor (preferred in ACS)
    'prasugrel',                  // P2Y12 inhibitor (PCI patients)
    'metoprolol',                 // Beta-blocker - reduces mortality
    'carvedilol',                 // Beta-blocker alternative
    'atorvastatin',               // High-intensity statin
    'rosuvastatin',               // High-intensity statin alternative
    'lisinopril',                 // ACE inhibitor - cardioprotective
    'ramipril',                   // ACE inhibitor alternative
    'losartan',                   // ARB (if ACE intolerant)
    'nitroglycerin',              // Nitrate - acute chest pain
    'isosorbide mononitrate',     // Long-acting nitrate
    'enoxaparin',                 // LMWH anticoagulant
    'heparin',                    // Anticoagulant
  ],

  // Alias: "heart attack" - common lay term
  'heart attack': [
    'aspirin',
    'clopidogrel',
    'ticagrelor',
    'metoprolol',
    'atorvastatin',
    'lisinopril',
    'nitroglycerin',
    'enoxaparin',
  ],

  /**
   * Acute Coronary Syndrome (ACS) - umbrella term for MI and unstable angina
   */
  'acute coronary syndrome': [
    'aspirin',
    'clopidogrel',
    'ticagrelor',
    'prasugrel',
    'metoprolol',
    'atorvastatin',
    'lisinopril',
    'enoxaparin',
    'heparin',
    'nitroglycerin',
  ],

  // Shorter alias for ACS
  'acute coronary': [
    'aspirin',
    'clopidogrel',
    'ticagrelor',
    'metoprolol',
    'atorvastatin',
    'lisinopril',
    'enoxaparin',
  ],

  /**
   * STEMI - ST Elevation Myocardial Infarction
   * More aggressive anticoagulation, often PCI
   */
  'st elevation': [
    'aspirin',
    'clopidogrel',
    'ticagrelor',
    'prasugrel',
    'metoprolol',
    'atorvastatin',
    'lisinopril',
    'enoxaparin',
    'heparin',
    'bivalirudin',                // Direct thrombin inhibitor (PCI)
  ],

  // Alias for STEMI
  'stemi': [
    'aspirin',
    'clopidogrel',
    'ticagrelor',
    'prasugrel',
    'metoprolol',
    'atorvastatin',
    'lisinopril',
    'enoxaparin',
  ],

  /**
   * NSTEMI - Non-ST Elevation Myocardial Infarction
   */
  'nstemi': [
    'aspirin',
    'clopidogrel',
    'ticagrelor',
    'metoprolol',
    'atorvastatin',
    'lisinopril',
    'enoxaparin',
  ],

  // Alias for NSTEMI conditions
  'non-st elevation': [
    'aspirin',
    'clopidogrel',
    'ticagrelor',
    'metoprolol',
    'atorvastatin',
    'lisinopril',
    'enoxaparin',
  ],

  /**
   * Angina Pectoris - I20.x codes
   * Stable angina: nitrates, beta-blockers, CCBs
   * Unstable angina: same as ACS
   */
  'angina': [
    'nitroglycerin',              // First-line acute relief
    'isosorbide mononitrate',     // Long-acting nitrate
    'isosorbide dinitrate',       // Nitrate
    'metoprolol',                 // Beta-blocker - reduces episodes
    'atenolol',                   // Beta-blocker
    'amlodipine',                 // CCB - if beta-blocker contraindicated
    'diltiazem',                  // CCB
    'ranolazine',                 // Anti-anginal (refractory cases)
    'aspirin',                    // Secondary prevention
    'atorvastatin',               // Statin for underlying CAD
  ],

  // Alias for chest pain related to angina
  'chest pain': [
    'nitroglycerin',
    'aspirin',
    'metoprolol',
    'atorvastatin',
  ],

  /**
   * Coronary Artery Disease (CAD) - I25.x codes
   * Chronic management: antiplatelet, statin, BP control
   */
  'coronary artery disease': [
    'aspirin',                    // Antiplatelet
    'clopidogrel',                // If aspirin intolerant or post-PCI
    'atorvastatin',               // High-intensity statin
    'rosuvastatin',               // Statin alternative
    'metoprolol',                 // Beta-blocker
    'lisinopril',                 // ACE inhibitor
    'amlodipine',                 // CCB for angina/HTN
    'nitroglycerin',              // PRN chest pain
    'ezetimibe',                  // Add-on lipid lowering
  ],

  // Shorter alias for CAD
  'coronary artery': [
    'aspirin',
    'clopidogrel',
    'atorvastatin',
    'metoprolol',
    'lisinopril',
    'amlodipine',
  ],

  /**
   * Ischemic Heart Disease - general term
   */
  'ischemic heart': [
    'aspirin',
    'clopidogrel',
    'atorvastatin',
    'metoprolol',
    'lisinopril',
    'nitroglycerin',
  ],

  // Alias for cardiac ischemia
  'cardiac ischemia': [
    'aspirin',
    'atorvastatin',
    'metoprolol',
    'lisinopril',
    'nitroglycerin',
  ],

  /**
   * Unstable Angina - treated same as NSTEMI
   */
  'unstable angina': [
    'aspirin',
    'clopidogrel',
    'ticagrelor',
    'metoprolol',
    'atorvastatin',
    'lisinopril',
    'enoxaparin',
    'nitroglycerin',
  ],
  
  // =========================================================================
  // Mental Health Conditions
  // =========================================================================
  
  /**
   * Depression / Major Depressive Disorder
   * - SSRIs are first-line
   * - SNRIs for comorbid pain or anxiety
   * - Bupropion for fatigue or smoking cessation
   * - Atypical antidepressants for specific situations
   */
  'depression': [
    'sertraline',             // Zoloft - SSRI
    'escitalopram',           // Lexapro - SSRI
    'fluoxetine',             // Prozac - SSRI
    'venlafaxine',            // Effexor - SNRI
    'duloxetine',             // Cymbalta - SNRI
    'bupropion',              // Wellbutrin - NDRI
    'citalopram',             // Celexa - SSRI
    'mirtazapine',            // Remeron - atypical
  ],
  
  // Alias for depressive
  'depressive': [
    'sertraline',
    'escitalopram',
    'fluoxetine',
    'venlafaxine',
    'duloxetine',
    'bupropion',
  ],
  
  /**
   * Anxiety Disorders
   * - SSRIs/SNRIs for long-term management
   * - Buspirone for chronic anxiety
   * - Benzodiazepines for short-term (with caution)
   */
  'anxiety': [
    'sertraline',             // SSRI - first line
    'escitalopram',           // SSRI
    'venlafaxine',            // SNRI
    'buspirone',              // Non-benzo anxiolytic
    'duloxetine',             // SNRI
    'paroxetine',             // SSRI
    'lorazepam',              // Benzo - short term
    'alprazolam',             // Benzo - short term
  ],
  
  /**
   * Bipolar Disorder
   */
  'bipolar': [
    'lithium',                // Classic mood stabilizer
    'lamotrigine',            // Lamictal - mood stabilizer
    'valproate',              // Depakote
    'quetiapine',             // Seroquel - atypical antipsychotic
    'aripiprazole',           // Abilify
    'olanzapine',             // Zyprexa
  ],
  
  /**
   * ADHD
   */
  'adhd': [
    'methylphenidate',        // Ritalin, Concerta
    'amphetamine',            // Adderall
    'lisdexamfetamine',       // Vyvanse
    'atomoxetine',            // Strattera - non-stimulant
    'guanfacine',             // Intuniv - non-stimulant
  ],
  
  /**
   * Insomnia / Sleep Disorders
   */
  'insomnia': [
    'zolpidem',               // Ambien
    'eszopiclone',            // Lunesta
    'trazodone',              // Off-label, very common
    'suvorexant',             // Belsomra
    'lemborexant',            // Dayvigo
    'melatonin',              // OTC
  ],
  
  'sleep': [
    'zolpidem',
    'eszopiclone',
    'trazodone',
    'suvorexant',
    'melatonin',
  ],
  
  // =========================================================================
  // Respiratory Conditions
  // =========================================================================
  
  /**
   * Asthma
   * - ICS cornerstone of maintenance therapy
   * - LABA added for moderate-severe
   * - SABA for rescue
   * - Biologics for severe asthma
   */
  'asthma': [
    'fluticasone',            // Flovent - ICS
    'budesonide',             // Pulmicort - ICS
    'albuterol',              // ProAir, Ventolin - SABA rescue
    'fluticasone/salmeterol', // Advair - ICS/LABA combo
    'budesonide/formoterol',  // Symbicort - ICS/LABA combo
    'montelukast',            // Singulair - leukotriene
    'tiotropium',             // Spiriva - LAMA
    'dupilumab',              // Dupixent - biologic
  ],
  
  /**
   * COPD
   */
  'copd': [
    'tiotropium',             // Spiriva - LAMA
    'fluticasone/salmeterol', // Advair
    'budesonide/formoterol',  // Symbicort
    'umeclidinium',           // Incruse - LAMA
    'albuterol',              // Rescue inhaler
    'roflumilast',            // Daliresp - PDE4 inhibitor
  ],
  
  // Alias for COPD full name
  'chronic obstructive pulmonary': [
    'albuterol',
    'ipratropium',
    'tiotropium',
    'fluticasone',
    'budesonide',
    'salmeterol',
    'formoterol',
    'prednisone',
    'roflumilast',
  ],
  
  /**
   * Pneumonia - J18.x
   */
  'pneumonia': [
    'amoxicillin',
    'azithromycin',
    'levofloxacin',
    'ceftriaxone',
    'doxycycline',
    'moxifloxacin',
    'ampicillin',
    'piperacillin',
  ],
  
  /**
   * Bronchitis
   */
  'bronchitis': [
    'albuterol',
    'guaifenesin',
    'dextromethorphan',
    'azithromycin',
    'amoxicillin',
    'prednisone',
    'ipratropium',
  ],
  
  // =========================================================================
  // Gastrointestinal Conditions
  // =========================================================================
  
  /**
   * GERD / Acid Reflux
   * - PPIs most effective
   * - H2 blockers for milder cases
   */
  'gerd': [
    'omeprazole',             // Prilosec - PPI
    'esomeprazole',           // Nexium - PPI
    'pantoprazole',           // Protonix - PPI
    'lansoprazole',           // Prevacid - PPI
    'famotidine',             // Pepcid - H2 blocker
    'ranitidine',             // Zantac - H2 (if available)
  ],
  
  // Alias for acid reflux
  'reflux': [
    'omeprazole',
    'esomeprazole',
    'pantoprazole',
    'famotidine',
  ],
  
  // Alias for heartburn
  'heartburn': [
    'omeprazole',
    'esomeprazole',
    'pantoprazole',
    'famotidine',
  ],
  
  // Full name alias
  'gastroesophageal reflux': [
    'omeprazole',
    'pantoprazole',
    'esomeprazole',
    'lansoprazole',
    'famotidine',
    'sucralfate',
    'metoclopramide',
  ],
  
  'acid reflux': [
    'omeprazole',
    'pantoprazole',
    'famotidine',
    'calcium carbonate',
  ],
  
  /**
   * Peptic Ulcer - K27.x
   */
  'peptic ulcer': [
    'omeprazole',
    'pantoprazole',
    'sucralfate',
    'misoprostol',
    'famotidine',
    'amoxicillin',
    'clarithromycin',
    'metronidazole',
    'bismuth subsalicylate',
  ],
  
  'gastric ulcer': [
    'omeprazole',
    'pantoprazole',
    'sucralfate',
    'famotidine',
  ],
  
  /**
   * Inflammatory Bowel Disease
   */
  'crohn': [
    'mesalamine',
    'sulfasalazine',
    'budesonide',
    'prednisone',
    'azathioprine',
    'mercaptopurine',
    'methotrexate',
    'infliximab',
    'adalimumab',
    'vedolizumab',
  ],
  
  'ulcerative colitis': [
    'mesalamine',
    'sulfasalazine',
    'budesonide',
    'prednisone',
    'azathioprine',
    'infliximab',
    'adalimumab',
    'vedolizumab',
    'tofacitinib',
  ],
  
  'inflammatory bowel': [
    'mesalamine',
    'sulfasalazine',
    'budesonide',
    'prednisone',
    'infliximab',
    'adalimumab',
  ],
  
  /**
   * Irritable Bowel Syndrome
   */
  'ibs': [
    'dicyclomine',            // Bentyl - antispasmodic
    'hyoscyamine',            // Levsin
    'linaclotide',            // Linzess - IBS-C
    'lubiprostone',           // Amitiza - IBS-C
    'rifaximin',              // Xifaxan - IBS-D
    'alosetron',              // Lotronex - IBS-D severe
  ],
  
  // Full name alias
  'irritable bowel': [
    'dicyclomine',
    'hyoscyamine',
    'loperamide',
    'rifaximin',
    'lubiprostone',
    'linaclotide',
    'amitriptyline',
  ],
  
  /**
   * Nausea/Vomiting
   */
  'nausea': [
    'ondansetron',
    'promethazine',
    'metoclopramide',
    'prochlorperazine',
    'granisetron',
    'scopolamine',
    'dronabinol',
  ],
  
  'vomiting': [
    'ondansetron',
    'promethazine',
    'metoclopramide',
    'prochlorperazine',
  ],
  
  /**
   * Constipation
   */
  'constipation': [
    'polyethylene glycol',
    'lactulose',
    'bisacodyl',
    'senna',
    'docusate',
    'linaclotide',
    'lubiprostone',
    'prucalopride',
  ],
  
  /**
   * Diarrhea
   */
  'diarrhea': [
    'loperamide',
    'diphenoxylate',
    'bismuth subsalicylate',
    'rifaximin',
  ],
  
  // =========================================================================
  // Pain & Inflammation
  // =========================================================================
  
  /**
   * Pain (General)
   * - NSAIDs for inflammatory pain
   * - Acetaminophen for mild pain
   * - Opioids for severe pain (with caution)
   */
  'pain': [
    'ibuprofen',              // Advil, Motrin - NSAID
    'naproxen',               // Aleve - NSAID
    'acetaminophen',          // Tylenol
    'celecoxib',              // Celebrex - COX-2
    'meloxicam',              // Mobic - NSAID
    'gabapentin',             // For neuropathic pain
    'pregabalin',             // Lyrica - neuropathic
    'tramadol',               // Weak opioid
  ],
  
  /**
   * Back Pain - M54.x
   */
  'back pain': [
    'ibuprofen',
    'naproxen',
    'acetaminophen',
    'cyclobenzaprine',
    'methocarbamol',
    'meloxicam',
    'diclofenac',
    'gabapentin',
    'duloxetine',
    'prednisone',
  ],
  
  'low back pain': [
    'ibuprofen',
    'naproxen',
    'acetaminophen',
    'cyclobenzaprine',
    'meloxicam',
  ],
  
  'lumbar': [
    'ibuprofen',
    'naproxen',
    'acetaminophen',
    'cyclobenzaprine',
    'gabapentin',
  ],
  
  /**
   * Headache
   */
  'headache': [
    'acetaminophen',
    'ibuprofen',
    'naproxen',
    'sumatriptan',
    'aspirin',
  ],
  
  /**
   * Neuropathy - G62.x
   */
  'neuropathy': [
    'gabapentin',
    'pregabalin',
    'duloxetine',
    'amitriptyline',
    'nortriptyline',
    'capsaicin',
    'lidocaine',
    'carbamazepine',
    'venlafaxine',
  ],
  
  'diabetic neuropathy': [
    'gabapentin',
    'pregabalin',
    'duloxetine',
    'amitriptyline',
    'capsaicin',
  ],
  
  /**
   * Osteoarthritis
   */
  'osteoarthritis': [
    'acetaminophen',
    'ibuprofen',
    'naproxen',
    'meloxicam',
    'diclofenac',
    'celecoxib',
    'tramadol',
    'duloxetine',
  ],
  
  /**
   * Rheumatoid Arthritis
   */
  'rheumatoid arthritis': [
    'methotrexate',
    'hydroxychloroquine',
    'sulfasalazine',
    'leflunomide',
    'adalimumab',
    'etanercept',
    'infliximab',
    'prednisone',
    'tofacitinib',
  ],
  
  'rheumatoid': [
    'methotrexate',
    'hydroxychloroquine',
    'sulfasalazine',
    'adalimumab',
    'etanercept',
    'prednisone',
  ],
  
  /**
   * Arthritis (General)
   */
  'arthritis': [
    'ibuprofen',
    'naproxen',
    'meloxicam',
    'celecoxib',
    'methotrexate',           // For RA
    'adalimumab',             // Humira - biologic
    'etanercept',             // Enbrel - biologic
    'prednisone',             // Short-term flares
  ],
  
  /**
   * Psoriasis & Psoriatic Arthritis
   * - Biologics (TNF/IL-17/IL-23 inhibitors) are most effective for moderate-severe
   * - Methotrexate and cyclosporine for traditional systemic treatment
   * - JAK inhibitors and PDE4 inhibitors are newer oral options
   * - Topicals for mild cases (not included here - focus on systemic)
   */
  'psoriasis': [
    'adalimumab',             // Humira - TNF inhibitor
    'etanercept',             // Enbrel - TNF inhibitor
    'ustekinumab',            // Stelara - IL-12/23 inhibitor
    'secukinumab',            // Cosentyx - IL-17 inhibitor
    'ixekizumab',             // Taltz - IL-17 inhibitor
    'guselkumab',             // Tremfya - IL-23 inhibitor
    'risankizumab',           // Skyrizi - IL-23 inhibitor
    'methotrexate',           // Traditional systemic DMARD
    'cyclosporine',           // Traditional systemic immunosuppressant
    'apremilast',             // Otezla - PDE4 inhibitor (oral)
    'deucravacitinib',        // Sotyktu - TYK2 inhibitor (oral)
    'upadacitinib',           // Rinvoq - JAK inhibitor (oral)
  ],
  
  /**
   * Migraine
   */
  'migraine': [
    'sumatriptan',            // Imitrex - triptan
    'rizatriptan',            // Maxalt - triptan
    'topiramate',             // Topamax - prevention
    'propranolol',            // Prevention
    'erenumab',               // Aimovig - CGRP antibody
    'fremanezumab',           // Ajovy - CGRP antibody
    'ubrogepant',             // Ubrelvy - gepant
  ],
  
  // =========================================================================
  // Allergies & Immune
  // =========================================================================
  
  /**
   * Allergies / Allergic Rhinitis
   */
  'allergy': [
    'cetirizine',             // Zyrtec - antihistamine
    'loratadine',             // Claritin - antihistamine
    'fexofenadine',           // Allegra - antihistamine
    'fluticasone nasal',      // Flonase - nasal steroid
    'montelukast',            // Singulair
    'diphenhydramine',        // Benadryl - sedating
  ],
  
  // Alias
  'allergic': [
    'cetirizine',
    'loratadine',
    'fexofenadine',
    'fluticasone nasal',
    'montelukast',
  ],
  
  // =========================================================================
  // Infections
  // =========================================================================
  
  /**
   * Bacterial Infections (General)
   */
  'infection': [
    'amoxicillin',            // Penicillin
    'azithromycin',           // Z-pack
    'ciprofloxacin',          // Fluoroquinolone
    'doxycycline',            // Tetracycline
    'cephalexin',             // Cephalosporin
    'sulfamethoxazole/trimethoprim', // Bactrim
  ],
  
  /**
   * Urinary Tract Infections
   */
  'urinary': [
    'nitrofurantoin',         // Macrobid
    'sulfamethoxazole/trimethoprim',
    'ciprofloxacin',
    'fosfomycin',             // Single dose
  ],
  
  // Full name alias
  'urinary tract infection': [
    'nitrofurantoin',
    'trimethoprim',
    'sulfamethoxazole',
    'ciprofloxacin',
    'levofloxacin',
    'cephalexin',
    'amoxicillin',
    'fosfomycin',
  ],
  
  'uti': [
    'nitrofurantoin',
    'trimethoprim',
    'sulfamethoxazole',
    'ciprofloxacin',
    'cephalexin',
  ],
  
  'cystitis': [
    'nitrofurantoin',
    'trimethoprim',
    'sulfamethoxazole',
    'ciprofloxacin',
    'fosfomycin',
  ],
  
  'pyelonephritis': [
    'ciprofloxacin',
    'levofloxacin',
    'ceftriaxone',
    'trimethoprim',
    'sulfamethoxazole',
  ],
  
  /**
   * Cellulitis - L03.x
   */
  'cellulitis': [
    'cephalexin',
    'dicloxacillin',
    'clindamycin',
    'trimethoprim',
    'sulfamethoxazole',
    'amoxicillin',
    'doxycycline',
    'vancomycin',
  ],
  
  /**
   * Sepsis - A41.x
   */
  'sepsis': [
    'vancomycin',
    'piperacillin',
    'tazobactam',
    'meropenem',
    'ceftriaxone',
    'norepinephrine',
    'vasopressin',
    'hydrocortisone',
    'cefepime',
  ],
  
  'septic shock': [
    'norepinephrine',
    'vasopressin',
    'vancomycin',
    'piperacillin',
    'meropenem',
    'hydrocortisone',
    'epinephrine',
  ],
  
  /**
   * COVID-19 - U07.1
   */
  'covid': [
    'paxlovid',
    'nirmatrelvir',
    'ritonavir',
    'remdesivir',
    'dexamethasone',
    'baricitinib',
    'tocilizumab',
    'molnupiravir',
    'enoxaparin',
  ],
  
  'coronavirus': [
    'paxlovid',
    'remdesivir',
    'dexamethasone',
    'baricitinib',
    'tocilizumab',
  ],
  
  // =========================================================================
  // Other Common Conditions
  // =========================================================================
  
  /**
   * Osteoporosis
   */
  'osteoporosis': [
    'alendronate',            // Fosamax - bisphosphonate
    'risedronate',            // Actonel
    'ibandronate',            // Boniva
    'denosumab',              // Prolia - monoclonal antibody
    'teriparatide',           // Forteo - PTH analog
    'raloxifene',             // Evista - SERM
  ],
  
  /**
   * Erectile Dysfunction
   */
  'erectile': [
    'sildenafil',             // Viagra - PDE5
    'tadalafil',              // Cialis - PDE5
    'vardenafil',             // Levitra - PDE5
    'avanafil',               // Stendra - PDE5
  ],
  
  /**
   * Gout
   */
  'gout': [
    'allopurinol',            // Xanthine oxidase inhibitor
    'febuxostat',             // Uloric
    'colchicine',             // For acute attacks
    'probenecid',             // Uricosuric
  ],
  
  /**
   * Seizures / Epilepsy
   */
  'epilepsy': [
    'levetiracetam',          // Keppra
    'lamotrigine',            // Lamictal
    'valproate',              // Depakote
    'carbamazepine',          // Tegretol
    'phenytoin',              // Dilantin
    'topiramate',             // Topamax
  ],
  
  'seizure': [
    'levetiracetam',
    'lamotrigine',
    'valproate',
    'carbamazepine',
    'lorazepam',
    'diazepam',
    'phenytoin',
  ],
  
  // =========================================================================
  // Neurological Conditions
  // =========================================================================
  
  /**
   * Parkinson's Disease - G20
   */
  'parkinson': [
    'levodopa',
    'carbidopa',
    'pramipexole',
    'ropinirole',
    'rasagiline',
    'selegiline',
    'entacapone',
    'amantadine',
    'trihexyphenidyl',
    'apomorphine',
  ],
  
  /**
   * Alzheimer's Disease - G30.x
   */
  'alzheimer': [
    'donepezil',
    'rivastigmine',
    'galantamine',
    'memantine',
    'aducanumab',
    'lecanemab',
  ],
  
  'dementia': [
    'donepezil',
    'rivastigmine',
    'galantamine',
    'memantine',
  ],
  
  /**
   * Stroke - I63.x
   */
  'stroke': [
    'alteplase',
    'aspirin',
    'clopidogrel',
    'warfarin',
    'apixaban',
    'rivaroxaban',
    'atorvastatin',
    'lisinopril',
    'amlodipine',
  ],
  
  'cerebrovascular': [
    'aspirin',
    'clopidogrel',
    'warfarin',
    'apixaban',
    'atorvastatin',
  ],
  
  /**
   * Multiple Sclerosis - G35
   */
  'multiple sclerosis': [
    'interferon beta',
    'glatiramer',
    'dimethyl fumarate',
    'fingolimod',
    'natalizumab',
    'ocrelizumab',
    'teriflunomide',
    'siponimod',
    'cladribine',
  ],
  
  // =========================================================================
  // Additional Psychiatric Conditions
  // =========================================================================
  
  // Alias for depression
  'major depressive': [
    'sertraline',
    'fluoxetine',
    'escitalopram',
    'venlafaxine',
    'duloxetine',
    'bupropion',
  ],
  
  // Anxiety aliases
  'generalized anxiety': [
    'sertraline',
    'escitalopram',
    'venlafaxine',
    'duloxetine',
    'buspirone',
  ],
  
  'panic': [
    'sertraline',
    'paroxetine',
    'venlafaxine',
    'alprazolam',
    'clonazepam',
  ],
  
  /**
   * Schizophrenia - F20.x
   */
  'schizophrenia': [
    'risperidone',
    'olanzapine',
    'quetiapine',
    'aripiprazole',
    'ziprasidone',
    'paliperidone',
    'clozapine',
    'haloperidol',
    'lurasidone',
  ],
  
  'psychosis': [
    'risperidone',
    'olanzapine',
    'quetiapine',
    'aripiprazole',
    'haloperidol',
  ],
  
  // ADHD alias
  'attention deficit': [
    'methylphenidate',
    'amphetamine',
    'lisdexamfetamine',
    'atomoxetine',
    'guanfacine',
  ],
  
  // Insomnia alias
  'sleep disorder': [
    'zolpidem',
    'eszopiclone',
    'trazodone',
    'melatonin',
    'suvorexant',
  ],
  
  // =========================================================================
  // Endocrine Conditions
  // =========================================================================
  
  /**
   * Hypothyroidism - E03.x
   */
  'hypothyroidism': [
    'levothyroxine',
    'liothyronine',
  ],
  
  'thyroid': [
    'levothyroxine',
    'liothyronine',
    'methimazole',
    'propylthiouracil',
  ],
  
  'hyperthyroidism': [
    'methimazole',
    'propylthiouracil',
    'propranolol',
    'atenolol',
  ],
  
  // =========================================================================
  // Dermatological Conditions
  // =========================================================================
  
  /**
   * Eczema / Atopic Dermatitis - L20.x
   */
  'eczema': [
    'hydrocortisone',
    'triamcinolone',
    'tacrolimus',
    'pimecrolimus',
    'dupilumab',
    'crisaborole',
    'hydroxyzine',
    'cetirizine',
  ],
  
  'dermatitis': [
    'hydrocortisone',
    'triamcinolone',
    'tacrolimus',
    'pimecrolimus',
    'dupilumab',
  ],
  
  'atopic dermatitis': [
    'tacrolimus',
    'pimecrolimus',
    'dupilumab',
    'crisaborole',
    'triamcinolone',
  ],
  
  /**
   * Acne - L70.x
   */
  'acne': [
    'benzoyl peroxide',
    'tretinoin',
    'adapalene',
    'clindamycin',
    'doxycycline',
    'isotretinoin',
    'spironolactone',
    'azelaic acid',
  ],
  
  // =========================================================================
  // Hematological / Other Conditions
  // =========================================================================
  
  /**
   * Anemia - D50.x, D64.x
   */
  'anemia': [
    'ferrous sulfate',
    'iron sucrose',
    'ferric carboxymaltose',
    'vitamin b12',
    'cyanocobalamin',
    'folic acid',
    'epoetin alfa',
    'darbepoetin',
  ],
  
  'iron deficiency': [
    'ferrous sulfate',
    'ferrous gluconate',
    'iron sucrose',
    'ferric carboxymaltose',
  ],
  
  /**
   * Allergic Rhinitis
   */
  'allergic rhinitis': [
    'cetirizine',
    'loratadine',
    'fexofenadine',
    'fluticasone',
    'mometasone',
    'azelastine',
    'montelukast',
    'diphenhydramine',
  ],
  
  /**
   * Anaphylaxis
   */
  'anaphylaxis': [
    'epinephrine',
    'diphenhydramine',
    'methylprednisolone',
    'famotidine',
  ],
  
  // Obesity alias
  'weight loss': [
    'semaglutide',
    'liraglutide',
    'tirzepatide',
    'phentermine',
    'orlistat',
  ],
  
  /**
   * DVT / PE - Thromboembolic conditions
   */
  'deep vein thrombosis': [
    'enoxaparin',
    'heparin',
    'warfarin',
    'rivaroxaban',
    'apixaban',
    'edoxaban',
  ],
  
  'dvt': [
    'enoxaparin',
    'heparin',
    'warfarin',
    'rivaroxaban',
    'apixaban',
  ],
  
  'pulmonary embolism': [
    'enoxaparin',
    'heparin',
    'warfarin',
    'rivaroxaban',
    'apixaban',
    'alteplase',
  ],
  
  'thrombosis': [
    'enoxaparin',
    'heparin',
    'warfarin',
    'rivaroxaban',
    'apixaban',
  ],
  
  'embolism': [
    'enoxaparin',
    'heparin',
    'warfarin',
    'rivaroxaban',
    'apixaban',
  ],
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Gets the list of drugs associated with a medical condition.
 * 
 * Uses 3-tier lookup system:
 * - Tier 1: Curated mappings (fast, accurate)
 * - Tier 2: Fallback cache (AI-generated, cached for 24hr)
 * - Tier 3: AI generation (on-demand via Claude Haiku)
 * 
 * @param conditionName - The medical condition name (e.g., "Obesity, unspecified")
 * @returns Promise resolving to array of drug names, or empty array if no match
 * 
 * @example
 * const drugs = await getDrugsForCondition("Type 2 diabetes mellitus");
 * // Returns: ["metformin", "semaglutide", "empagliflozin", ...]
 * 
 * @example
 * const drugs = await getDrugsForCondition("Rare condition XYZ");
 * // First time: Generates with AI (~3 sec)
 * // Subsequent times: Returns from cache (~0 sec)
 */
export async function getDrugsForCondition(conditionName: string): Promise<string[]> {
  // Input validation
  if (!conditionName || conditionName.trim().length === 0) {
    console.warn('[DrugMappings] Empty condition name provided');
    return [];
  }

  const logPrefix = `[DrugMappings:${conditionName.slice(0, 30)}]`;
  const normalized = conditionName.toLowerCase().trim();
  const cacheKey = normalizeCacheKey(conditionName);

  // Track telemetry
  maybeLogTelemetry();

  // =========================================================================
  // Tier 1: Check curated mappings (fastest)
  // =========================================================================
  for (const [key, drugs] of Object.entries(CONDITION_DRUG_MAPPINGS)) {
    if (normalized.includes(key)) {
      console.log(`${logPrefix} ✅ CURATED HIT: "${key}" → ${drugs.length} drugs`);
      curatedHits++;
      return drugs;
    }
  }

  // =========================================================================
  // Tier 2: Check fallback cache (fast)
  // =========================================================================
  const cachedDrugs = getFallbackCached(cacheKey);
  if (cachedDrugs) {
    console.log(`${logPrefix} ✅ FALLBACK CACHE HIT: ${cachedDrugs.length} drugs (cached)`);
    fallbackCacheHits++;
    return cachedDrugs;
  }

  // =========================================================================
  // Tier 3: AI Generation (slow, ~3 seconds)
  // =========================================================================
  
  // Check if generation already in progress for this condition
  const inFlight = inFlightRequests.get(cacheKey);
  if (inFlight) {
    console.log(`${logPrefix} ⏳ Waiting for in-flight AI generation...`);
    try {
      const drugs = await inFlight;
      console.log(`${logPrefix} ✅ In-flight request completed: ${drugs.length} drugs`);
      return drugs;
    } catch (error) {
      console.error(`${logPrefix} In-flight request failed:`, error);
      return [];
    }
  }

  // Start new AI generation
  console.log(`${logPrefix} 🤖 AI GENERATION: No curated mapping or cache, generating with AI...`);
  console.log(`${logPrefix} 📊 Condition will be tracked for potential curated promotion`);
  
  const generationPromise = (async () => {
    try {
      aiGenerations++;
      
      const result = await generateDrugListWithAI(conditionName);
      
      if (!result.success) {
        console.warn(`${logPrefix} AI generation failed: ${result.error}`);
        return [];
      }

      if (result.drugs.length === 0) {
        console.warn(`${logPrefix} AI returned empty drug list (not caching)`);
        return [];
      }

      // Cache successful non-empty results
      setFallbackCache(cacheKey, result.drugs, conditionName);
      
      console.log(`${logPrefix} ✅ AI generated ${result.drugs.length} drugs successfully`);
      
      return result.drugs;

    } catch (error) {
      console.error(`${logPrefix} AI generation error:`, error);
      return [];
    } finally {
      // Remove from in-flight tracking
      inFlightRequests.delete(cacheKey);
    }
  })();

  // Track in-flight request
  inFlightRequests.set(cacheKey, generationPromise);

  return generationPromise;
}

/**
 * Gets all available condition categories.
 * 
 * @returns Array of condition keywords that have drug mappings
 */
export function getAvailableConditions(): string[] {
  return Object.keys(CONDITION_DRUG_MAPPINGS);
}

/**
 * Gets the total number of unique drugs across all mappings.
 * 
 * @returns Number of unique drug names
 */
export function getTotalDrugCount(): number {
  const allDrugs = new Set<string>();
  
  for (const drugs of Object.values(CONDITION_DRUG_MAPPINGS)) {
    drugs.forEach(drug => allDrugs.add(drug));
  }
  
  return allDrugs.size;
}
