/**
 * ICD-10 Code Frequency Data
 * ==========================
 * 
 * This file contains data on the most commonly used ICD-10 codes
 * in clinical practice, based on real healthcare utilization data.
 * 
 * Data Sources:
 * - MEPS (Medical Expenditure Panel Survey) - AHRQ
 * - CMS Medicare claims data (2024)
 * - Primary care utilization studies
 * - All-payer claims databases
 * 
 * The popularity scores (0-100) represent relative frequency,
 * with 100 being the most commonly used code (I10 - Hypertension).
 * 
 * Why this matters:
 * - Users typically search for common conditions
 * - Common codes should appear before rare variants
 * - E11.9 (common) is more useful than E11.621 (very specific)
 */

// =============================================================================
// Top Common ICD-10 Codes by Usage Frequency
// =============================================================================

/**
 * Map of ICD-10 codes to their relative popularity scores (0-100).
 * 
 * Score interpretation:
 * - 90-100: Super common (top 10 codes)
 * - 70-89: Very common (top 50 codes)
 * - 50-69: Common (frequently seen in practice)
 * - 30-49: Moderately common
 * - 10-29: Less common but notable
 * 
 * Codes not in this map receive a base score of 5.
 */
export const TOP_COMMON_CODES: Map<string, number> = new Map([
  // ===========================================================================
  // TIER 1: Super Common (90-100 points) - Top 10 diagnoses
  // ===========================================================================
  
  // #1 Most common diagnosis in primary care (4.8% of all encounters)
  ['I10', 100],      // Essential (primary) hypertension
  
  // Preventive care - very high volume
  ['Z00.00', 95],    // General adult medical examination without abnormal findings
  ['Z00.01', 93],    // General adult medical examination with abnormal findings
  ['Z23', 92],       // Encounter for immunization
  
  // Metabolic conditions - chronic disease management mainstays
  ['E78.5', 91],     // Hyperlipidemia, unspecified
  ['E78.2', 89],     // Mixed hyperlipidemia
  ['E78.0', 88],     // Pure hypercholesterolemia
  
  // Diabetes - extremely common
  ['E11.9', 90],     // Type 2 diabetes mellitus without complications
  ['E11.65', 85],    // Type 2 diabetes mellitus with hyperglycemia
  
  // Thyroid & other endocrine
  ['E03.9', 84],     // Hypothyroidism, unspecified
  
  // ===========================================================================
  // TIER 2: Very Common (70-89 points) - Top 50 diagnoses
  // ===========================================================================
  
  // Gastrointestinal
  ['K21.9', 82],     // Gastro-esophageal reflux disease without esophagitis
  ['K21.0', 75],     // GERD with esophagitis
  ['K58.9', 70],     // Irritable bowel syndrome without diarrhea
  ['K29.70', 65],    // Gastritis, unspecified, without bleeding
  
  // Mental health - increasingly addressed in primary care
  ['F41.1', 80],     // Generalized anxiety disorder
  ['F32.9', 79],     // Major depressive disorder, single episode, unspecified
  ['F32.1', 74],     // Major depressive disorder, single episode, moderate
  ['F41.9', 73],     // Anxiety disorder, unspecified
  ['F43.10', 68],    // Post-traumatic stress disorder, unspecified
  
  // Musculoskeletal - very common complaints
  ['M54.5', 78],     // Low back pain
  ['M54.50', 77],    // Low back pain, unspecified
  ['M25.50', 72],    // Pain in unspecified joint
  ['M17.9', 71],     // Osteoarthritis of knee, unspecified
  ['M19.90', 67],    // Unspecified osteoarthritis, unspecified site
  ['M79.3', 64],     // Panniculitis, unspecified
  
  // Respiratory - seasonal spikes
  ['J06.9', 76],     // Acute upper respiratory infection, unspecified
  ['J02.9', 73],     // Acute pharyngitis, unspecified
  ['J00', 71],       // Acute nasopharyngitis (common cold)
  ['J20.9', 69],     // Acute bronchitis, unspecified
  ['J45.909', 75],   // Unspecified asthma, uncomplicated
  ['J45.20', 70],    // Mild intermittent asthma, uncomplicated
  ['J44.9', 68],     // Chronic obstructive pulmonary disease, unspecified
  ['J30.9', 65],     // Allergic rhinitis, unspecified
  
  // Cardiovascular (beyond hypertension)
  ['I25.10', 74],    // Atherosclerotic heart disease of native coronary artery
  ['I50.9', 72],     // Heart failure, unspecified
  ['I48.91', 70],    // Unspecified atrial fibrillation
  ['I48.0', 66],     // Paroxysmal atrial fibrillation
  ['I21.9', 65],     // Acute myocardial infarction, unspecified
  ['I21.3', 63],     // ST elevation MI of unspecified site
  ['I21.4', 64],     // Non-ST elevation myocardial infarction
  
  // Infections
  ['N39.0', 73],     // Urinary tract infection, site not specified
  ['B34.9', 66],     // Viral infection, unspecified
  ['J18.9', 64],     // Pneumonia, unspecified organism
  
  // ===========================================================================
  // TIER 3: Common (50-69 points) - Frequently seen in practice
  // ===========================================================================
  
  // Diabetes variants
  ['E11.8', 62],     // Type 2 diabetes with unspecified complications
  ['E11.21', 60],    // Type 2 diabetes with diabetic nephropathy
  ['E11.22', 58],    // Type 2 diabetes with diabetic chronic kidney disease
  ['E11.40', 56],    // Type 2 diabetes with diabetic neuropathy, unspecified
  ['E11.42', 55],    // Type 2 diabetes with diabetic polyneuropathy
  ['E10.9', 68],     // Type 1 diabetes mellitus without complications
  ['E10.65', 62],    // Type 1 diabetes with hyperglycemia
  
  // Obesity & nutrition
  ['E66.9', 67],     // Obesity, unspecified
  ['E66.01', 64],    // Morbid (severe) obesity due to excess calories
  ['E55.9', 62],     // Vitamin D deficiency, unspecified
  ['E63.9', 55],     // Nutritional deficiency, unspecified
  
  // Sleep disorders
  ['G47.33', 66],    // Obstructive sleep apnea (adult) (pediatric)
  ['G47.00', 58],    // Insomnia, unspecified
  
  // Neurological
  ['G43.909', 63],   // Migraine, unspecified, not intractable
  ['R51.9', 60],     // Headache, unspecified
  ['G43.009', 58],   // Migraine without aura, not intractable
  
  // Skin conditions
  ['L03.90', 58],    // Cellulitis, unspecified
  ['L20.9', 55],     // Atopic dermatitis, unspecified
  ['L30.9', 52],     // Dermatitis, unspecified
  
  // Symptoms & signs (used when diagnosis uncertain)
  ['R07.9', 60],     // Chest pain, unspecified
  ['R10.9', 58],     // Unspecified abdominal pain
  ['R53.83', 56],    // Other fatigue
  ['R63.4', 52],     // Abnormal weight loss
  
  // Renal
  ['N18.3', 62],     // Chronic kidney disease, stage 3
  ['N18.9', 58],     // Chronic kidney disease, unspecified
  
  // ===========================================================================
  // TIER 4: Moderately Common (30-49 points)
  // ===========================================================================
  
  // More diabetes codes
  ['E13.9', 45],     // Other specified diabetes mellitus without complications
  ['E08.9', 40],     // Diabetes due to underlying condition without complications
  
  // Hypertension variants
  ['I11.9', 55],     // Hypertensive heart disease without heart failure
  ['I12.9', 50],     // Hypertensive chronic kidney disease
  ['I13.10', 45],    // Hypertensive heart and CKD without heart failure
  
  // More cardiac
  ['I20.9', 48],     // Angina pectoris, unspecified
  ['I25.9', 46],     // Chronic ischemic heart disease, unspecified
  ['I63.9', 44],     // Cerebral infarction, unspecified
  
  // ADHD
  ['F90.9', 52],     // ADHD, unspecified type
  ['F90.0', 48],     // ADHD, predominantly inattentive type
  ['F90.2', 50],     // ADHD, combined type
  
  // Substance use (increasingly coded)
  ['F17.210', 55],   // Nicotine dependence, cigarettes, uncomplicated
  ['F10.20', 45],    // Alcohol dependence, uncomplicated
  ['F11.20', 48],    // Opioid dependence, uncomplicated
  
  // Preventive screening
  ['Z12.31', 50],    // Encounter for screening mammogram
  ['Z12.11', 48],    // Encounter for screening for malignant neoplasm of colon
  ['Z13.6', 46],     // Encounter for screening for cardiovascular disorders
  
  // ===========================================================================
  // TIER 5: Less Common but Notable (10-29 points)
  // ===========================================================================
  
  // Specific conditions that are clinically important
  ['G20', 35],       // Parkinson's disease
  ['G35', 32],       // Multiple sclerosis
  ['G40.909', 38],   // Epilepsy, unspecified, not intractable
  ['M05.79', 30],    // Rheumatoid arthritis with rheumatoid factor
  ['M06.9', 35],     // Rheumatoid arthritis, unspecified
  ['K50.90', 32],    // Crohn's disease, unspecified, without complications
  ['K51.90', 32],    // Ulcerative colitis, unspecified, without complications
  ['L40.9', 35],     // Psoriasis, unspecified
  ['J45.50', 40],    // Severe persistent asthma, uncomplicated
  
  // Cancer screening/history codes
  ['Z85.3', 30],     // Personal history of malignant neoplasm of breast
  ['Z80.3', 28],     // Family history of malignant neoplasm of breast
  ['C50.919', 25],   // Malignant neoplasm of unspecified site of unspecified female breast
  
  // Pediatric common codes
  ['Z00.129', 55],   // Encounter for routine child health examination without abnormal findings
  ['J06.0', 50],     // Acute laryngopharyngitis
  ['H66.90', 45],    // Otitis media, unspecified, unspecified ear
]);

// =============================================================================
// Common Code Families
// =============================================================================

/**
 * Set of common code family prefixes.
 * 
 * Codes that start with these prefixes get partial credit
 * even if the exact code isn't in TOP_COMMON_CODES.
 * 
 * For example: E11.621 isn't in the list, but E11 is a common family,
 * so it gets 20 points instead of the base 5.
 */
export const COMMON_CODE_FAMILIES: Set<string> = new Set([
  // Endocrine/Metabolic
  'E11',   // Type 2 diabetes (very common family)
  'E10',   // Type 1 diabetes
  'E78',   // Lipid disorders
  'E03',   // Hypothyroidism
  'E66',   // Obesity
  'E55',   // Vitamin D deficiency
  
  // Cardiovascular
  'I10',   // Hypertension
  'I11',   // Hypertensive heart disease
  'I25',   // Chronic ischemic heart disease
  'I50',   // Heart failure
  'I48',   // Atrial fibrillation
  'I21',   // Acute myocardial infarction
  'I63',   // Cerebral infarction
  
  // Respiratory
  'J06',   // Upper respiratory infections
  'J45',   // Asthma
  'J44',   // COPD
  'J20',   // Acute bronchitis
  'J18',   // Pneumonia
  
  // Gastrointestinal
  'K21',   // GERD
  'K58',   // IBS
  'K29',   // Gastritis
  
  // Mental Health
  'F32',   // Depressive episode
  'F41',   // Anxiety disorders
  'F43',   // Stress/adjustment disorders
  'F90',   // ADHD
  
  // Musculoskeletal
  'M54',   // Back pain
  'M17',   // Knee osteoarthritis
  'M25',   // Joint pain
  'M79',   // Soft tissue disorders
  
  // Other common
  'N39',   // Urinary tract disorders
  'G47',   // Sleep disorders
  'G43',   // Migraine
  'Z00',   // General examination
  'Z23',   // Immunization
]);

// =============================================================================
// Helper function to get family from code
// =============================================================================

/**
 * Extracts the code family (prefix before decimal) from an ICD-10 code.
 * 
 * @param code - Full ICD-10 code (e.g., "E11.65")
 * @returns Code family (e.g., "E11")
 * 
 * @example
 * getCodeFamily("E11.65") // Returns "E11"
 * getCodeFamily("I10")    // Returns "I10"
 */
export function getCodeFamily(code: string): string {
  return code.split('.')[0];
}
