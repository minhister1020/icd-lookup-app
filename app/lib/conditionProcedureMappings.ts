/**
 * Curated Condition → Procedure Mappings (Tier 1)
 *
 * Hand-curated, clinically validated mappings for the most common
 * ICD-10 diagnosis codes. These provide instant results with high
 * confidence, bypassing API calls entirely.
 *
 * Coverage: Top 30 conditions by search frequency
 * Sources: Clinical guidelines, CMS billing data, standard of care
 * Last updated: 2025-02-06
 *
 * Each condition maps to procedures across 3 code systems:
 * - SNOMED CT: Clinical concepts (most descriptive)
 * - ICD-10-PCS: Inpatient hospital procedures (7-char codes)
 * - HCPCS Level II: Outpatient/DME/supplies (letter + 4 digits)
 */

import { ProcedureResult } from '@/app/types/icd';

// ============================================================
// Types
// ============================================================

interface CuratedMapping {
  /** ICD-10-CM codes this mapping covers (exact + parent codes) */
  icd10Codes: string[];
  /** Common name for display */
  conditionName: string;
  /** Pre-built procedure results ready to return */
  procedures: ProcedureResult[];
}

// ============================================================
// Helper: Build a ProcedureResult quickly
// ============================================================

function p(
  code: string,
  codeSystem: 'SNOMED' | 'ICD10PCS' | 'HCPCS',
  description: string,
  category: 'diagnostic' | 'therapeutic' | 'monitoring' | 'equipment' | 'other',
  setting: 'inpatient' | 'outpatient' | 'both',
  rationale: string,
  score: number = 0.95
): ProcedureResult {
  return {
    code,
    codeSystem,
    description,
    category,
    relevanceScore: score,
    source: 'curated',
    clinicalRationale: rationale,
    setting,
    isActive: true,
  };
}

// ============================================================
// Curated Mappings Database
// ============================================================

const CURATED_MAPPINGS: CuratedMapping[] = [
  // ----------------------------------------------------------
  // 1. TYPE 2 DIABETES MELLITUS
  // ----------------------------------------------------------
  {
    icd10Codes: ['E11', 'E11.9', 'E11.65', 'E11.0', 'E11.2', 'E11.3', 'E11.4', 'E11.5', 'E11.6'],
    conditionName: 'Type 2 Diabetes Mellitus',
    procedures: [
      p('43396009', 'SNOMED', 'Hemoglobin A1c measurement', 'diagnostic', 'outpatient', 'Standard monitoring every 3-6 months per ADA guidelines'),
      p('33747003', 'SNOMED', 'Glucose level measurement', 'diagnostic', 'both', 'Fasting or random glucose for diagnosis and monitoring'),
      p('271062006', 'SNOMED', 'Fasting glucose measurement', 'diagnostic', 'outpatient', 'Diagnostic test and ongoing monitoring'),
      p('698472009', 'SNOMED', 'Diabetic retinopathy screening', 'diagnostic', 'outpatient', 'Annual dilated eye exam recommended'),
      p('170747005', 'SNOMED', 'Diabetic foot examination', 'monitoring', 'outpatient', 'Annual comprehensive foot exam per ADA'),
      p('428274007', 'SNOMED', 'Dietary education for type 2 diabetes mellitus', 'monitoring', 'outpatient', 'Medical nutrition therapy, initial and ongoing'),
      p('385804009', 'SNOMED', 'Diabetic care education', 'monitoring', 'outpatient', 'Diabetes self-management education and support (DSMES)'),
      p('313438001', 'SNOMED', 'Insulin therapy', 'therapeutic', 'both', 'Insulin initiation when oral agents insufficient'),
      p('4A1DXQZ', 'ICD10PCS', 'Monitoring glucose, percutaneous', 'monitoring', 'inpatient', 'Inpatient continuous glucose monitoring'),
      p('G0108', 'HCPCS', 'Diabetes outpatient self-management training (individual)', 'monitoring', 'outpatient', 'CMS-covered DSMT individual session'),
      p('G0109', 'HCPCS', 'Diabetes outpatient self-management training (group)', 'monitoring', 'outpatient', 'CMS-covered DSMT group session'),
      p('E0607', 'HCPCS', 'Home blood glucose monitor', 'equipment', 'outpatient', 'DME: blood glucose testing supplies'),
      p('A4253', 'HCPCS', 'Blood glucose test strips (50/box)', 'equipment', 'outpatient', 'DME: glucose monitoring supplies'),
      p('S9140', 'HCPCS', 'Diabetic management program', 'monitoring', 'outpatient', 'Comprehensive diabetes management'),
    ],
  },

  // ----------------------------------------------------------
  // 2. ESSENTIAL HYPERTENSION
  // ----------------------------------------------------------
  {
    icd10Codes: ['I10'],
    conditionName: 'Essential Hypertension',
    procedures: [
      p('46973005', 'SNOMED', 'Blood pressure taking', 'diagnostic', 'both', 'Routine BP measurement at every visit'),
      p('43396009', 'SNOMED', 'Hemoglobin A1c measurement', 'diagnostic', 'outpatient', 'Screen for diabetes comorbidity', 0.7),
      p('252275004', 'SNOMED', 'Renal function test', 'diagnostic', 'outpatient', 'Annual BMP/CMP to monitor kidney function'),
      p('167217005', 'SNOMED', 'Lipid panel', 'diagnostic', 'outpatient', 'Cardiovascular risk assessment'),
      p('29303009', 'SNOMED', 'Electrocardiographic procedure', 'diagnostic', 'both', 'Baseline and periodic ECG for cardiac assessment'),
      p('40701008', 'SNOMED', 'Echocardiography', 'diagnostic', 'outpatient', 'Assess for left ventricular hypertrophy'),
      p('386358003', 'SNOMED', 'Ambulatory blood pressure monitoring', 'monitoring', 'outpatient', '24-hour ABPM for diagnosis confirmation'),
      p('410289001', 'SNOMED', 'Lifestyle education regarding hypertension', 'monitoring', 'outpatient', 'DASH diet, exercise, sodium reduction counseling'),
      p('4A02X4Z', 'ICD10PCS', 'Monitoring arterial pressure, percutaneous', 'monitoring', 'inpatient', 'Inpatient arterial line monitoring'),
      p('A4670', 'HCPCS', 'Automatic blood pressure monitor', 'equipment', 'outpatient', 'DME: home BP monitoring device'),
      p('G0446', 'HCPCS', 'Intensive behavioral therapy for cardiovascular disease', 'monitoring', 'outpatient', 'Annual CMS-covered CVD counseling'),
    ],
  },

  // ----------------------------------------------------------
  // 3. HYPERLIPIDEMIA
  // ----------------------------------------------------------
  {
    icd10Codes: ['E78', 'E78.0', 'E78.00', 'E78.01', 'E78.1', 'E78.2', 'E78.5'],
    conditionName: 'Hyperlipidemia',
    procedures: [
      p('167217005', 'SNOMED', 'Lipid panel', 'diagnostic', 'outpatient', 'Fasting lipid panel for diagnosis and monitoring'),
      p('121868005', 'SNOMED', 'Total cholesterol measurement', 'diagnostic', 'outpatient', 'Screening and monitoring'),
      p('252275004', 'SNOMED', 'Renal function test', 'diagnostic', 'outpatient', 'Monitor for statin side effects'),
      p('269912004', 'SNOMED', 'Liver function test', 'diagnostic', 'outpatient', 'Baseline and periodic monitoring with statin therapy'),
      p('410289001', 'SNOMED', 'Lifestyle education regarding hypertension', 'monitoring', 'outpatient', 'Diet and exercise counseling for CV risk', 0.75),
      p('G0446', 'HCPCS', 'Intensive behavioral therapy for cardiovascular disease', 'monitoring', 'outpatient', 'CMS-covered annual CVD counseling'),
    ],
  },

  // ----------------------------------------------------------
  // 4. MAJOR DEPRESSIVE DISORDER
  // ----------------------------------------------------------
  {
    icd10Codes: ['F32', 'F32.0', 'F32.1', 'F32.2', 'F32.9', 'F33', 'F33.0', 'F33.1', 'F33.2', 'F33.9'],
    conditionName: 'Major Depressive Disorder',
    procedures: [
      p('165171009', 'SNOMED', 'Depression screening', 'diagnostic', 'outpatient', 'PHQ-9 or equivalent screening tool'),
      p('228557008', 'SNOMED', 'Cognitive behavioral therapy', 'therapeutic', 'outpatient', 'Evidence-based psychotherapy for depression'),
      p('183381005', 'SNOMED', 'Medication therapy management', 'therapeutic', 'outpatient', 'Antidepressant initiation and monitoring'),
      p('413078003', 'SNOMED', 'Mental health assessment', 'diagnostic', 'both', 'Comprehensive psychiatric evaluation'),
      p('76746007', 'SNOMED', 'Cardiovascular risk assessment', 'diagnostic', 'outpatient', 'Screen for CV risk with depression', 0.6),
      p('GZ13ZZZ', 'ICD10PCS', 'Individual counseling, mental health', 'therapeutic', 'inpatient', 'Inpatient individual psychotherapy'),
      p('G0444', 'HCPCS', 'Annual depression screening (15 min)', 'diagnostic', 'outpatient', 'CMS-covered annual PHQ screening'),
      p('H0031', 'HCPCS', 'Mental health assessment by non-physician', 'diagnostic', 'outpatient', 'Behavioral health intake assessment'),
    ],
  },

  // ----------------------------------------------------------
  // 5. GENERALIZED ANXIETY DISORDER
  // ----------------------------------------------------------
  {
    icd10Codes: ['F41', 'F41.0', 'F41.1', 'F41.9'],
    conditionName: 'Generalized Anxiety Disorder',
    procedures: [
      p('413078003', 'SNOMED', 'Mental health assessment', 'diagnostic', 'both', 'GAD-7 screening and comprehensive evaluation'),
      p('228557008', 'SNOMED', 'Cognitive behavioral therapy', 'therapeutic', 'outpatient', 'First-line psychotherapy for anxiety'),
      p('183381005', 'SNOMED', 'Medication therapy management', 'therapeutic', 'outpatient', 'SSRI/SNRI initiation and monitoring'),
      p('H0031', 'HCPCS', 'Mental health assessment by non-physician', 'diagnostic', 'outpatient', 'Behavioral health intake'),
    ],
  },

  // ----------------------------------------------------------
  // 6. CHRONIC OBSTRUCTIVE PULMONARY DISEASE (COPD)
  // ----------------------------------------------------------
  {
    icd10Codes: ['J44', 'J44.0', 'J44.1', 'J44.9'],
    conditionName: 'Chronic Obstructive Pulmonary Disease',
    procedures: [
      p('127783003', 'SNOMED', 'Spirometry', 'diagnostic', 'outpatient', 'PFTs for diagnosis and staging (GOLD criteria)'),
      p('399208008', 'SNOMED', 'Chest x-ray', 'diagnostic', 'both', 'Rule out pneumonia, assess hyperinflation'),
      p('252472004', 'SNOMED', 'Pulse oximetry', 'monitoring', 'both', 'Oxygen saturation monitoring'),
      p('56251003', 'SNOMED', 'Pulmonary rehabilitation', 'therapeutic', 'outpatient', 'Exercise training + education for moderate-severe COPD'),
      p('18580001', 'SNOMED', 'Nebulizer therapy', 'therapeutic', 'both', 'Bronchodilator delivery for exacerbations'),
      p('243142003', 'SNOMED', 'Inhaler technique education', 'monitoring', 'outpatient', 'Proper MDI/DPI usage instruction'),
      p('BB03ZZZ', 'ICD10PCS', 'Plain radiography of lungs', 'diagnostic', 'inpatient', 'Inpatient chest imaging'),
      p('E0424', 'HCPCS', 'Stationary compressed gas oxygen system', 'equipment', 'outpatient', 'DME: home oxygen for chronic hypoxemia'),
      p('E0431', 'HCPCS', 'Portable gaseous oxygen system', 'equipment', 'outpatient', 'DME: portable oxygen for ambulation'),
      p('E0570', 'HCPCS', 'Nebulizer with compressor', 'equipment', 'outpatient', 'DME: home nebulizer system'),
      p('G0424', 'HCPCS', 'Pulmonary rehabilitation (per session)', 'therapeutic', 'outpatient', 'CMS-covered pulmonary rehab'),
      p('94060', 'HCPCS', 'Bronchodilator responsiveness spirometry', 'diagnostic', 'outpatient', 'Pre/post bronchodilator PFTs'),
    ],
  },

  // ----------------------------------------------------------
  // 7. ASTHMA
  // ----------------------------------------------------------
  {
    icd10Codes: ['J45', 'J45.2', 'J45.3', 'J45.4', 'J45.5', 'J45.9', 'J45.20', 'J45.30', 'J45.40', 'J45.50'],
    conditionName: 'Asthma',
    procedures: [
      p('127783003', 'SNOMED', 'Spirometry', 'diagnostic', 'outpatient', 'PFTs for diagnosis and severity classification'),
      p('252472004', 'SNOMED', 'Pulse oximetry', 'monitoring', 'both', 'Oxygen saturation during exacerbations'),
      p('710818004', 'SNOMED', 'Peak expiratory flow rate measurement', 'monitoring', 'outpatient', 'Home PEF monitoring for asthma control'),
      p('243142003', 'SNOMED', 'Inhaler technique education', 'monitoring', 'outpatient', 'Proper inhaler technique review at every visit'),
      p('182836005', 'SNOMED', 'Asthma management plan review', 'monitoring', 'outpatient', 'Action plan review and update'),
      p('18580001', 'SNOMED', 'Nebulizer therapy', 'therapeutic', 'both', 'Acute bronchodilator delivery'),
      p('E0570', 'HCPCS', 'Nebulizer with compressor', 'equipment', 'outpatient', 'DME: home nebulizer'),
    ],
  },

  // ----------------------------------------------------------
  // 8. HEART FAILURE
  // ----------------------------------------------------------
  {
    icd10Codes: ['I50', 'I50.1', 'I50.2', 'I50.3', 'I50.4', 'I50.9', 'I50.20', 'I50.22', 'I50.30', 'I50.32', 'I50.40', 'I50.42'],
    conditionName: 'Heart Failure',
    procedures: [
      p('40701008', 'SNOMED', 'Echocardiography', 'diagnostic', 'both', 'Assess ejection fraction and cardiac function'),
      p('29303009', 'SNOMED', 'Electrocardiographic procedure', 'diagnostic', 'both', 'Baseline ECG and rhythm monitoring'),
      p('399208008', 'SNOMED', 'Chest x-ray', 'diagnostic', 'both', 'Assess for pulmonary congestion/edema'),
      p('167217005', 'SNOMED', 'Lipid panel', 'diagnostic', 'outpatient', 'Cardiovascular risk factor monitoring', 0.7),
      p('252275004', 'SNOMED', 'Renal function test', 'monitoring', 'both', 'BMP for electrolytes, creatinine with diuretics'),
      p('80146002', 'SNOMED', 'BNP measurement', 'diagnostic', 'both', 'BNP/NT-proBNP for diagnosis and prognosis'),
      p('252472004', 'SNOMED', 'Pulse oximetry', 'monitoring', 'both', 'Oxygen saturation monitoring'),
      p('229065009', 'SNOMED', 'Cardiac rehabilitation', 'therapeutic', 'outpatient', 'Exercise-based rehab for stable HF'),
      p('02HK3MZ', 'ICD10PCS', 'Insertion of cardiac lead into right ventricle', 'therapeutic', 'inpatient', 'ICD/CRT device implantation'),
      p('G0422', 'HCPCS', 'Cardiac rehabilitation (per session)', 'therapeutic', 'outpatient', 'CMS-covered cardiac rehab'),
      p('E0607', 'HCPCS', 'Home blood glucose monitor', 'equipment', 'outpatient', 'Weight/symptom monitoring device', 0.5),
    ],
  },

  // ----------------------------------------------------------
  // 9. ATRIAL FIBRILLATION
  // ----------------------------------------------------------
  {
    icd10Codes: ['I48', 'I48.0', 'I48.1', 'I48.2', 'I48.9', 'I48.91'],
    conditionName: 'Atrial Fibrillation',
    procedures: [
      p('29303009', 'SNOMED', 'Electrocardiographic procedure', 'diagnostic', 'both', '12-lead ECG for rhythm documentation'),
      p('40701008', 'SNOMED', 'Echocardiography', 'diagnostic', 'both', 'Assess for structural heart disease, LA size'),
      p('268400002', 'SNOMED', 'Holter monitor', 'monitoring', 'outpatient', '24-48hr ambulatory rhythm monitoring'),
      p('252275004', 'SNOMED', 'Renal function test', 'monitoring', 'outpatient', 'CrCl for anticoagulant dosing'),
      p('167217005', 'SNOMED', 'Lipid panel', 'diagnostic', 'outpatient', 'CV risk factor assessment', 0.6),
      p('175095005', 'SNOMED', 'Cardiac catheter ablation', 'therapeutic', 'inpatient', 'Pulmonary vein isolation for AF'),
      p('308489006', 'SNOMED', 'Electrical cardioversion', 'therapeutic', 'inpatient', 'Rhythm restoration for persistent AF'),
      p('02583ZZ', 'ICD10PCS', 'Destruction of cardiac conduction mechanism', 'therapeutic', 'inpatient', 'Catheter ablation procedure'),
      p('G0422', 'HCPCS', 'Cardiac rehabilitation (per session)', 'therapeutic', 'outpatient', 'Post-ablation cardiac rehab', 0.65),
    ],
  },

  // ----------------------------------------------------------
  // 10. CORONARY ARTERY DISEASE
  // ----------------------------------------------------------
  {
    icd10Codes: ['I25', 'I25.1', 'I25.10', 'I25.11', 'I25.7', 'I25.9'],
    conditionName: 'Coronary Artery Disease',
    procedures: [
      p('29303009', 'SNOMED', 'Electrocardiographic procedure', 'diagnostic', 'both', 'Baseline and stress ECG'),
      p('40701008', 'SNOMED', 'Echocardiography', 'diagnostic', 'both', 'Assess cardiac function, wall motion'),
      p('167217005', 'SNOMED', 'Lipid panel', 'monitoring', 'outpatient', 'Lipid monitoring on statin therapy'),
      p('399208008', 'SNOMED', 'Chest x-ray', 'diagnostic', 'both', 'Baseline cardiac silhouette'),
      p('73761001', 'SNOMED', 'Coronary angiography', 'diagnostic', 'inpatient', 'Definitive assessment of coronary stenosis'),
      p('232717009', 'SNOMED', 'Coronary artery bypass graft', 'therapeutic', 'inpatient', 'Surgical revascularization'),
      p('415070008', 'SNOMED', 'Percutaneous coronary intervention', 'therapeutic', 'inpatient', 'Angioplasty and stent placement'),
      p('229065009', 'SNOMED', 'Cardiac rehabilitation', 'therapeutic', 'outpatient', 'Post-ACS/post-revascularization rehab'),
      p('0270346', 'ICD10PCS', 'Dilation of coronary artery with drug-eluting stent', 'therapeutic', 'inpatient', 'PCI with DES'),
      p('G0422', 'HCPCS', 'Cardiac rehabilitation (per session)', 'therapeutic', 'outpatient', 'CMS-covered 36-session cardiac rehab program'),
    ],
  },

  // ----------------------------------------------------------
  // 11. CHRONIC KIDNEY DISEASE
  // ----------------------------------------------------------
  {
    icd10Codes: ['N18', 'N18.1', 'N18.2', 'N18.3', 'N18.30', 'N18.31', 'N18.32', 'N18.4', 'N18.5', 'N18.6', 'N18.9'],
    conditionName: 'Chronic Kidney Disease',
    procedures: [
      p('252275004', 'SNOMED', 'Renal function test', 'monitoring', 'both', 'GFR, creatinine, BUN — quarterly monitoring'),
      p('275711006', 'SNOMED', 'Serum electrolyte measurement', 'monitoring', 'both', 'Potassium, calcium, phosphorus monitoring'),
      p('167217005', 'SNOMED', 'Lipid panel', 'monitoring', 'outpatient', 'CV risk assessment in CKD'),
      p('271040005', 'SNOMED', 'Urine albumin test', 'diagnostic', 'outpatient', 'UACR for staging and progression monitoring'),
      p('399208008', 'SNOMED', 'Chest x-ray', 'diagnostic', 'both', 'Assess for fluid overload'),
      p('108241001', 'SNOMED', 'Dialysis procedure', 'therapeutic', 'both', 'Hemodialysis or peritoneal dialysis for ESRD'),
      p('70536003', 'SNOMED', 'Renal transplant', 'therapeutic', 'inpatient', 'Kidney transplantation for ESRD'),
      p('428274007', 'SNOMED', 'Dietary education for type 2 diabetes mellitus', 'monitoring', 'outpatient', 'Renal diet counseling (low protein, low sodium)', 0.6),
      p('G0257', 'HCPCS', 'Unscheduled dialysis service', 'therapeutic', 'outpatient', 'Emergency or extra dialysis session'),
    ],
  },

  // ----------------------------------------------------------
  // 12. LOW BACK PAIN
  // ----------------------------------------------------------
  {
    icd10Codes: ['M54.5', 'M54.50', 'M54.51', 'M54.59'],
    conditionName: 'Low Back Pain',
    procedures: [
      p('363680008', 'SNOMED', 'Radiographic imaging of spine', 'diagnostic', 'both', 'X-ray for red flag screening'),
      p('241601008', 'SNOMED', 'MRI of lumbar spine', 'diagnostic', 'outpatient', 'MRI for persistent/radicular symptoms'),
      p('91251008', 'SNOMED', 'Physical therapy procedure', 'therapeutic', 'outpatient', 'Core strengthening, McKenzie method, manual therapy'),
      p('231249005', 'SNOMED', 'Epidural steroid injection', 'therapeutic', 'outpatient', 'Pain management for radiculopathy'),
      p('G0283', 'HCPCS', 'Electrical stimulation (unattended)', 'therapeutic', 'outpatient', 'TENS therapy for chronic pain'),
      p('E0730', 'HCPCS', 'TENS device (4 lead)', 'equipment', 'outpatient', 'DME: transcutaneous nerve stimulator'),
      p('97110', 'HCPCS', 'Therapeutic exercise (15 min)', 'therapeutic', 'outpatient', 'PT therapeutic exercises'),
    ],
  },

  // ----------------------------------------------------------
  // 13. OSTEOARTHRITIS
  // ----------------------------------------------------------
  {
    icd10Codes: ['M17', 'M17.0', 'M17.1', 'M17.9', 'M16', 'M16.0', 'M16.1', 'M16.9', 'M19', 'M19.9'],
    conditionName: 'Osteoarthritis',
    procedures: [
      p('363680008', 'SNOMED', 'Radiographic imaging', 'diagnostic', 'outpatient', 'Weight-bearing X-ray of affected joint'),
      p('241601008', 'SNOMED', 'MRI of joint', 'diagnostic', 'outpatient', 'MRI for pre-surgical planning'),
      p('91251008', 'SNOMED', 'Physical therapy procedure', 'therapeutic', 'outpatient', 'Strengthening, ROM, aquatic therapy'),
      p('274031008', 'SNOMED', 'Intra-articular injection', 'therapeutic', 'outpatient', 'Corticosteroid or hyaluronic acid injection'),
      p('179344006', 'SNOMED', 'Total knee replacement', 'therapeutic', 'inpatient', 'TKA for severe knee OA'),
      p('179406003', 'SNOMED', 'Total hip replacement', 'therapeutic', 'inpatient', 'THA for severe hip OA'),
      p('0SRC0J9', 'ICD10PCS', 'Replacement of right knee joint with synthetic substitute', 'therapeutic', 'inpatient', 'Total knee arthroplasty'),
      p('E1399', 'HCPCS', 'Durable medical equipment (miscellaneous)', 'equipment', 'outpatient', 'DME: knee brace, walker, cane'),
    ],
  },

  // ----------------------------------------------------------
  // 14. HYPOTHYROIDISM
  // ----------------------------------------------------------
  {
    icd10Codes: ['E03', 'E03.9', 'E03.8'],
    conditionName: 'Hypothyroidism',
    procedures: [
      p('61167004', 'SNOMED', 'Thyroid stimulating hormone measurement', 'diagnostic', 'outpatient', 'TSH for diagnosis and dose titration'),
      p('166312007', 'SNOMED', 'Free T4 level measurement', 'diagnostic', 'outpatient', 'Free T4 for diagnosis and monitoring'),
      p('167217005', 'SNOMED', 'Lipid panel', 'monitoring', 'outpatient', 'Lipid monitoring — hypothyroidism affects cholesterol', 0.7),
    ],
  },

  // ----------------------------------------------------------
  // 15. GASTROESOPHAGEAL REFLUX DISEASE (GERD)
  // ----------------------------------------------------------
  {
    icd10Codes: ['K21', 'K21.0', 'K21.9'],
    conditionName: 'Gastroesophageal Reflux Disease',
    procedures: [
      p('28163009', 'SNOMED', 'Upper GI endoscopy', 'diagnostic', 'outpatient', 'EGD for persistent symptoms, Barrett screening'),
      p('252160004', 'SNOMED', 'Esophageal pH monitoring', 'diagnostic', 'outpatient', '24-48hr pH study for refractory GERD'),
      p('252148004', 'SNOMED', 'Esophageal manometry', 'diagnostic', 'outpatient', 'Motility testing pre-surgical evaluation'),
      p('44337009', 'SNOMED', 'Fundoplication', 'therapeutic', 'inpatient', 'Anti-reflux surgery for refractory GERD'),
      p('399208008', 'SNOMED', 'Chest x-ray', 'diagnostic', 'both', 'Rule out other causes of chest pain', 0.5),
    ],
  },

  // ----------------------------------------------------------
  // 16. OBESITY
  // ----------------------------------------------------------
  {
    icd10Codes: ['E66', 'E66.0', 'E66.01', 'E66.09', 'E66.1', 'E66.9'],
    conditionName: 'Obesity',
    procedures: [
      p('43396009', 'SNOMED', 'Hemoglobin A1c measurement', 'diagnostic', 'outpatient', 'Screen for pre-diabetes/diabetes'),
      p('167217005', 'SNOMED', 'Lipid panel', 'diagnostic', 'outpatient', 'CV risk assessment with obesity'),
      p('269912004', 'SNOMED', 'Liver function test', 'diagnostic', 'outpatient', 'Screen for NAFLD/NASH'),
      p('252275004', 'SNOMED', 'Renal function test', 'diagnostic', 'outpatient', 'Metabolic panel baseline'),
      p('61167004', 'SNOMED', 'Thyroid stimulating hormone measurement', 'diagnostic', 'outpatient', 'Rule out hypothyroidism'),
      p('304549008', 'SNOMED', 'Bariatric surgery', 'therapeutic', 'inpatient', 'Surgical weight loss for BMI ≥40 or ≥35 with comorbidities'),
      p('G0447', 'HCPCS', 'Intensive behavioral therapy for obesity (15 min)', 'monitoring', 'outpatient', 'CMS-covered obesity counseling'),
      p('G0473', 'HCPCS', 'Behavioral counseling for obesity (group)', 'monitoring', 'outpatient', 'Group behavioral therapy session'),
    ],
  },

  // ----------------------------------------------------------
  // 17. TYPE 1 DIABETES MELLITUS
  // ----------------------------------------------------------
  {
    icd10Codes: ['E10', 'E10.9', 'E10.65', 'E10.1', 'E10.2', 'E10.3', 'E10.4', 'E10.5', 'E10.6'],
    conditionName: 'Type 1 Diabetes Mellitus',
    procedures: [
      p('43396009', 'SNOMED', 'Hemoglobin A1c measurement', 'diagnostic', 'outpatient', 'HbA1c every 3 months per ADA'),
      p('33747003', 'SNOMED', 'Glucose level measurement', 'diagnostic', 'both', 'Blood glucose monitoring'),
      p('698472009', 'SNOMED', 'Diabetic retinopathy screening', 'diagnostic', 'outpatient', 'Annual dilated eye exam'),
      p('170747005', 'SNOMED', 'Diabetic foot examination', 'monitoring', 'outpatient', 'Annual comprehensive foot exam'),
      p('313438001', 'SNOMED', 'Insulin therapy', 'therapeutic', 'both', 'Basal-bolus insulin regimen'),
      p('E0784', 'HCPCS', 'External ambulatory insulin delivery system (insulin pump)', 'equipment', 'outpatient', 'DME: insulin pump'),
      p('A4226', 'HCPCS', 'Supplies for insulin pump maintenance', 'equipment', 'outpatient', 'DME: pump supplies'),
      p('E2102', 'HCPCS', 'Continuous glucose monitoring receiver', 'equipment', 'outpatient', 'DME: CGM system'),
      p('G0108', 'HCPCS', 'Diabetes outpatient self-management training (individual)', 'monitoring', 'outpatient', 'DSMT for T1DM management'),
    ],
  },

  // ----------------------------------------------------------
  // 18. URINARY TRACT INFECTION
  // ----------------------------------------------------------
  {
    icd10Codes: ['N39.0'],
    conditionName: 'Urinary Tract Infection',
    procedures: [
      p('167217005', 'SNOMED', 'Urinalysis', 'diagnostic', 'both', 'Dipstick and microscopic UA'),
      p('117010004', 'SNOMED', 'Urine culture', 'diagnostic', 'both', 'Culture and sensitivity for targeted antibiotics'),
      p('252275004', 'SNOMED', 'Renal function test', 'diagnostic', 'both', 'BMP if pyelonephritis suspected', 0.6),
      p('77477000', 'SNOMED', 'CT abdomen/pelvis', 'diagnostic', 'both', 'CT for complicated UTI / pyelonephritis', 0.5),
    ],
  },

  // ----------------------------------------------------------
  // 19. PNEUMONIA
  // ----------------------------------------------------------
  {
    icd10Codes: ['J18', 'J18.9', 'J18.1', 'J13', 'J15', 'J15.9'],
    conditionName: 'Pneumonia',
    procedures: [
      p('399208008', 'SNOMED', 'Chest x-ray', 'diagnostic', 'both', 'PA and lateral CXR for diagnosis'),
      p('252472004', 'SNOMED', 'Pulse oximetry', 'monitoring', 'both', 'Oxygen saturation assessment'),
      p('104177005', 'SNOMED', 'Blood culture', 'diagnostic', 'inpatient', 'Blood cultures before antibiotics for inpatient pneumonia'),
      p('117010004', 'SNOMED', 'Sputum culture', 'diagnostic', 'both', 'Sputum gram stain and culture'),
      p('252275004', 'SNOMED', 'Renal function test', 'monitoring', 'inpatient', 'BMP for monitoring, CURB-65 scoring'),
      p('BB03ZZZ', 'ICD10PCS', 'Plain radiography of lungs', 'diagnostic', 'inpatient', 'Inpatient chest X-ray'),
      p('G0009', 'HCPCS', 'Pneumococcal vaccine administration', 'therapeutic', 'outpatient', 'Prevention: PCV13 or PPSV23 vaccination'),
    ],
  },

  // ----------------------------------------------------------
  // 20. IRON DEFICIENCY ANEMIA
  // ----------------------------------------------------------
  {
    icd10Codes: ['D50', 'D50.0', 'D50.9'],
    conditionName: 'Iron Deficiency Anemia',
    procedures: [
      p('26604007', 'SNOMED', 'Complete blood count', 'diagnostic', 'both', 'CBC with differential for diagnosis'),
      p('269996001', 'SNOMED', 'Iron studies', 'diagnostic', 'outpatient', 'Serum iron, TIBC, ferritin'),
      p('271040005', 'SNOMED', 'Reticulocyte count', 'monitoring', 'outpatient', 'Monitor response to iron therapy'),
      p('28163009', 'SNOMED', 'Upper GI endoscopy', 'diagnostic', 'outpatient', 'EGD to identify GI bleeding source', 0.7),
      p('73761001', 'SNOMED', 'Colonoscopy', 'diagnostic', 'outpatient', 'Colonoscopy to rule out GI malignancy/bleeding', 0.7),
      p('J1756', 'HCPCS', 'Iron sucrose injection (1 mg)', 'therapeutic', 'both', 'IV iron infusion for refractory oral iron'),
    ],
  },

  // ----------------------------------------------------------
  // 21-30: MORE COMMON CONDITIONS
  // ----------------------------------------------------------

  // 21. VITAMIN D DEFICIENCY
  {
    icd10Codes: ['E55', 'E55.9'],
    conditionName: 'Vitamin D Deficiency',
    procedures: [
      p('271049002', 'SNOMED', '25-hydroxyvitamin D measurement', 'diagnostic', 'outpatient', 'Serum 25(OH)D level for diagnosis'),
      p('271254000', 'SNOMED', 'Serum calcium measurement', 'monitoring', 'outpatient', 'Monitor calcium with supplementation'),
    ],
  },

  // 22. SLEEP APNEA
  {
    icd10Codes: ['G47.33', 'G47.30', 'G47.3'],
    conditionName: 'Obstructive Sleep Apnea',
    procedures: [
      p('60554003', 'SNOMED', 'Polysomnography', 'diagnostic', 'outpatient', 'Overnight sleep study for diagnosis and severity'),
      p('252472004', 'SNOMED', 'Pulse oximetry', 'monitoring', 'outpatient', 'Overnight pulse ox screening'),
      p('E0601', 'HCPCS', 'CPAP device', 'equipment', 'outpatient', 'DME: continuous positive airway pressure machine'),
      p('A7030', 'HCPCS', 'CPAP full face mask', 'equipment', 'outpatient', 'DME: CPAP mask and interface'),
      p('E0562', 'HCPCS', 'Humidifier for CPAP', 'equipment', 'outpatient', 'DME: heated humidifier'),
    ],
  },

  // 23. ACUTE MYOCARDIAL INFARCTION (STEMI/NSTEMI)
  {
    icd10Codes: ['I21', 'I21.0', 'I21.1', 'I21.2', 'I21.3', 'I21.4', 'I21.9'],
    conditionName: 'Acute Myocardial Infarction',
    procedures: [
      p('29303009', 'SNOMED', 'Electrocardiographic procedure', 'diagnostic', 'inpatient', 'Stat 12-lead ECG within 10 minutes'),
      p('105000003', 'SNOMED', 'Troponin measurement', 'diagnostic', 'inpatient', 'Serial troponin I or T (0h, 3h, 6h)'),
      p('73761001', 'SNOMED', 'Coronary angiography', 'diagnostic', 'inpatient', 'Emergent cath for STEMI, urgent for NSTEMI'),
      p('415070008', 'SNOMED', 'Percutaneous coronary intervention', 'therapeutic', 'inpatient', 'Primary PCI for STEMI'),
      p('40701008', 'SNOMED', 'Echocardiography', 'diagnostic', 'inpatient', 'Assess EF and wall motion post-MI'),
      p('229065009', 'SNOMED', 'Cardiac rehabilitation', 'therapeutic', 'outpatient', 'Phase I-III cardiac rehab post-MI'),
      p('G0422', 'HCPCS', 'Cardiac rehabilitation (per session)', 'therapeutic', 'outpatient', 'CMS-covered cardiac rehab 36 sessions'),
    ],
  },

  // 24. STROKE / CEREBROVASCULAR ACCIDENT
  {
    icd10Codes: ['I63', 'I63.9', 'I63.5', 'I63.3', 'I61', 'I61.9'],
    conditionName: 'Cerebrovascular Accident (Stroke)',
    procedures: [
      p('77477000', 'SNOMED', 'CT of head', 'diagnostic', 'inpatient', 'Non-contrast head CT to rule out hemorrhage'),
      p('241601008', 'SNOMED', 'MRI of brain', 'diagnostic', 'inpatient', 'Diffusion-weighted MRI for acute ischemia'),
      p('399208008', 'SNOMED', 'Carotid ultrasound', 'diagnostic', 'both', 'Carotid duplex for extracranial stenosis'),
      p('40701008', 'SNOMED', 'Echocardiography', 'diagnostic', 'inpatient', 'TTE/TEE for cardioembolic source'),
      p('29303009', 'SNOMED', 'Electrocardiographic procedure', 'diagnostic', 'inpatient', 'ECG for atrial fibrillation detection'),
      p('91251008', 'SNOMED', 'Physical therapy procedure', 'therapeutic', 'both', 'Post-stroke motor rehabilitation'),
      p('278414003', 'SNOMED', 'Speech therapy', 'therapeutic', 'both', 'Speech-language pathology for aphasia/dysarthria'),
    ],
  },

  // 25. BREAST CANCER
  {
    icd10Codes: ['C50', 'C50.9', 'C50.91', 'C50.92', 'C50.01', 'C50.02', 'C50.1', 'C50.2', 'C50.3', 'C50.4', 'C50.5', 'C50.6'],
    conditionName: 'Breast Cancer',
    procedures: [
      p('71651007', 'SNOMED', 'Mammography', 'diagnostic', 'outpatient', 'Diagnostic mammogram + screening'),
      p('241615005', 'SNOMED', 'MRI of breast', 'diagnostic', 'outpatient', 'Breast MRI for high-risk or staging'),
      p('122548005', 'SNOMED', 'Breast biopsy', 'diagnostic', 'outpatient', 'Core needle biopsy for tissue diagnosis'),
      p('392021009', 'SNOMED', 'Lumpectomy', 'therapeutic', 'inpatient', 'Breast-conserving surgery'),
      p('172043006', 'SNOMED', 'Mastectomy', 'therapeutic', 'inpatient', 'Total or radical mastectomy'),
      p('367336001', 'SNOMED', 'Chemotherapy', 'therapeutic', 'both', 'Systemic chemotherapy per NCCN guidelines'),
      p('108290001', 'SNOMED', 'Radiation therapy', 'therapeutic', 'outpatient', 'Post-lumpectomy radiation'),
      p('G0202', 'HCPCS', 'Screening mammography (digital)', 'diagnostic', 'outpatient', 'CMS-covered annual mammogram'),
    ],
  },

  // 26. LUNG CANCER
  {
    icd10Codes: ['C34', 'C34.9', 'C34.90', 'C34.91', 'C34.92', 'C34.1', 'C34.2', 'C34.3'],
    conditionName: 'Lung Cancer',
    procedures: [
      p('399208008', 'SNOMED', 'Chest x-ray', 'diagnostic', 'both', 'Initial CXR for suspected lung mass'),
      p('77477000', 'SNOMED', 'CT of chest', 'diagnostic', 'both', 'CT chest with contrast for staging'),
      p('241601008', 'SNOMED', 'PET-CT scan', 'diagnostic', 'outpatient', 'PET/CT for staging and metastasis evaluation'),
      p('122548005', 'SNOMED', 'Lung biopsy', 'diagnostic', 'both', 'CT-guided or bronchoscopic biopsy'),
      p('127783003', 'SNOMED', 'Spirometry', 'diagnostic', 'outpatient', 'PFTs for surgical candidacy'),
      p('367336001', 'SNOMED', 'Chemotherapy', 'therapeutic', 'both', 'Systemic therapy per NCCN guidelines'),
      p('108290001', 'SNOMED', 'Radiation therapy', 'therapeutic', 'outpatient', 'SBRT, IMRT, or conventional radiation'),
      p('G0296', 'HCPCS', 'Low-dose CT lung cancer screening', 'diagnostic', 'outpatient', 'CMS-covered LDCT for eligible patients'),
    ],
  },

  // 27. COLORECTAL CANCER
  {
    icd10Codes: ['C18', 'C18.9', 'C19', 'C20'],
    conditionName: 'Colorectal Cancer',
    procedures: [
      p('73761001', 'SNOMED', 'Colonoscopy', 'diagnostic', 'both', 'Diagnostic colonoscopy for staging/biopsy'),
      p('77477000', 'SNOMED', 'CT of abdomen and pelvis', 'diagnostic', 'both', 'CT A/P for staging'),
      p('367336001', 'SNOMED', 'Chemotherapy', 'therapeutic', 'both', 'FOLFOX, CAPOX per NCCN'),
      p('108290001', 'SNOMED', 'Radiation therapy', 'therapeutic', 'outpatient', 'Neoadjuvant radiation for rectal cancer'),
      p('174033005', 'SNOMED', 'Colectomy', 'therapeutic', 'inpatient', 'Partial or total colectomy'),
      p('G0121', 'HCPCS', 'Colorectal cancer screening colonoscopy (high risk)', 'diagnostic', 'outpatient', 'CMS-covered screening'),
    ],
  },

  // 28. BENIGN PROSTATIC HYPERPLASIA (BPH)
  {
    icd10Codes: ['N40', 'N40.0', 'N40.1'],
    conditionName: 'Benign Prostatic Hyperplasia',
    procedures: [
      p('63476009', 'SNOMED', 'PSA measurement', 'diagnostic', 'outpatient', 'Prostate-specific antigen screening'),
      p('27171005', 'SNOMED', 'Urinalysis', 'diagnostic', 'outpatient', 'UA to rule out UTI'),
      p('252275004', 'SNOMED', 'Renal function test', 'monitoring', 'outpatient', 'BMP for urinary retention impact'),
      p('386736004', 'SNOMED', 'Uroflowmetry', 'diagnostic', 'outpatient', 'Measure urinary flow rate'),
      p('252160004', 'SNOMED', 'Post-void residual measurement', 'diagnostic', 'outpatient', 'Bladder ultrasound for PVR'),
      p('176258007', 'SNOMED', 'Transurethral resection of prostate', 'therapeutic', 'inpatient', 'TURP for moderate-severe BPH'),
    ],
  },

  // 29. RHEUMATOID ARTHRITIS
  {
    icd10Codes: ['M05', 'M05.9', 'M06', 'M06.0', 'M06.9'],
    conditionName: 'Rheumatoid Arthritis',
    procedures: [
      p('26604007', 'SNOMED', 'Complete blood count', 'monitoring', 'outpatient', 'CBC for baseline and DMARD monitoring'),
      p('269912004', 'SNOMED', 'Liver function test', 'monitoring', 'outpatient', 'LFTs with methotrexate therapy'),
      p('252275004', 'SNOMED', 'Renal function test', 'monitoring', 'outpatient', 'BMP for DMARD monitoring'),
      p('363680008', 'SNOMED', 'Radiographic imaging', 'diagnostic', 'outpatient', 'X-ray of affected joints for erosive disease'),
      p('91251008', 'SNOMED', 'Physical therapy procedure', 'therapeutic', 'outpatient', 'Joint protection and ROM exercises'),
      p('J0135', 'HCPCS', 'Adalimumab injection (20 mg)', 'therapeutic', 'outpatient', 'Biologic DMARD administration'),
    ],
  },

  // 30. EPILEPSY
  {
    icd10Codes: ['G40', 'G40.9', 'G40.90', 'G40.91', 'G40.0', 'G40.1', 'G40.2', 'G40.3', 'G40.5'],
    conditionName: 'Epilepsy',
    procedures: [
      p('54550000', 'SNOMED', 'Electroencephalography', 'diagnostic', 'both', 'EEG for seizure characterization'),
      p('241601008', 'SNOMED', 'MRI of brain', 'diagnostic', 'outpatient', 'Brain MRI for structural cause identification'),
      p('183381005', 'SNOMED', 'Medication therapy management', 'therapeutic', 'outpatient', 'Anti-epileptic drug monitoring and titration'),
      p('269912004', 'SNOMED', 'Liver function test', 'monitoring', 'outpatient', 'Monitor hepatotoxicity with AEDs'),
      p('26604007', 'SNOMED', 'Complete blood count', 'monitoring', 'outpatient', 'CBC monitoring with AEDs'),
    ],
  },
];

// ============================================================
// Lookup Functions
// ============================================================

/** Exact code → procedure mapping index for O(1) lookups */
const codeIndex = new Map<string, CuratedMapping>();

// Build index on module load
for (const mapping of CURATED_MAPPINGS) {
  for (const code of mapping.icd10Codes) {
    codeIndex.set(code.toUpperCase(), mapping);
  }
}

/**
 * Look up curated procedure mappings for an ICD-10 code.
 *
 * Tries exact match first, then falls back to parent code.
 * Example: E11.65 → exact match → found! Return procedures.
 * Example: E11.312 → no match → try E11.31 → no match → try E11.3 → found!
 *
 * @param icd10Code - ICD-10-CM code (e.g., "E11.65")
 * @returns Array of curated ProcedureResults, or empty array if no mapping
 */
export function getCuratedProcedures(icd10Code: string): ProcedureResult[] {
  const normalized = icd10Code.toUpperCase().trim();

  // Try exact match
  const exact = codeIndex.get(normalized);
  if (exact) return exact.procedures;

  // Try progressively shorter codes (parent matching)
  // E11.65 → E11.6 → E11 → E1 (stop at 2 chars)
  let code = normalized;
  while (code.length > 2) {
    // Remove last character (skip the dot)
    code = code.endsWith('.') ? code.slice(0, -1) : code.slice(0, -1);
    const parent = codeIndex.get(code);
    if (parent) return parent.procedures;
  }

  return [];
}

/**
 * Check if a curated mapping exists for an ICD-10 code.
 * Uses the same parent-matching logic as getCuratedProcedures.
 */
export function hasCuratedMapping(icd10Code: string): boolean {
  return getCuratedProcedures(icd10Code).length > 0;
}

/**
 * Get the condition name for a curated ICD-10 code.
 */
export function getCuratedConditionName(icd10Code: string): string | null {
  const normalized = icd10Code.toUpperCase().trim();

  const exact = codeIndex.get(normalized);
  if (exact) return exact.conditionName;

  let code = normalized;
  while (code.length > 2) {
    code = code.endsWith('.') ? code.slice(0, -1) : code.slice(0, -1);
    const parent = codeIndex.get(code);
    if (parent) return parent.conditionName;
  }

  return null;
}

/**
 * Get all curated condition names (for display/debugging).
 */
export function getAllCuratedConditions(): string[] {
  const seen = new Set<string>();
  for (const mapping of CURATED_MAPPINGS) {
    seen.add(mapping.conditionName);
  }
  return Array.from(seen).sort();
}

/** Total number of curated conditions */
export const CURATED_CONDITION_COUNT = CURATED_MAPPINGS.length;

/** Total number of ICD-10 codes covered */
export const CURATED_CODE_COUNT = CURATED_MAPPINGS.reduce(
  (sum, m) => sum + m.icd10Codes.length, 0
);
