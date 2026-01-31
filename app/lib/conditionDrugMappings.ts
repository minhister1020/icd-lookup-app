/**
 * Condition-Drug Mappings Database
 * =================================
 * 
 * This file maintains curated mappings of medical conditions to known drug names.
 * These mappings are used to find relevant drugs for ICD-10 conditions.
 * 
 * Strategy:
 * 1. User searches for a condition (e.g., "Obesity, unspecified")
 * 2. We match the condition to known drug names using this database
 * 3. RxNorm API fetches detailed drug information (brand names, dosages)
 * 4. Claude AI validates and scores each drug for clinical relevance
 * 
 * Why this approach?
 * - OpenFDA's drug label API has incomplete data (missing brand/generic names)
 * - RxClass indication database is outdated (missing GLP-1 drugs for obesity)
 * - This curated approach ensures we include modern, relevant drugs
 * - Claude AI provides the clinical validation layer
 * 
 * Maintenance:
 * - Add new drugs when FDA approves them for conditions
 * - Order drugs by clinical preference (most commonly prescribed first)
 * - Use generic names (RxNorm will find brand names)
 */

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
   * Arthritis
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
    'phenytoin',
  ],
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Gets the list of drugs associated with a medical condition.
 * 
 * Uses flexible matching - if the condition name contains any mapping key,
 * returns the corresponding drug list.
 * 
 * @param conditionName - The medical condition name (e.g., "Obesity, unspecified")
 * @returns Array of drug names, or empty array if no match
 * 
 * @example
 * getDrugsForCondition("Type 2 diabetes mellitus")
 * // Returns: ["metformin", "semaglutide", "empagliflozin", ...]
 * 
 * @example
 * getDrugsForCondition("Unknown condition XYZ")
 * // Returns: []
 */
export function getDrugsForCondition(conditionName: string): string[] {
  const normalized = conditionName.toLowerCase().trim();
  
  // Check if condition name contains any mapping key
  for (const [key, drugs] of Object.entries(CONDITION_DRUG_MAPPINGS)) {
    if (normalized.includes(key)) {
      console.log(`[DrugMappings] Matched condition: "${key}" → ${drugs.length} drugs`);
      return drugs;
    }
  }
  
  console.log(`[DrugMappings] No match found for: "${conditionName}"`);
  return [];
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
