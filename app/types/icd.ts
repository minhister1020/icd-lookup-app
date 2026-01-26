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
// View Mode Type (Phase 2: Mind Map)
// =============================================================================

/**
 * ViewMode - Controls how search results are displayed.
 * 
 * - 'list': Traditional card grid layout (default)
 * - 'mindmap': Interactive React Flow node visualization
 * 
 * Used by the ViewToggle component to switch between views.
 */
export type ViewMode = 'list' | 'mindmap';

// =============================================================================
// React Flow Node Types (Phase 2: Mind Map)
// =============================================================================

/**
 * Data structure passed to each ICD node in the mind map.
 * 
 * React Flow nodes have a `data` property that can contain
 * any custom data. We use it to pass ICD information.
 */
export interface IcdNodeData {
  /** The ICD-10 code (e.g., "E11.9") */
  code: string;
  
  /** The condition name */
  name: string;
  
  /** Optional: Category for grouping (e.g., "E11" for diabetes codes) */
  category?: string;
}

/**
 * Position type for React Flow nodes.
 * 
 * x: horizontal position on canvas
 * y: vertical position on canvas
 */
export interface NodePosition {
  x: number;
  y: number;
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
