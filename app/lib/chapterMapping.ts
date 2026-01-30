/**
 * ICD-10-CM Chapter Mapping
 * =========================
 * 
 * This file provides a mapping from ICD-10-CM codes to their chapters
 * (body systems / disease categories). ICD-10-CM has 21 official chapters.
 * 
 * Why do we need this?
 * The ClinicalTables API only returns code + name, not the chapter.
 * We derive the chapter from the code's first letter(s) and numeric range.
 * 
 * Tricky cases:
 * - Letter "D" spans TWO chapters:
 *   - D00-D49 = Chapter 2 (Neoplasms)
 *   - D50-D89 = Chapter 3 (Blood diseases)
 * 
 * - Letter "H" spans TWO chapters:
 *   - H00-H59 = Chapter 7 (Eye diseases)
 *   - H60-H95 = Chapter 8 (Ear diseases)
 * 
 * - Letter "O" has special codes:
 *   - O00-O9A = Chapter 15 (Pregnancy) - includes O9A!
 * 
 * @example Usage:
 * import { getChapter } from './chapterMapping';
 * 
 * const chapter = getChapter("E11.9");
 * // Returns: { id: 4, name: "Endocrine...", shortName: "Endocrine", ... }
 * 
 * const chapter2 = getChapter("D55.0");
 * // Returns: { id: 3, name: "Blood...", shortName: "Blood", ... }
 * // (D55 > D49, so it's Blood, not Neoplasms)
 */

import { ChapterInfo } from '../types/icd';

// =============================================================================
// ICD-10-CM Chapter Definitions
// =============================================================================

/**
 * All 21 ICD-10-CM chapters with metadata.
 * 
 * Chapter 0 is a special "Unknown" fallback for malformed codes.
 * 
 * Color assignments are chosen for visual distinction and clinical intuition:
 * - Red tones: Serious conditions (circulatory, neoplasms)
 * - Green tones: Common conditions (endocrine, health factors)
 * - Blue tones: Respiratory, perinatal
 * - Purple tones: Mental health, nervous system
 */
export const ICD10_CHAPTERS: ChapterInfo[] = [
  // Chapter 0: Unknown/Fallback (not a real ICD-10 chapter)
  {
    id: 0,
    name: "Unknown Category",
    shortName: "Unknown",
    codeRange: "---",
    color: "gray"
  },
  
  // Chapter 1: Infectious Diseases (A00-B99)
  {
    id: 1,
    name: "Certain Infectious and Parasitic Diseases",
    shortName: "Infectious",
    codeRange: "A00-B99",
    color: "red"
  },
  
  // Chapter 2: Neoplasms (C00-D49)
  {
    id: 2,
    name: "Neoplasms",
    shortName: "Neoplasms",
    codeRange: "C00-D49",
    color: "pink"
  },
  
  // Chapter 3: Blood Diseases (D50-D89)
  {
    id: 3,
    name: "Diseases of the Blood and Blood-forming Organs",
    shortName: "Blood",
    codeRange: "D50-D89",
    color: "rose"
  },
  
  // Chapter 4: Endocrine/Metabolic (E00-E89)
  {
    id: 4,
    name: "Endocrine, Nutritional and Metabolic Diseases",
    shortName: "Endocrine",
    codeRange: "E00-E89",
    color: "emerald"
  },
  
  // Chapter 5: Mental Disorders (F01-F99)
  {
    id: 5,
    name: "Mental, Behavioral and Neurodevelopmental Disorders",
    shortName: "Mental",
    codeRange: "F01-F99",
    color: "violet"
  },
  
  // Chapter 6: Nervous System (G00-G99)
  {
    id: 6,
    name: "Diseases of the Nervous System",
    shortName: "Nervous",
    codeRange: "G00-G99",
    color: "purple"
  },
  
  // Chapter 7: Eye (H00-H59)
  {
    id: 7,
    name: "Diseases of the Eye and Adnexa",
    shortName: "Eye",
    codeRange: "H00-H59",
    color: "cyan"
  },
  
  // Chapter 8: Ear (H60-H95)
  {
    id: 8,
    name: "Diseases of the Ear and Mastoid Process",
    shortName: "Ear",
    codeRange: "H60-H95",
    color: "teal"
  },
  
  // Chapter 9: Circulatory (I00-I99)
  {
    id: 9,
    name: "Diseases of the Circulatory System",
    shortName: "Circulatory",
    codeRange: "I00-I99",
    color: "red"
  },
  
  // Chapter 10: Respiratory (J00-J99)
  {
    id: 10,
    name: "Diseases of the Respiratory System",
    shortName: "Respiratory",
    codeRange: "J00-J99",
    color: "sky"
  },
  
  // Chapter 11: Digestive (K00-K95)
  {
    id: 11,
    name: "Diseases of the Digestive System",
    shortName: "Digestive",
    codeRange: "K00-K95",
    color: "amber"
  },
  
  // Chapter 12: Skin (L00-L99)
  {
    id: 12,
    name: "Diseases of the Skin and Subcutaneous Tissue",
    shortName: "Skin",
    codeRange: "L00-L99",
    color: "orange"
  },
  
  // Chapter 13: Musculoskeletal (M00-M99)
  {
    id: 13,
    name: "Diseases of the Musculoskeletal System and Connective Tissue",
    shortName: "Musculoskeletal",
    codeRange: "M00-M99",
    color: "lime"
  },
  
  // Chapter 14: Genitourinary (N00-N99)
  {
    id: 14,
    name: "Diseases of the Genitourinary System",
    shortName: "Genitourinary",
    codeRange: "N00-N99",
    color: "fuchsia"
  },
  
  // Chapter 15: Pregnancy (O00-O9A)
  {
    id: 15,
    name: "Pregnancy, Childbirth and the Puerperium",
    shortName: "Pregnancy",
    codeRange: "O00-O9A",
    color: "pink"
  },
  
  // Chapter 16: Perinatal (P00-P96)
  {
    id: 16,
    name: "Certain Conditions Originating in the Perinatal Period",
    shortName: "Perinatal",
    codeRange: "P00-P96",
    color: "blue"
  },
  
  // Chapter 17: Congenital (Q00-Q99)
  {
    id: 17,
    name: "Congenital Malformations, Deformations and Chromosomal Abnormalities",
    shortName: "Congenital",
    codeRange: "Q00-Q99",
    color: "indigo"
  },
  
  // Chapter 18: Symptoms/Signs (R00-R99)
  {
    id: 18,
    name: "Symptoms, Signs and Abnormal Clinical and Laboratory Findings",
    shortName: "Symptoms",
    codeRange: "R00-R99",
    color: "slate"
  },
  
  // Chapter 19: Injuries (S00-T88)
  {
    id: 19,
    name: "Injury, Poisoning and Certain Other Consequences of External Causes",
    shortName: "Injuries",
    codeRange: "S00-T88",
    color: "yellow"
  },
  
  // Chapter 20: External Causes (V00-Y99)
  {
    id: 20,
    name: "External Causes of Morbidity",
    shortName: "External Causes",
    codeRange: "V00-Y99",
    color: "gray"
  },
  
  // Chapter 21: Health Factors (Z00-Z99)
  {
    id: 21,
    name: "Factors Influencing Health Status and Contact with Health Services",
    shortName: "Health Factors",
    codeRange: "Z00-Z99",
    color: "green"
  }
];

// =============================================================================
// Chapter Lookup by ID
// =============================================================================

/**
 * Map for O(1) chapter lookup by ID.
 */
const CHAPTER_BY_ID = new Map<number, ChapterInfo>(
  ICD10_CHAPTERS.map(chapter => [chapter.id, chapter])
);

/**
 * Get a chapter by its ID.
 * 
 * @param id - Chapter ID (0-21)
 * @returns ChapterInfo or the Unknown chapter if not found
 * 
 * @example
 * getChapterById(4) // Returns Endocrine chapter
 * getChapterById(99) // Returns Unknown chapter
 */
export function getChapterById(id: number): ChapterInfo {
  return CHAPTER_BY_ID.get(id) || ICD10_CHAPTERS[0]; // Fallback to Unknown
}

// =============================================================================
// Main Chapter Lookup Function
// =============================================================================

/**
 * Determines the ICD-10-CM chapter for a given code.
 * 
 * The chapter is determined by the first letter and sometimes the
 * numeric portion of the code. This handles the special cases where
 * a single letter spans multiple chapters (D and H).
 * 
 * @param code - The ICD-10-CM code (e.g., "E11.9", "D55.0", "H65.0")
 * @returns The ChapterInfo for this code's chapter
 * 
 * @example
 * // Standard cases - one letter = one chapter
 * getChapter("E11.9")  // Chapter 4: Endocrine (E00-E89)
 * getChapter("I10")    // Chapter 9: Circulatory (I00-I99)
 * getChapter("J06.9")  // Chapter 10: Respiratory (J00-J99)
 * 
 * @example
 * // Special case: Letter D spans two chapters
 * getChapter("D30.5")  // Chapter 2: Neoplasms (D00-D49) - D30 < D50
 * getChapter("D55.0")  // Chapter 3: Blood (D50-D89) - D55 >= D50
 * 
 * @example
 * // Special case: Letter H spans two chapters
 * getChapter("H02.0")  // Chapter 7: Eye (H00-H59) - H02 < H60
 * getChapter("H65.0")  // Chapter 8: Ear (H60-H95) - H65 >= H60
 * 
 * @example
 * // Edge cases
 * getChapter("")       // Chapter 0: Unknown
 * getChapter("XYZ")    // Chapter 0: Unknown
 */
export function getChapter(code: string): ChapterInfo {
  // Guard: Empty or invalid code
  if (!code || typeof code !== 'string' || code.length === 0) {
    return ICD10_CHAPTERS[0]; // Unknown
  }
  
  // Extract first letter and normalize to uppercase
  const firstLetter = code.charAt(0).toUpperCase();
  
  // Extract numeric part (characters 1-2) for special cases
  // E.g., "D55.0" → "55", "H02.0" → "02"
  const numericPart = code.substring(1, 3).replace(/\D/g, '');
  const numericValue = parseInt(numericPart, 10) || 0;
  
  // Determine chapter based on first letter
  switch (firstLetter) {
    // Chapter 1: Infectious Diseases (A00-B99)
    case 'A':
    case 'B':
      return ICD10_CHAPTERS[1];
    
    // Chapter 2: Neoplasms (C00-D49)
    case 'C':
      return ICD10_CHAPTERS[2];
    
    // Letter D: Split between Chapter 2 (Neoplasms) and Chapter 3 (Blood)
    // D00-D49 = Neoplasms, D50-D89 = Blood
    case 'D':
      if (numericValue < 50) {
        return ICD10_CHAPTERS[2]; // Neoplasms (D00-D49)
      } else {
        return ICD10_CHAPTERS[3]; // Blood (D50-D89)
      }
    
    // Chapter 4: Endocrine (E00-E89)
    case 'E':
      return ICD10_CHAPTERS[4];
    
    // Chapter 5: Mental (F01-F99)
    case 'F':
      return ICD10_CHAPTERS[5];
    
    // Chapter 6: Nervous (G00-G99)
    case 'G':
      return ICD10_CHAPTERS[6];
    
    // Letter H: Split between Chapter 7 (Eye) and Chapter 8 (Ear)
    // H00-H59 = Eye, H60-H95 = Ear
    case 'H':
      if (numericValue < 60) {
        return ICD10_CHAPTERS[7]; // Eye (H00-H59)
      } else {
        return ICD10_CHAPTERS[8]; // Ear (H60-H95)
      }
    
    // Chapter 9: Circulatory (I00-I99)
    case 'I':
      return ICD10_CHAPTERS[9];
    
    // Chapter 10: Respiratory (J00-J99)
    case 'J':
      return ICD10_CHAPTERS[10];
    
    // Chapter 11: Digestive (K00-K95)
    case 'K':
      return ICD10_CHAPTERS[11];
    
    // Chapter 12: Skin (L00-L99)
    case 'L':
      return ICD10_CHAPTERS[12];
    
    // Chapter 13: Musculoskeletal (M00-M99)
    case 'M':
      return ICD10_CHAPTERS[13];
    
    // Chapter 14: Genitourinary (N00-N99)
    case 'N':
      return ICD10_CHAPTERS[14];
    
    // Chapter 15: Pregnancy (O00-O9A)
    case 'O':
      return ICD10_CHAPTERS[15];
    
    // Chapter 16: Perinatal (P00-P96)
    case 'P':
      return ICD10_CHAPTERS[16];
    
    // Chapter 17: Congenital (Q00-Q99)
    case 'Q':
      return ICD10_CHAPTERS[17];
    
    // Chapter 18: Symptoms (R00-R99)
    case 'R':
      return ICD10_CHAPTERS[18];
    
    // Chapter 19: Injuries (S00-T88)
    case 'S':
    case 'T':
      return ICD10_CHAPTERS[19];
    
    // Chapter 20: External Causes (V00-Y99)
    case 'V':
    case 'W':
    case 'X':
    case 'Y':
      return ICD10_CHAPTERS[20];
    
    // Chapter 21: Health Factors (Z00-Z99)
    case 'Z':
      return ICD10_CHAPTERS[21];
    
    // Unknown letter - return Unknown chapter
    default:
      return ICD10_CHAPTERS[0];
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get all chapters (excluding Unknown).
 * Useful for displaying a legend or filter options.
 * 
 * @returns Array of all 21 real ICD-10 chapters
 */
export function getAllChapters(): ChapterInfo[] {
  return ICD10_CHAPTERS.slice(1); // Skip the Unknown chapter at index 0
}

/**
 * Get the Tailwind color classes for a chapter.
 * 
 * @param chapter - The chapter info
 * @returns Object with text, bg, and border color classes
 * 
 * @example
 * const colors = getChapterColors(getChapter("E11.9"));
 * // Returns: {
 * //   text: "text-emerald-700 dark:text-emerald-400",
 * //   bg: "bg-emerald-100 dark:bg-emerald-900/30",
 * //   border: "border-emerald-300 dark:border-emerald-700"
 * // }
 */
export function getChapterColors(chapter: ChapterInfo): { 
  text: string; 
  bg: string; 
  border: string;
  accent: string;
} {
  const color = chapter.color;
  
  return {
    text: `text-${color}-700 dark:text-${color}-400`,
    bg: `bg-${color}-100 dark:bg-${color}-900/30`,
    border: `border-${color}-300 dark:border-${color}-700`,
    accent: `bg-${color}-500`
  };
}

/**
 * Check if a code belongs to a specific chapter.
 * 
 * @param code - The ICD-10 code
 * @param chapterId - The chapter ID to check against
 * @returns True if the code belongs to that chapter
 * 
 * @example
 * isInChapter("E11.9", 4) // true (Endocrine)
 * isInChapter("E11.9", 9) // false (not Circulatory)
 */
export function isInChapter(code: string, chapterId: number): boolean {
  return getChapter(code).id === chapterId;
}
