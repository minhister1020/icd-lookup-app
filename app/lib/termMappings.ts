/**
 * Common Terms to Medical Terminology Mappings
 * =============================================
 * 
 * This file contains curated mappings from everyday/lay terms to their
 * proper medical terminology equivalents. This enables users to search
 * using familiar language while still getting accurate ICD-10 results.
 * 
 * Example: User searches "heart attack" → We search "myocardial infarction"
 * 
 * Data Sources:
 * - CDC health topics (https://www.cdc.gov/)
 * - NIH MedlinePlus (https://medlineplus.gov/)
 * - Mayo Clinic patient education
 * - Common patient terminology studies
 * 
 * Quality Standards:
 * - Each mapping is clinically accurate
 * - Primary medical term is the most commonly used in ICD-10
 * - ICD hints help with relevance scoring
 * - Alternatives provide additional search options
 */

// =============================================================================
// Type Definition
// =============================================================================

/**
 * Represents a single term mapping entry.
 * 
 * @example
 * {
 *   medical: "myocardial infarction",
 *   alternatives: ["acute coronary syndrome", "MI"],
 *   icdHint: "I21"
 * }
 */
export interface TermMapping {
  /** Primary medical term to search (most specific) */
  medical: string;
  
  /** Alternative medical terms (used if primary returns few results) */
  alternatives?: string[];
  
  /** ICD-10 code family hint (helps with relevance scoring) */
  icdHint?: string;
}

// =============================================================================
// Term Mappings by Category
// =============================================================================

/**
 * Master map of common lay terms to medical terminology.
 * 
 * Key: Lowercase lay term (what user might type)
 * Value: TermMapping object with medical equivalents
 * 
 * Using Map for O(1) lookup performance.
 * 
 * Total Mappings: 85+
 */
export const TERM_MAPPINGS: Map<string, TermMapping> = new Map([
  
  // ===========================================================================
  // CARDIOVASCULAR SYSTEM (18 mappings)
  // ===========================================================================
  
  // Heart Attack variants
  ['heart attack', { 
    medical: 'myocardial infarction',
    alternatives: ['acute coronary syndrome', 'MI'],
    icdHint: 'I21'
  }],
  ['mi', { 
    medical: 'myocardial infarction',
    icdHint: 'I21'
  }],
  ['cardiac arrest', { 
    medical: 'cardiac arrest',
    alternatives: ['heart stopped'],
    icdHint: 'I46'
  }],
  
  // Stroke variants
  ['stroke', { 
    medical: 'cerebral infarction',
    alternatives: ['cerebrovascular accident', 'CVA'],
    icdHint: 'I63'
  }],
  ['cva', { 
    medical: 'cerebrovascular accident',
    alternatives: ['cerebral infarction'],
    icdHint: 'I63'
  }],
  ['brain attack', { 
    medical: 'cerebral infarction',
    icdHint: 'I63'
  }],
  ['mini stroke', { 
    medical: 'transient ischemic attack',
    alternatives: ['TIA'],
    icdHint: 'G45'
  }],
  ['tia', { 
    medical: 'transient ischemic attack',
    icdHint: 'G45'
  }],
  
  // Blood Pressure
  ['high blood pressure', { 
    medical: 'hypertension',
    alternatives: ['essential hypertension'],
    icdHint: 'I10'
  }],
  ['hbp', { 
    medical: 'hypertension',
    icdHint: 'I10'
  }],
  ['low blood pressure', { 
    medical: 'hypotension',
    icdHint: 'I95'
  }],
  
  // Other Cardiovascular
  ['chest pain', { 
    medical: 'angina pectoris',
    alternatives: ['chest pain', 'precordial pain'],
    icdHint: 'I20'
  }],
  ['angina', { 
    medical: 'angina pectoris',
    icdHint: 'I20'
  }],
  ['irregular heartbeat', { 
    medical: 'atrial fibrillation',
    alternatives: ['cardiac arrhythmia', 'heart palpitations'],
    icdHint: 'I48'
  }],
  ['afib', { 
    medical: 'atrial fibrillation',
    icdHint: 'I48'
  }],
  ['heart palpitations', { 
    medical: 'palpitations',
    alternatives: ['cardiac arrhythmia'],
    icdHint: 'R00'
  }],
  ['heart failure', { 
    medical: 'heart failure',
    alternatives: ['congestive heart failure', 'CHF'],
    icdHint: 'I50'
  }],
  ['chf', { 
    medical: 'congestive heart failure',
    icdHint: 'I50'
  }],
  ['cad', { 
    medical: 'coronary artery disease',
    alternatives: ['ischemic heart disease', 'atherosclerotic heart disease'],
    icdHint: 'I25'
  }],
  ['htn', { 
    medical: 'hypertension',
    alternatives: ['high blood pressure'],
    icdHint: 'I10'
  }],
  ['dvt', { 
    medical: 'deep vein thrombosis',
    alternatives: ['deep venous thrombosis'],
    icdHint: 'I82'
  }],
  ['pe', { 
    medical: 'pulmonary embolism',
    icdHint: 'I26'
  }],
  ['pvd', { 
    medical: 'peripheral vascular disease',
    alternatives: ['peripheral artery disease', 'PAD'],
    icdHint: 'I73'
  }],
  ['high cholesterol', { 
    medical: 'hyperlipidemia',
    alternatives: ['hypercholesterolemia', 'dyslipidemia'],
    icdHint: 'E78'
  }],
  
  // ===========================================================================
  // RESPIRATORY SYSTEM (14 mappings)
  // ===========================================================================
  
  ['flu', { 
    medical: 'influenza',
    alternatives: ['seasonal influenza'],
    icdHint: 'J11'
  }],
  ['the flu', { 
    medical: 'influenza',
    icdHint: 'J11'
  }],
  ['cold', { 
    medical: 'acute nasopharyngitis',
    alternatives: ['upper respiratory infection', 'common cold'],
    icdHint: 'J00'
  }],
  ['common cold', { 
    medical: 'acute nasopharyngitis',
    icdHint: 'J00'
  }],
  ['runny nose', { 
    medical: 'rhinorrhea',
    alternatives: ['nasal discharge'],
    icdHint: 'R09'
  }],
  ['stuffy nose', { 
    medical: 'nasal congestion',
    alternatives: ['nasal obstruction'],
    icdHint: 'R09'
  }],
  ['sore throat', { 
    medical: 'pharyngitis',
    alternatives: ['acute pharyngitis'],
    icdHint: 'J02'
  }],
  ['strep throat', { 
    medical: 'streptococcal pharyngitis',
    icdHint: 'J02'
  }],
  ['bronchitis', { 
    medical: 'acute bronchitis',
    alternatives: ['bronchitis'],
    icdHint: 'J20'
  }],
  ['chest cold', { 
    medical: 'acute bronchitis',
    icdHint: 'J20'
  }],
  ['lung infection', { 
    medical: 'pneumonia',
    alternatives: ['pulmonary infection'],
    icdHint: 'J18'
  }],
  ['wheezing', { 
    medical: 'wheezing',
    alternatives: ['bronchospasm'],
    icdHint: 'R06'
  }],
  ['shortness of breath', { 
    medical: 'dyspnea',
    alternatives: ['breathlessness'],
    icdHint: 'R06'
  }],
  ['hay fever', { 
    medical: 'allergic rhinitis',
    alternatives: ['seasonal allergies'],
    icdHint: 'J30'
  }],
  ['allergies', { 
    medical: 'allergic rhinitis',
    alternatives: ['allergy'],
    icdHint: 'J30'
  }],
  ['copd', { 
    medical: 'chronic obstructive pulmonary disease',
    alternatives: ['COPD', 'emphysema'],
    icdHint: 'J44'
  }],
  ['emphysema', { 
    medical: 'pulmonary emphysema',
    alternatives: ['emphysema'],
    icdHint: 'J43'
  }],
  ['asthma', { 
    medical: 'asthma',
    alternatives: ['bronchial asthma'],
    icdHint: 'J45'
  }],
  
  // ===========================================================================
  // GASTROINTESTINAL SYSTEM (12 mappings)
  // ===========================================================================
  
  ['heartburn', { 
    medical: 'gastroesophageal reflux',
    alternatives: ['GERD', 'acid reflux'],
    icdHint: 'K21'
  }],
  ['acid reflux', { 
    medical: 'gastroesophageal reflux disease',
    alternatives: ['GERD'],
    icdHint: 'K21'
  }],
  ['gerd', { 
    medical: 'gastroesophageal reflux disease',
    icdHint: 'K21'
  }],
  ['stomach pain', { 
    medical: 'abdominal pain',
    alternatives: ['epigastric pain', 'gastralgia'],
    icdHint: 'R10'
  }],
  ['stomachache', { 
    medical: 'abdominal pain',
    icdHint: 'R10'
  }],
  ['belly pain', { 
    medical: 'abdominal pain',
    icdHint: 'R10'
  }],
  ['stomach ulcer', { 
    medical: 'peptic ulcer',
    alternatives: ['gastric ulcer'],
    icdHint: 'K25'
  }],
  ['ulcer', { 
    medical: 'peptic ulcer',
    alternatives: ['gastric ulcer', 'duodenal ulcer'],
    icdHint: 'K27'
  }],
  ['ibs', { 
    medical: 'irritable bowel syndrome',
    icdHint: 'K58'
  }],
  ['irritable bowel', { 
    medical: 'irritable bowel syndrome',
    icdHint: 'K58'
  }],
  ['food poisoning', { 
    medical: 'foodborne illness',
    alternatives: ['gastroenteritis'],
    icdHint: 'A05'
  }],
  ['stomach bug', { 
    medical: 'viral gastroenteritis',
    alternatives: ['gastroenteritis'],
    icdHint: 'A09'
  }],
  
  // ===========================================================================
  // MUSCULOSKELETAL SYSTEM (14 mappings)
  // ===========================================================================
  
  ['back pain', { 
    medical: 'low back pain',
    alternatives: ['dorsalgia', 'lumbago'],
    icdHint: 'M54'
  }],
  ['lower back pain', { 
    medical: 'low back pain',
    alternatives: ['lumbago'],
    icdHint: 'M54'
  }],
  ['lbp', { 
    medical: 'low back pain',
    icdHint: 'M54'
  }],
  ['slipped disc', { 
    medical: 'intervertebral disc disorder',
    alternatives: ['herniated disc', 'disc herniation'],
    icdHint: 'M51'
  }],
  ['herniated disc', { 
    medical: 'intervertebral disc displacement',
    icdHint: 'M51'
  }],
  ['sciatica', { 
    medical: 'sciatica',
    alternatives: ['sciatic nerve pain'],
    icdHint: 'M54'
  }],
  ['broken bone', { 
    medical: 'fracture',
    alternatives: ['bone fracture'],
    icdHint: 'S'  // General injury code
  }],
  ['fractured bone', { 
    medical: 'fracture',
    icdHint: 'S'
  }],
  ['sprain', { 
    medical: 'sprain',
    alternatives: ['ligament injury'],
    icdHint: 'S'
  }],
  ['pulled muscle', { 
    medical: 'muscle strain',
    alternatives: ['muscular strain'],
    icdHint: 'M62'
  }],
  ['arthritis', { 
    medical: 'arthritis',
    alternatives: ['osteoarthritis', 'joint inflammation'],
    icdHint: 'M19'
  }],
  ['joint pain', { 
    medical: 'arthralgia',
    alternatives: ['joint pain'],
    icdHint: 'M25'
  }],
  ['knee pain', { 
    medical: 'knee pain',
    alternatives: ['gonalgia'],
    icdHint: 'M25'
  }],
  ['stiff neck', { 
    medical: 'cervicalgia',
    alternatives: ['neck pain'],
    icdHint: 'M54'
  }],
  ['ra', { 
    medical: 'rheumatoid arthritis',
    alternatives: ['RA'],
    icdHint: 'M06'
  }],
  ['sle', { 
    medical: 'systemic lupus erythematosus',
    alternatives: ['lupus'],
    icdHint: 'M32'
  }],
  ['lupus', { 
    medical: 'systemic lupus erythematosus',
    alternatives: ['SLE'],
    icdHint: 'M32'
  }],
  ['fibromyalgia', { 
    medical: 'fibromyalgia',
    alternatives: ['fibromyalgia syndrome'],
    icdHint: 'M79'
  }],
  ['gout', { 
    medical: 'gout',
    alternatives: ['gouty arthritis'],
    icdHint: 'M10'
  }],
  ['oa', { 
    medical: 'osteoarthritis',
    alternatives: ['degenerative joint disease'],
    icdHint: 'M19'
  }],
  
  // ===========================================================================
  // MENTAL HEALTH (10 mappings)
  // ===========================================================================
  
  ['anxiety', { 
    medical: 'anxiety disorder',
    alternatives: ['generalized anxiety disorder'],
    icdHint: 'F41'
  }],
  ['anxiety attack', { 
    medical: 'panic disorder',
    alternatives: ['panic attack'],
    icdHint: 'F41'
  }],
  ['panic attack', { 
    medical: 'panic disorder',
    alternatives: ['acute anxiety'],
    icdHint: 'F41'
  }],
  ['depression', { 
    medical: 'major depressive disorder',
    alternatives: ['depressive disorder'],
    icdHint: 'F32'
  }],
  ['feeling depressed', { 
    medical: 'depressive episode',
    icdHint: 'F32'
  }],
  ['ptsd', { 
    medical: 'post-traumatic stress disorder',
    alternatives: ['PTSD'],
    icdHint: 'F43'
  }],
  ['emotional trauma', { 
    medical: 'post-traumatic stress disorder',
    alternatives: ['psychological trauma'],
    icdHint: 'F43'
  }],
  ['adhd', { 
    medical: 'attention deficit hyperactivity disorder',
    alternatives: ['ADHD', 'attention deficit disorder'],
    icdHint: 'F90'
  }],
  ['add', { 
    medical: 'attention deficit disorder',
    alternatives: ['ADHD'],
    icdHint: 'F90'
  }],
  ['bipolar', { 
    medical: 'bipolar disorder',
    alternatives: ['manic depression'],
    icdHint: 'F31'
  }],
  
  // ===========================================================================
  // NEUROLOGICAL (8 mappings)
  // ===========================================================================
  
  ['headache', { 
    medical: 'headache',
    alternatives: ['cephalgia'],
    icdHint: 'R51'
  }],
  ['migraine', { 
    medical: 'migraine',
    alternatives: ['migraine headache'],
    icdHint: 'G43'
  }],
  ['seizure', { 
    medical: 'seizure',
    alternatives: ['convulsion', 'epileptic seizure'],
    icdHint: 'G40'
  }],
  ['epilepsy', { 
    medical: 'epilepsy',
    alternatives: ['seizure disorder'],
    icdHint: 'G40'
  }],
  ['dizziness', { 
    medical: 'dizziness',
    alternatives: ['vertigo', 'lightheadedness'],
    icdHint: 'R42'
  }],
  ['vertigo', { 
    medical: 'vertigo',
    alternatives: ['vestibular disorder'],
    icdHint: 'H81'
  }],
  ['numbness', { 
    medical: 'paresthesia',
    alternatives: ['numbness and tingling'],
    icdHint: 'R20'
  }],
  ['tingling', { 
    medical: 'paresthesia',
    alternatives: ['tingling sensation'],
    icdHint: 'R20'
  }],
  ['ms', { 
    medical: 'multiple sclerosis',
    alternatives: ['MS'],
    icdHint: 'G35'
  }],
  ['als', { 
    medical: 'amyotrophic lateral sclerosis',
    alternatives: ['Lou Gehrig disease', 'motor neuron disease'],
    icdHint: 'G12'
  }],
  ['parkinsons', { 
    medical: 'Parkinson disease',
    alternatives: ['parkinsonism'],
    icdHint: 'G20'
  }],
  ['pd', { 
    medical: 'Parkinson disease',
    icdHint: 'G20'
  }],
  ['dementia', { 
    medical: 'dementia',
    alternatives: ['cognitive impairment'],
    icdHint: 'F03'
  }],
  ['alzheimers', { 
    medical: 'Alzheimer disease',
    alternatives: ['Alzheimer dementia'],
    icdHint: 'G30'
  }],
  
  // ===========================================================================
  // ENDOCRINE / METABOLIC (6 mappings)
  // ===========================================================================
  
  ['sugar diabetes', { 
    medical: 'diabetes mellitus',
    alternatives: ['type 2 diabetes'],
    icdHint: 'E11'
  }],
  ['high blood sugar', { 
    medical: 'hyperglycemia',
    alternatives: ['diabetes mellitus'],
    icdHint: 'E11'
  }],
  ['low blood sugar', { 
    medical: 'hypoglycemia',
    icdHint: 'E16'
  }],
  ['underactive thyroid', { 
    medical: 'hypothyroidism',
    alternatives: ['thyroid deficiency'],
    icdHint: 'E03'
  }],
  ['overactive thyroid', { 
    medical: 'hyperthyroidism',
    alternatives: ['thyrotoxicosis'],
    icdHint: 'E05'
  }],
  ['obesity', { 
    medical: 'obesity',
    alternatives: ['morbid obesity'],
    icdHint: 'E66'
  }],
  ['dm', { 
    medical: 'diabetes mellitus',
    alternatives: ['diabetes'],
    icdHint: 'E11'
  }],
  ['dm2', { 
    medical: 'type 2 diabetes mellitus',
    alternatives: ['diabetes mellitus type 2', 'T2DM'],
    icdHint: 'E11'
  }],
  ['dm1', { 
    medical: 'type 1 diabetes mellitus',
    alternatives: ['diabetes mellitus type 1', 'T1DM'],
    icdHint: 'E10'
  }],
  ['t2dm', { 
    medical: 'type 2 diabetes mellitus',
    icdHint: 'E11'
  }],
  ['t1dm', { 
    medical: 'type 1 diabetes mellitus',
    icdHint: 'E10'
  }],
  
  // ===========================================================================
  // SKIN CONDITIONS (6 mappings)
  // ===========================================================================
  
  ['rash', { 
    medical: 'dermatitis',
    alternatives: ['skin rash', 'exanthem'],
    icdHint: 'L30'
  }],
  ['eczema', { 
    medical: 'atopic dermatitis',
    alternatives: ['eczema'],
    icdHint: 'L20'
  }],
  ['hives', { 
    medical: 'urticaria',
    alternatives: ['allergic hives'],
    icdHint: 'L50'
  }],
  ['acne', { 
    medical: 'acne',
    alternatives: ['acne vulgaris'],
    icdHint: 'L70'
  }],
  ['psoriasis', { 
    medical: 'psoriasis',
    icdHint: 'L40'
  }],
  ['skin infection', { 
    medical: 'cellulitis',
    alternatives: ['skin and soft tissue infection'],
    icdHint: 'L03'
  }],
  
  // ===========================================================================
  // GENITOURINARY (5 mappings)
  // ===========================================================================
  
  ['uti', { 
    medical: 'urinary tract infection',
    icdHint: 'N39'
  }],
  ['bladder infection', { 
    medical: 'cystitis',
    alternatives: ['urinary tract infection'],
    icdHint: 'N30'
  }],
  ['kidney stones', { 
    medical: 'nephrolithiasis',
    alternatives: ['renal calculi', 'kidney stones'],
    icdHint: 'N20'
  }],
  ['kidney infection', { 
    medical: 'pyelonephritis',
    alternatives: ['kidney infection'],
    icdHint: 'N10'
  }],
  ['kidney disease', { 
    medical: 'chronic kidney disease',
    alternatives: ['renal insufficiency'],
    icdHint: 'N18'
  }],
  ['esrd', { 
    medical: 'end stage renal disease',
    alternatives: ['end stage kidney disease', 'ESKD'],
    icdHint: 'N18'
  }],
  ['ckd', { 
    medical: 'chronic kidney disease',
    alternatives: ['chronic renal disease'],
    icdHint: 'N18'
  }],
  ['aki', { 
    medical: 'acute kidney injury',
    alternatives: ['acute renal injury'],
    icdHint: 'N17'
  }],
  ['arf', { 
    medical: 'acute renal failure',
    alternatives: ['acute kidney failure'],
    icdHint: 'N17'
  }],
  ['crf', { 
    medical: 'chronic renal failure',
    alternatives: ['chronic kidney failure'],
    icdHint: 'N18'
  }],
  ['bph', { 
    medical: 'benign prostatic hyperplasia',
    alternatives: ['enlarged prostate', 'prostatic hypertrophy'],
    icdHint: 'N40'
  }],
  
  // NIH Autocomplete Phrases (API-friendly translations)
  // These handle phrases that come from NIH suggestions but timeout on ClinicalTables API
  ['renal insufficiency', { 
    medical: 'chronic kidney disease',
    alternatives: ['kidney failure', 'renal failure'],
    icdHint: 'N18'
  }],
  ['renal insufficiency chronic', { 
    medical: 'chronic kidney disease',
    alternatives: ['chronic renal failure'],
    icdHint: 'N18'
  }],
  ['renal insufficiency - chronic', { 
    medical: 'chronic kidney disease',
    alternatives: ['chronic renal failure'],
    icdHint: 'N18'
  }],
  ['chronic renal insufficiency', { 
    medical: 'chronic kidney disease',
    alternatives: ['chronic renal failure'],
    icdHint: 'N18'
  }],
  ['kidney insufficiency', { 
    medical: 'chronic kidney disease',
    alternatives: ['renal insufficiency'],
    icdHint: 'N18'
  }],
  ['renal failure', { 
    medical: 'kidney failure',
    alternatives: ['renal insufficiency'],
    icdHint: 'N19'
  }],
  ['chronic renal failure', { 
    medical: 'chronic kidney disease',
    alternatives: ['CKD', 'chronic renal disease'],
    icdHint: 'N18'
  }],
  ['end stage renal disease', { 
    medical: 'end stage renal disease',
    alternatives: ['ESRD', 'end stage kidney disease'],
    icdHint: 'N18.6'
  }],
  ['end-stage renal disease', { 
    medical: 'end stage renal disease',
    alternatives: ['ESRD'],
    icdHint: 'N18.6'
  }],
  
  // ===========================================================================
  // SLEEP DISORDERS (4 mappings)
  // ===========================================================================
  
  ['sleep apnea', { 
    medical: 'obstructive sleep apnea',
    alternatives: ['sleep apnea'],
    icdHint: 'G47'
  }],
  ['osa', { 
    medical: 'obstructive sleep apnea',
    alternatives: ['sleep apnea syndrome'],
    icdHint: 'G47'
  }],
  ['insomnia', { 
    medical: 'insomnia',
    alternatives: ['sleep disorder'],
    icdHint: 'G47'
  }],
  ["can't sleep", { 
    medical: 'insomnia',
    icdHint: 'G47'
  }],
  ['snoring', { 
    medical: 'snoring',
    alternatives: ['sleep disordered breathing'],
    icdHint: 'R06'
  }],
  
  // ===========================================================================
  // SYMPTOMS & GENERAL (8 mappings)
  // ===========================================================================
  
  ['fever', { 
    medical: 'fever',
    alternatives: ['pyrexia'],
    icdHint: 'R50'
  }],
  ['fatigue', { 
    medical: 'fatigue',
    alternatives: ['malaise', 'exhaustion'],
    icdHint: 'R53'
  }],
  ['tired all the time', { 
    medical: 'chronic fatigue',
    alternatives: ['fatigue'],
    icdHint: 'R53'
  }],
  ['weight loss', { 
    medical: 'abnormal weight loss',
    alternatives: ['unintentional weight loss'],
    icdHint: 'R63'
  }],
  ['nausea', { 
    medical: 'nausea',
    alternatives: ['nausea and vomiting'],
    icdHint: 'R11'
  }],
  ['vomiting', { 
    medical: 'vomiting',
    alternatives: ['emesis'],
    icdHint: 'R11'
  }],
  ['swelling', { 
    medical: 'edema',
    alternatives: ['swelling'],
    icdHint: 'R60'
  }],
  ['fainting', { 
    medical: 'syncope',
    alternatives: ['fainting', 'loss of consciousness'],
    icdHint: 'R55'
  }],
  
  // ===========================================================================
  // ADDITIONAL COMMON ACRONYMS & CONDITIONS
  // ===========================================================================
  
  ['cf', { 
    medical: 'cystic fibrosis',
    icdHint: 'E84'
  }],
  ['hiv', { 
    medical: 'human immunodeficiency virus infection',
    alternatives: ['HIV disease'],
    icdHint: 'B20'
  }],
  ['aids', { 
    medical: 'acquired immunodeficiency syndrome',
    alternatives: ['AIDS'],
    icdHint: 'B20'
  }],
  ['std', { 
    medical: 'sexually transmitted disease',
    alternatives: ['sexually transmitted infection', 'STI'],
    icdHint: 'A64'
  }],
  ['sti', { 
    medical: 'sexually transmitted infection',
    alternatives: ['sexually transmitted disease'],
    icdHint: 'A64'
  }],
  ['tb', { 
    medical: 'tuberculosis',
    alternatives: ['pulmonary tuberculosis'],
    icdHint: 'A15'
  }],
  ['mrsa', { 
    medical: 'methicillin resistant staphylococcus aureus infection',
    alternatives: ['MRSA infection'],
    icdHint: 'A49'
  }],
  ['c diff', { 
    medical: 'clostridioides difficile infection',
    alternatives: ['C. difficile', 'CDI'],
    icdHint: 'A04'
  }],
  ['sepsis', { 
    medical: 'sepsis',
    alternatives: ['septicemia', 'blood poisoning'],
    icdHint: 'A41'
  }],
  ['anemia', { 
    medical: 'anemia',
    alternatives: ['anaemia'],
    icdHint: 'D64'
  }],
  ['iron deficiency', { 
    medical: 'iron deficiency anemia',
    alternatives: ['low iron'],
    icdHint: 'D50'
  }],
]);

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Gets all common terms (keys) from the mappings.
 * Useful for autocomplete or displaying examples.
 * 
 * @returns Array of all mapped common terms
 */
export function getAllCommonTerms(): string[] {
  return Array.from(TERM_MAPPINGS.keys());
}

/**
 * Gets the count of term mappings.
 * 
 * @returns Number of mappings
 */
export function getMappingsCount(): number {
  return TERM_MAPPINGS.size;
}

/**
 * Checks if a term has a mapping.
 * 
 * @param term - The term to check (case-insensitive)
 * @returns True if mapping exists
 */
export function hasMapping(term: string): boolean {
  return TERM_MAPPINGS.has(term.toLowerCase().trim());
}

/**
 * Gets the mapping for a term.
 * 
 * @param term - The term to look up (case-insensitive)
 * @returns TermMapping or undefined if not found
 */
export function getMapping(term: string): TermMapping | undefined {
  return TERM_MAPPINGS.get(term.toLowerCase().trim());
}

// =============================================================================
// Autocomplete Helper Functions
// =============================================================================

/**
 * Result structure for autocomplete suggestions.
 */
export interface AutocompleteSuggestion {
  /** The common/lay term (what user might type) */
  term: string;
  /** The medical terminology equivalent */
  medical: string;
  /** ICD-10 code family hint (if available) */
  icdHint?: string;
  /** Match score for sorting (higher = better match) */
  score: number;
}

/**
 * Filters term mappings for autocomplete suggestions.
 * 
 * Matching logic (in order of priority):
 * 1. Exact match on term (score: 100)
 * 2. Term starts with query (score: 80)
 * 3. Medical term starts with query (score: 70)
 * 4. Term contains query (score: 50)
 * 5. Medical term contains query (score: 40)
 * 
 * @param query - The user's input (case-insensitive)
 * @param limit - Maximum number of suggestions to return (default: 10)
 * @returns Array of matching suggestions, sorted by relevance score
 * 
 * @example
 * filterMappingsForAutocomplete('esr', 5)
 * // Returns: [{ term: 'esrd', medical: 'end stage renal disease', score: 80 }]
 * 
 * filterMappingsForAutocomplete('heart', 5)
 * // Returns: [
 * //   { term: 'heart attack', medical: 'myocardial infarction', score: 80 },
 * //   { term: 'heart failure', medical: 'heart failure', score: 80 },
 * //   { term: 'heart palpitations', medical: 'palpitations', score: 80 }
 * // ]
 */
export function filterMappingsForAutocomplete(
  query: string,
  limit: number = 10
): AutocompleteSuggestion[] {
  const normalizedQuery = query.toLowerCase().trim();
  
  // Return empty if query is too short
  if (normalizedQuery.length < 1) {
    return [];
  }
  
  const results: AutocompleteSuggestion[] = [];
  
  for (const [term, mapping] of TERM_MAPPINGS) {
    const medicalLower = mapping.medical.toLowerCase();
    let score = 0;
    
    // Scoring logic
    if (term === normalizedQuery) {
      // Exact match on common term
      score = 100;
    } else if (term.startsWith(normalizedQuery)) {
      // Common term starts with query (e.g., "esr" matches "esrd")
      score = 80;
    } else if (medicalLower.startsWith(normalizedQuery)) {
      // Medical term starts with query (e.g., "diab" matches "diabetes mellitus")
      score = 70;
    } else if (term.includes(normalizedQuery)) {
      // Common term contains query (e.g., "attack" matches "heart attack")
      score = 50;
    } else if (medicalLower.includes(normalizedQuery)) {
      // Medical term contains query
      score = 40;
    }
    
    // Also check alternatives
    if (score === 0 && mapping.alternatives) {
      for (const alt of mapping.alternatives) {
        const altLower = alt.toLowerCase();
        if (altLower.startsWith(normalizedQuery)) {
          score = 60;
          break;
        } else if (altLower.includes(normalizedQuery)) {
          score = 35;
          break;
        }
      }
    }
    
    if (score > 0) {
      results.push({
        term,
        medical: mapping.medical,
        icdHint: mapping.icdHint,
        score,
      });
    }
  }
  
  // Sort by score (descending), then alphabetically by term
  results.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.term.localeCompare(b.term);
  });
  
  // Return top results up to limit
  return results.slice(0, limit);
}

/**
 * Checks if a query would result in any autocomplete suggestions.
 * Useful for determining whether to show the dropdown.
 * 
 * @param query - The user's input
 * @returns True if there are matching suggestions
 */
export function hasAutocompleteSuggestions(query: string): boolean {
  return filterMappingsForAutocomplete(query, 1).length > 0;
}
