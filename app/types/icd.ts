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
