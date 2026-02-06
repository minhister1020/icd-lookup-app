/**
 * ICD-10 Type Definitions
 * =======================
 * 
 * This file contains TypeScript interfaces (types) that describe
 * the shape of our data. Think of interfaces like blueprints that
 * tell TypeScript what properties an object should have.
 * 
 * Why use TypeScript interfaces?
 * - Catch errors before running the code
 * - Get autocomplete suggestions in your editor
 * - Make code self-documenting (you can see what data looks like)
 */

// =============================================================================
// ICD-10 Result Interface
// =============================================================================

/**
 * Represents a single ICD-10 code result from the API.
 * 
 * Example of an ICD10Result object:
 * {
 *   code: "E11.9",
 *   name: "Type 2 diabetes mellitus without complications"
 * }
 */
export interface ICD10Result {
  /** The ICD-10 code (e.g., "E11.9", "J06.9") */
  code: string;
  
  /** The human-readable condition name */
  name: string;
}

// =============================================================================
// API Response Interface
// =============================================================================

/**
 * Represents the raw response format from the ClinicalTables API.
 * 
 * The API returns data in an unusual array format:
 * [totalCount, codesArray, null, namesArray]
 * 
 * Example response for searching "diabetes":
 * [
 *   14,                                    // Index 0: Total number of results
 *   ["E10", "E10.1", "E11", ...],         // Index 1: Array of ICD-10 codes
 *   null,                                  // Index 2: Always null (unused)
 *   [["Type 1 diabetes"], ["Type 1..."]]  // Index 3: Array of name arrays
 * ]
 * 
 * Note: Each name is wrapped in its own array, like [["name1"], ["name2"]]
 * This is just how the API formats it - we'll unwrap this in our code.
 */
export type SearchResponse = [
  number,       // Total count of results
  string[],     // Array of ICD-10 codes
  null,         // Unused field (always null)
  string[][]    // Array of arrays containing names
];

// =============================================================================
// Search State Interface
// =============================================================================

/**
 * Represents the current state of a search operation.
 * 
 * This is used by React components to track:
 * - Whether we're currently loading data
 * - If an error occurred
 * - The search results (if successful)
 * 
 * Example states:
 * 
 * Initial state (before any search):
 * { isLoading: false, error: null, results: [] }
 * 
 * While searching:
 * { isLoading: true, error: null, results: [] }
 * 
 * After successful search:
 * { isLoading: false, error: null, results: [{code: "E11", name: "..."}] }
 * 
 * After failed search:
 * { isLoading: false, error: "Network error", results: [] }
 */
export interface SearchState {
  /** True when an API request is in progress */
  isLoading: boolean;
  
  /** Error message if something went wrong, null otherwise */
  error: string | null;
  
  /** Array of ICD-10 results from the search */
  results: ICD10Result[];
}

// =============================================================================
// Phase 3: Drug Result Interface (OpenFDA Integration)
// =============================================================================

/**
 * Represents a drug result from the OpenFDA API.
 * 
 * OpenFDA provides drug labeling information including:
 * - Brand and generic names
 * - What conditions the drug treats (indications)
 * - Safety warnings
 * 
 * Example DrugResult:
 * {
 *   brandName: "METFORMIN HYDROCHLORIDE",
 *   genericName: "Metformin Hydrochloride",
 *   manufacturer: "Sun Pharmaceutical Industries",
 *   indication: "Indicated for treatment of type 2 diabetes...",
 *   warnings: "May cause lactic acidosis..."
 * }
 */
export interface DrugResult {
  /** Brand name of the drug (e.g., "Tylenol", "Metformin") */
  brandName: string;

  /** Generic/chemical name (e.g., "Acetaminophen", "Metformin Hydrochloride") */
  genericName: string;

  /** Company that manufactures the drug */
  manufacturer: string;

  /** What conditions/diseases this drug treats (truncated for display) */
  indication: string;

  /** Optional safety warnings (truncated for display) */
  warnings?: string;

  // =========================================================================
  // UMLS/RxNorm Enrichment Fields (optional - populated when available)
  // =========================================================================

  /** RxNorm Concept Unique Identifier - used for UMLS lookups */
  rxcui?: string;

  /** Drug classifications from RxClass API (e.g., "GLP-1 Agonist", "SSRI") */
  drugClasses?: DrugClass[];

  /** Active ingredients - useful for combination drugs (e.g., Qsymia) */
  ingredients?: string[];

  /** Related drugs with different strengths/forms */
  relatedDrugs?: RelatedDrug[];

  /** Dosage form (e.g., "Tablet", "Injection", "Pen Injector") */
  dosageForm?: string;

  /** Drug strength (e.g., "10 MG", "0.25 MG/0.5 ML") */
  strength?: string;
}

/**
 * Drug classification information from UMLS RxClass API.
 *
 * Classification systems:
 * - EPC: Established Pharmacologic Class (most clinically useful)
 * - MOA: Mechanism of Action
 * - ATC: Anatomical Therapeutic Chemical
 * - PE: Physiologic Effect
 * - DISEASE: Disease-based classification
 */
export interface DrugClass {
  /** Unique identifier for the class */
  classId: string;

  /** Human-readable class name (e.g., "GLP-1 Agonist", "Biguanide") */
  className: string;

  /** Classification system type */
  classType: 'ATC' | 'EPC' | 'MOA' | 'PE' | 'DISEASE' | 'VA' | 'MESH' | string;
}

/**
 * Related drug information for showing alternative strengths/forms.
 * Used to display "Related" section in DrugCard.
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
 * State for tracking drug loading per ICD code.
 * 
 * We track loading state separately for each ICD code so that:
 * - Multiple cards can load drugs independently
 * - One card's error doesn't affect others
 */
export interface DrugLoadingState {
  /** True while fetching drugs from OpenFDA */
  isLoading: boolean;
  
  /** Error message if the API call failed */
  error: string | null;
  
  /** Array of drugs related to the condition */
  drugs: DrugResult[];
  
  /** Whether we've already fetched (for caching) */
  hasFetched: boolean;
}

// =============================================================================
// Helper Functions for API Search
// =============================================================================

/**
 * Extracts clean search terms from a medical condition name.
 * 
 * OpenFDA and ClinicalTrials APIs work better with simple search terms.
 * This function removes medical jargon and stop words to create a cleaner query.
 * 
 * @example
 * extractSearchTerms("Type 2 diabetes mellitus without complications")
 * // Returns: "diabetes" (filters out "type", "mellitus", "without", "complications")
 * 
 * @example
 * extractSearchTerms("Acute upper respiratory infection, unspecified")
 * // Returns: "acute upper respiratory infection"
 * 
 * @param conditionName - The full condition name from ICD-10
 * @returns Cleaned search terms suitable for API queries
 */
export function extractSearchTerms(conditionName: string): string {
  // Words that don't help with searching - medical qualifiers
  const stopWords = [
    'without', 'with', 'unspecified', 'specified', 'other',
    'mellitus', 'complications', 'complication', 'type',
    'acute', 'chronic', 'primary', 'secondary',
    'nos', 'nec', 'due', 'to', 'the', 'a', 'an', 'and', 'or',
    'left', 'right', 'bilateral', 'initial', 'subsequent',
    'episode', 'encounter', 'sequela'
  ];
  
  // Clean and split the condition name
  const words = conditionName
    .toLowerCase()
    .replace(/[,()]/g, '')    // Remove punctuation
    .replace(/\s+/g, ' ')      // Normalize whitespace
    .trim()
    .split(' ');
  
  // Filter out stop words and keep meaningful terms
  const meaningfulWords = words.filter(word => 
    word.length > 2 && !stopWords.includes(word)
  );
  
  // Take the first 3-4 meaningful words for a focused search
  const searchTerms = meaningfulWords.slice(0, 4).join(' ');
  
  // If we filtered too much, use the original (first 3 words)
  if (searchTerms.length < 3) {
    return conditionName.toLowerCase().split(' ').slice(0, 3).join(' ');
  }
  
  return searchTerms;
}

// =============================================================================
// Phase 3B: Clinical Trial Types (ClinicalTrials.gov Integration)
// =============================================================================

/**
 * Possible status values for a clinical trial.
 * 
 * - RECRUITING: Actively seeking participants (most relevant for users)
 * - ACTIVE_NOT_RECRUITING: Running but not taking new participants
 * - COMPLETED: Trial has finished
 * - TERMINATED: Trial was stopped early
 * - WITHDRAWN: Trial was withdrawn before enrollment began
 * - OTHER: Any other status (suspended, etc.)
 */
export type TrialStatus = 
  | 'RECRUITING' 
  | 'ACTIVE_NOT_RECRUITING' 
  | 'COMPLETED' 
  | 'TERMINATED' 
  | 'WITHDRAWN'
  | 'OTHER';

/**
 * Represents a location where a clinical trial is conducted.
 * 
 * ClinicalTrials.gov provides facility and geographic information
 * for each trial site.
 */
export interface TrialLocation {
  /** Name of the hospital, clinic, or research center */
  facility: string;
  
  /** City where the facility is located */
  city: string;
  
  /** State or region (may be empty for international sites) */
  state: string;
  
  /** Country name */
  country: string;
}

/**
 * Represents a clinical trial result from ClinicalTrials.gov API.
 * 
 * ClinicalTrials.gov is a database of clinical studies conducted
 * around the world. Each study has a unique NCT ID.
 * 
 * Example ClinicalTrialResult:
 * {
 *   nctId: "NCT05642013",
 *   title: "Study of New Diabetes Treatment",
 *   status: "RECRUITING",
 *   summary: "This study evaluates a new medication...",
 *   sponsor: "Pfizer",
 *   eligibility: "Adults aged 18-65 with Type 2 Diabetes",
 *   locations: [{ facility: "Johns Hopkins", city: "Baltimore", state: "MD", country: "United States" }],
 *   startDate: "2024-01-15"
 * }
 */
export interface ClinicalTrialResult {
  /** Unique trial identifier (e.g., "NCT05642013") */
  nctId: string;
  
  /** Brief title of the study */
  title: string;
  
  /** Current recruitment status */
  status: TrialStatus;
  
  /** Brief summary of what the trial is studying */
  summary: string;
  
  /** Organization sponsoring the trial */
  sponsor: string;
  
  /** Who can participate (age, conditions, etc.) */
  eligibility?: string;
  
  /** List of locations where the trial is conducted */
  locations?: TrialLocation[];
  
  /** When the trial started */
  startDate?: string;
}

/**
 * State for tracking trial loading per ICD code.
 */
export interface TrialLoadingState {
  /** True while fetching trials from ClinicalTrials.gov */
  isLoading: boolean;
  
  /** Error message if the API call failed */
  error: string | null;
  
  /** Array of trials related to the condition */
  trials: ClinicalTrialResult[];
  
  /** Whether we've already fetched (for caching) */
  hasFetched: boolean;
}

/**
 * Returns the appropriate color for a trial status.
 * Used for status badges in the UI.
 * 
 * @param status - The trial status
 * @returns Object with text and background color classes
 */
export function getTrialStatusColor(status: TrialStatus): { text: string; bg: string } {
  switch (status) {
    case 'RECRUITING':
      return { text: 'text-green-700 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' };
    case 'ACTIVE_NOT_RECRUITING':
      return { text: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' };
    case 'COMPLETED':
      return { text: 'text-gray-700 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-700' };
    case 'TERMINATED':
      return { text: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' };
    case 'WITHDRAWN':
      return { text: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' };
    default:
      return { text: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-700' };
  }
}

// =============================================================================
// Phase 4: Relevance Scoring Types (Intelligent Search Ranking)
// =============================================================================

/**
 * Breakdown of how a result's relevance score was calculated.
 * 
 * This provides transparency into why certain results rank higher.
 * Useful for debugging and potentially displaying to users.
 * 
 * Total possible score: 100 points
 * - Keyword: 35 points max
 * - Popularity: 40 points max
 * - Specificity: 15 points max
 * - Exactness: 10 points max
 * 
 * @example
 * {
 *   keyword: 30,      // "diabetes" found in name
 *   popularity: 40,   // E11.9 is a very common code
 *   specificity: 15,  // Has .9 suffix (commonly used)
 *   exactness: 0      // User didn't search by code
 * }
 */
export interface ScoreBreakdown {
  /** 
   * Keyword match quality (0-35 points)
   * - 35: Search term at start of name
   * - 30: Exact phrase anywhere in name
   * - 25: All search words present
   * - 15: Primary word present
   * - 5: Partial match
   */
  keyword: number;
  
  /** 
   * Code popularity based on real usage data (0-40 points)
   * - 40: Top 10 most common codes (I10, E11.9, etc.)
   * - 30: Top 50 common codes
   * - 20: Common code family (E11.*, I10.*, etc.)
   * - 5: Unknown/rare code
   */
  popularity: number;
  
  /** 
   * Code specificity balance (0-15 points)
   * - 15: One decimal digit (E11.9) - "sweet spot"
   * - 12: Two decimal digits (E11.65) - specific
   * - 8: Three+ decimal digits - very specific
   * - 5: No decimal (category code)
   */
  specificity: number;
  
  /** 
   * Bonus for exact code match (0-10 points)
   * - 10: Code starts with search term (user searched "E11")
   * - 5: Code contains search term
   * - 0: No code match
   */
  exactness: number;
}

/**
 * ICD-10 result enhanced with relevance scoring metadata.
 * 
 * Extends the base ICD10Result with scoring information
 * that helps rank results by clinical relevance.
 * 
 * @example
 * {
 *   code: "E11.9",
 *   name: "Type 2 diabetes mellitus without complications",
 *   score: 85,
 *   scoreBreakdown: { keyword: 30, popularity: 40, specificity: 15, exactness: 0 }
 * }
 */
export interface ScoredICD10Result extends ICD10Result {
  /** 
   * Total relevance score (0-100)
   * Higher = more relevant to the search query
   */
  score: number;
  
  /** Detailed breakdown of how the score was calculated */
  scoreBreakdown: ScoreBreakdown;
}

/**
 * Enhanced search response with pagination metadata.
 * 
 * Includes both the scored results and information about
 * the total available results for "Load More" functionality.
 * 
 * @example
 * {
 *   results: [{ code: "E11.9", name: "...", score: 85, ... }],
 *   totalCount: 847,
 *   displayedCount: 25,
 *   hasMore: true
 * }
 */
export interface SearchResultsWithMeta {
  /** Scored and sorted results (highest score first) */
  results: ScoredICD10Result[];
  
  /** Total number of matching results in the API */
  totalCount: number;
  
  /** Number of results currently displayed */
  displayedCount: number;
  
  /** Whether more results can be loaded */
  hasMore: boolean;
}

// =============================================================================
// Phase 5: Common Terms Translation Types
// =============================================================================

/**
 * Result of translating a user's search query from common
 * language to medical terminology.
 * 
 * The translation system allows users to search with everyday
 * terms like "heart attack" and automatically converts them
 * to proper medical terminology like "myocardial infarction".
 * 
 * @example
 * // Translated query
 * {
 *   searchTerms: ["myocardial infarction", "heart attack"],
 *   wasTranslated: true,
 *   originalTerm: "heart attack",
 *   medicalTerm: "myocardial infarction",
 *   matchedTerm: "heart attack",
 *   icdHint: "I21",
 *   message: "Showing results for 'myocardial infarction'"
 * }
 * 
 * @example
 * // Non-translated query (already medical or unknown)
 * {
 *   searchTerms: ["diabetes mellitus"],
 *   wasTranslated: false,
 *   originalTerm: "diabetes mellitus"
 * }
 */
export interface TranslationResult {
  /** 
   * Terms to actually search in the API.
   * 
   * When translated: [medicalTerm, originalTerm] for maximum coverage
   * When not translated: [originalTerm] only
   */
  searchTerms: string[];
  
  /** 
   * Whether the query was translated to a medical term.
   * 
   * True: A mapping was found and applied
   * False: No mapping found, searching original term
   */
  wasTranslated: boolean;
  
  /** 
   * The user's original search query (as entered).
   * 
   * Always preserved for display and fallback purposes.
   */
  originalTerm: string;
  
  /** 
   * The medical terminology equivalent (if translated).
   * 
   * Only present when wasTranslated is true.
   * Example: "myocardial infarction" for "heart attack"
   */
  medicalTerm?: string;
  
  /** 
   * The specific term that was matched in our mappings.
   * 
   * Useful for partial matches where only part of the query matched.
   * Example: For query "severe heart attack", matchedTerm = "heart attack"
   */
  matchedTerm?: string;
  
  /** 
   * ICD-10 code family hint for relevance scoring.
   * 
   * Used to boost scores for codes in the expected family.
   * Example: "I21" for heart attack codes
   */
  icdHint?: string;
  
  /** 
   * User-friendly message for UI display.
   * 
   * Example: "Showing results for 'myocardial infarction'"
   */
  message?: string;
  
  /**
   * Source of the translation (Phase 6).
   * 
   * - 'term-mapper': From curated termMappings.ts (Tier 2)
   * - 'conditions-api': From NIH Conditions API (Tier 1)
   * 
   * Useful for debugging and understanding which tier provided the translation.
   */
  source?: 'term-mapper' | 'conditions-api';
}

/**
 * Enhanced search results that include translation metadata.
 * 
 * Extends SearchResultsWithMeta to add information about
 * any term translation that occurred during the search.
 * 
 * @example
 * {
 *   results: [...],
 *   totalCount: 847,
 *   displayedCount: 25,
 *   hasMore: true,
 *   translation: {
 *     wasTranslated: true,
 *     originalTerm: "heart attack",
 *     medicalTerm: "myocardial infarction",
 *     message: "Showing results for 'myocardial infarction'"
 *   }
 * }
 */
export interface SearchResultsWithTranslation extends SearchResultsWithMeta {
  /** 
   * Translation metadata (if query was translated).
   * 
   * Present when the search involved term translation.
   * Use this to display translation notices in the UI.
   */
  translation?: TranslationResult;
}

// =============================================================================
// Phase 6: Favorites & History Types
// =============================================================================

/**
 * Represents a favorited ICD-10 code with metadata.
 * 
 * Stores enough information to display the favorite and
 * allow quick searching without re-fetching from API.
 * 
 * @example
 * {
 *   code: "E11.9",
 *   name: "Type 2 diabetes mellitus without complications",
 *   favoritedAt: "2026-01-26T10:30:00.000Z",
 *   searchQuery: "diabetes",
 *   score: 85,
 *   category: "E"
 * }
 */
export interface FavoriteICD {
  /** The ICD-10 code (e.g., "E11.9") */
  code: string;
  
  /** The condition name */
  name: string;
  
  /** When this was favorited (ISO timestamp) */
  favoritedAt: string;
  
  /** Optional: The search query that led to this result */
  searchQuery?: string;
  
  /** Optional: Relevance score when favorited */
  score?: number;
  
  /** 
   * Code category (first letter of the code).
   * Used for color coding and grouping.
   * 
   * Common categories:
   * - E: Endocrine/Metabolic (diabetes)
   * - I: Circulatory (heart conditions)
   * - J: Respiratory (lung conditions)
   * - F: Mental/Behavioral
   * - M: Musculoskeletal
   * - S: Injuries
   */
  category?: string;
}

/**
 * Enhanced search history entry with timestamps and result context.
 * 
 * Unlike the simple string[] for recent searches, this provides
 * rich context about when and what was searched.
 * 
 * @example
 * {
 *   query: "diabetes",
 *   searchedAt: "2026-01-26T10:30:00.000Z",
 *   resultCount: 847,
 *   topResultCode: "E11.9",
 *   topResultName: "Type 2 diabetes mellitus without complications"
 * }
 */
export interface SearchHistoryEntry {
  /** The search query */
  query: string;
  
  /** When the search was performed (ISO timestamp) */
  searchedAt: string;
  
  /** Number of results returned */
  resultCount: number;
  
  /** Optional: Top result code (for quick reference) */
  topResultCode?: string;
  
  /** Optional: Top result name */
  topResultName?: string;
}

// =============================================================================
// Phase 7: Category Grouping Types (ICD-10 Chapter Organization)
// =============================================================================

/**
 * Represents an ICD-10-CM chapter (body system/disease category).
 * 
 * ICD-10 codes are organized into 21 chapters based on body system
 * or disease type. The first letter(s) of a code determine its chapter.
 * 
 * @example
 * {
 *   id: 4,
 *   name: "Endocrine, Nutritional and Metabolic Diseases",
 *   shortName: "Endocrine",
 *   codeRange: "E00-E89",
 *   color: "emerald"
 * }
 * 
 * Chapter Examples:
 * - E11.9 → Chapter 4 (Endocrine) - Diabetes
 * - I10   → Chapter 9 (Circulatory) - Hypertension
 * - J06.9 → Chapter 10 (Respiratory) - Upper respiratory infection
 */
export interface ChapterInfo {
  /** 
   * Chapter number (1-21 per ICD-10-CM specification).
   * 0 is reserved for "Unknown" fallback.
   */
  id: number;
  
  /** 
   * Full official chapter name.
   * Example: "Endocrine, Nutritional and Metabolic Diseases"
   */
  name: string;
  
  /** 
   * Short display name for compact UI.
   * Example: "Endocrine"
   */
  shortName: string;
  
  /** 
   * The code range covered by this chapter.
   * Example: "E00-E89"
   */
  codeRange: string;
  
  /** 
   * Tailwind color name for visual distinction.
   * Used to generate classes like "bg-{color}-100", "text-{color}-700"
   * Example: "emerald", "red", "sky"
   */
  color: string;
}

/**
 * A group of search results belonging to the same ICD-10 chapter.
 * 
 * Used to organize search results by body system/disease category
 * for better navigation and understanding.
 * 
 * @example
 * {
 *   chapter: { id: 4, shortName: "Endocrine", ... },
 *   results: [
 *     { code: "E11.9", name: "Type 2 diabetes...", score: 95 },
 *     { code: "E10.9", name: "Type 1 diabetes...", score: 82 }
 *   ],
 *   topScore: 95,
 *   isExpanded: true
 * }
 */
export interface CategoryGroup {
  /** Chapter metadata for this group */
  chapter: ChapterInfo;
  
  /** 
   * Results belonging to this chapter.
   * Sorted by relevance score (highest first).
   */
  results: ScoredICD10Result[];
  
  /** 
   * Highest relevance score in this group.
   * Used to sort categories (most relevant category first).
   */
  topScore: number;
  
  /** 
   * Whether this category is expanded in the UI.
   * Default: true for first category, false for others.
   */
  isExpanded: boolean;
}

/**
 * Complete grouped search results ready for UI rendering.
 * 
 * Contains all results organized by chapter with summary statistics.
 * 
 * @example
 * {
 *   categories: [
 *     { chapter: { shortName: "Endocrine" }, results: [...], topScore: 95 },
 *     { chapter: { shortName: "Circulatory" }, results: [...], topScore: 72 }
 *   ],
 *   totalResults: 25,
 *   totalCategories: 3
 * }
 */
export interface GroupedSearchResults {
  /** 
   * Array of category groups.
   * Sorted by topScore descending (most relevant category first).
   */
  categories: CategoryGroup[];
  
  /** Total number of results across all categories */
  totalResults: number;
  
  /** Number of distinct chapters/categories */
  totalCategories: number;
}

// =============================================================================
// NIH Medical Conditions API Types
// =============================================================================

/**
 * Result from the NIH Medical Conditions API.
 * 
 * This API provides rich medical condition data including:
 * - Clinical names (primary_name)
 * - Consumer-friendly names (consumer_name)
 * - Synonyms for common language search
 * - Direct ICD-10 code mappings
 * 
 * @example
 * // Query: "heart attack"
 * {
 *   found: true,
 *   primaryName: "Myocardial infarction",
 *   consumerName: "Heart attack (myocardial infarction)",
 *   synonyms: ["heart attack", "MI", "coronary"],
 *   icdCodes: [
 *     { code: "I21.9", name: "Acute myocardial infarction, unspecified" },
 *     { code: "I21.4", name: "Non-ST elevation (NSTEMI) myocardial infarction" }
 *   ],
 *   searchTermsToUse: ["Myocardial infarction", "heart attack"]
 * }
 */
export interface ConditionsAPIResult {
  /** Whether the Conditions API found matching results */
  found: boolean;
  
  /** 
   * Clinical/medical term for the condition.
   * Example: "Myocardial infarction"
   */
  primaryName: string | null;
  
  /** 
   * Consumer-friendly term.
   * Example: "Heart attack (myocardial infarction)"
   */
  consumerName: string | null;
  
  /** 
   * All synonyms found across matched conditions.
   * Includes common language terms and medical abbreviations.
   */
  synonyms: string[];
  
  /** 
   * Direct ICD-10 codes from the Conditions API.
   * These can be used directly without calling the ICD-10 API.
   */
  icdCodes: Array<{
    code: string;
    name: string;
  }>;
  
  /** 
   * Terms to use for ICD-10 API search if expansion is needed.
   * Usually [primaryName, originalQuery] for maximum coverage.
   */
  searchTermsToUse: string[];
  
  /** 
   * Related condition names found.
   * Useful for showing "Did you mean..." suggestions.
   */
  relatedConditions?: string[];
}

// =============================================================================
// Helper Functions for Category Colors
// =============================================================================

/**
 * Returns the category color for an ICD code.
 * Used for visual grouping in favorites and mind map.
 * 
 * @param code - The ICD-10 code (e.g., "E11.9")
 * @returns Object with text and background color classes
 */
export function getCategoryColor(code: string): { text: string; bg: string; border: string } {
  const category = code.charAt(0).toUpperCase();
  
  switch (category) {
    case 'E': // Endocrine, nutritional, metabolic (diabetes, etc.)
      return { 
        text: 'text-emerald-700 dark:text-emerald-400', 
        bg: 'bg-emerald-100 dark:bg-emerald-900/30',
        border: 'border-emerald-200 dark:border-emerald-800'
      };
    case 'I': // Circulatory (heart, blood pressure)
      return { 
        text: 'text-red-700 dark:text-red-400', 
        bg: 'bg-red-100 dark:bg-red-900/30',
        border: 'border-red-200 dark:border-red-800'
      };
    case 'J': // Respiratory (lung, breathing)
      return { 
        text: 'text-sky-700 dark:text-sky-400', 
        bg: 'bg-sky-100 dark:bg-sky-900/30',
        border: 'border-sky-200 dark:border-sky-800'
      };
    case 'F': // Mental and behavioral
      return { 
        text: 'text-purple-700 dark:text-purple-400', 
        bg: 'bg-purple-100 dark:bg-purple-900/30',
        border: 'border-purple-200 dark:border-purple-800'
      };
    case 'M': // Musculoskeletal (bones, muscles)
      return { 
        text: 'text-amber-700 dark:text-amber-400', 
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        border: 'border-amber-200 dark:border-amber-800'
      };
    case 'S': // Injuries
      return { 
        text: 'text-orange-700 dark:text-orange-400', 
        bg: 'bg-orange-100 dark:bg-orange-900/30',
        border: 'border-orange-200 dark:border-orange-800'
      };
    case 'K': // Digestive
      return { 
        text: 'text-yellow-700 dark:text-yellow-400', 
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        border: 'border-yellow-200 dark:border-yellow-800'
      };
    case 'N': // Genitourinary
      return { 
        text: 'text-pink-700 dark:text-pink-400', 
        bg: 'bg-pink-100 dark:bg-pink-900/30',
        border: 'border-pink-200 dark:border-pink-800'
      };
    case 'Z': // Factors influencing health
      return { 
        text: 'text-teal-700 dark:text-teal-400', 
        bg: 'bg-teal-100 dark:bg-teal-900/30',
        border: 'border-teal-200 dark:border-teal-800'
      };
    default:
      return { 
        text: 'text-gray-700 dark:text-gray-400', 
        bg: 'bg-gray-100 dark:bg-gray-700',
        border: 'border-gray-200 dark:border-gray-700'
      };
  }
}

// ============================================================
// PROCEDURE CODE TYPES (Path 2: Procedure Code Mapping)
// ============================================================

/** Which coding system a procedure belongs to */
export type ProcedureCodeSystem = 'SNOMED' | 'ICD10PCS' | 'HCPCS';

/** Clinical category for grouping procedures in the UI */
export type ProcedureCategory =
  | 'diagnostic'    // Tests, imaging, labs (e.g., blood glucose test)
  | 'therapeutic'   // Treatments, surgeries (e.g., insulin pump insertion)
  | 'monitoring'    // Ongoing tracking (e.g., A1c measurement)
  | 'equipment'     // DME and supplies (e.g., glucose monitor, test strips)
  | 'other';        // Catch-all for unclassified procedures

/** Where the procedure data originated */
export type ProcedureSource = 'curated' | 'umls_api' | 'clinicaltables' | 'ai_generated';

/** A single procedure result displayed in the UI */
export interface ProcedureResult {
  /** The procedure code (e.g., "A1C" for HCPCS, "0BJ08ZZ" for ICD-10-PCS) */
  code: string;
  /** Which coding system this code belongs to */
  codeSystem: ProcedureCodeSystem;
  /** Human-readable name/description of the procedure */
  description: string;
  /** Clinical category for UI grouping */
  category: ProcedureCategory;
  /** Relevance score 0-10 (10 = most relevant to the diagnosis) */
  relevanceScore: number;
  /** Where this data came from — for transparency */
  source: ProcedureSource;
  /** Why this procedure relates to the diagnosis (shown on hover/expand) */
  clinicalRationale?: string;
  /** Whether this is typically inpatient, outpatient, or both */
  setting?: 'inpatient' | 'outpatient' | 'both';
  /** HCPCS-specific: whether the code is currently active */
  isActive?: boolean;
}

/** Response shape from the procedure validation API endpoint */
export interface ProcedureValidationResponse {
  procedures: ProcedureResult[];
  /** Which sources actually returned data */
  sourcesQueried: ProcedureSource[];
  /** Total time in ms for the full pipeline */
  processingTimeMs: number;
  /** Whether any API calls failed (graceful degradation) */
  hadErrors: boolean;
  /** Human-readable error messages if hadErrors is true */
  errorMessages?: string[];
}

/** Cache entry shape for procedure lookups — matches drug caching pattern */
export interface CachedProcedures {
  data: ProcedureResult[];
  timestamp: number;
}
