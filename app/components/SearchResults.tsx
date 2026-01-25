/**
 * SearchResults Component
 * =======================
 * 
 * Container component that displays search results in different states:
 * 1. Loading state - Shows a spinner while fetching data
 * 2. Error state - Shows error message if something went wrong
 * 3. Empty state - Shows message when no results found
 * 4. Results state - Shows list of ResultCard components
 * 
 * REACT CONCEPTS USED:
 * - Conditional rendering: Showing different UI based on state
 * - Array mapping: Converting data array to component array
 * - Props: Receiving data from parent component
 */

import { ICD10Result } from '../types/icd';
import ResultCard from './ResultCard';

// =============================================================================
// Props Interface
// =============================================================================

/**
 * Props that SearchResults expects to receive from its parent.
 */
interface SearchResultsProps {
  /** Array of ICD-10 results to display */
  results: ICD10Result[];
  
  /** Whether a search is currently in progress */
  isLoading: boolean;
  
  /** Error message if search failed, null otherwise */
  error: string | null;
  
  /** Whether a search has been performed (to show/hide "no results") */
  hasSearched: boolean;
}

// =============================================================================
// Component
// =============================================================================

/**
 * SearchResults - Displays search results with loading/error/empty states
 * 
 * @example
 * <SearchResults 
 *   results={searchResults}
 *   isLoading={false}
 *   error={null}
 *   hasSearched={true}
 * />
 */
export default function SearchResults({ 
  results, 
  isLoading, 
  error,
  hasSearched 
}: SearchResultsProps) {
  
  // =========================================================================
  // State 1: Loading
  // =========================================================================
  // Show loading indicator while fetching data
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        {/* Animated Spinner */}
        <div 
          className="
            w-10 h-10               /* 40px square */
            border-4                /* thick border */
            border-hv-light         /* light green background */
            border-t-hv-primary     /* green top border (creates spinner effect) */
            rounded-full            /* circle shape */
            animate-spin            /* Tailwind's spin animation */
          "
        />
        {/* Loading Text */}
        <p className="mt-4 text-gray-500 dark:text-gray-400">
          Searching ICD-10 codes...
        </p>
      </div>
    );
  }
  
  // =========================================================================
  // State 2: Error
  // =========================================================================
  // Show error message if the API call failed
  
  if (error) {
    return (
      <div 
        className="
          bg-red-50              /* light red background */
          dark:bg-red-900/20     /* dark mode: transparent red */
          border                 /* border */
          border-red-200         /* light red border */
          dark:border-red-800    /* darker in dark mode */
          rounded-lg             /* rounded corners */
          p-4                    /* padding */
          text-center            /* center text */
        "
      >
        {/* Error Icon */}
        <div className="text-red-500 text-2xl mb-2">⚠️</div>
        
        {/* Error Title */}
        <h3 className="text-red-700 dark:text-red-400 font-semibold">
          Search Failed
        </h3>
        
        {/* Error Message */}
        <p className="text-red-600 dark:text-red-300 text-sm mt-1">
          {error}
        </p>
        
        {/* Helpful Tip */}
        <p className="text-gray-500 dark:text-gray-400 text-xs mt-2">
          Please check your internet connection and try again.
        </p>
      </div>
    );
  }
  
  // =========================================================================
  // State 3: No Results (after search)
  // =========================================================================
  // Show "no results" message only if user has searched
  
  if (hasSearched && results.length === 0) {
    return (
      <div 
        className="
          bg-gray-50             /* light gray background */
          dark:bg-gray-800       /* dark mode background */
          rounded-lg             /* rounded corners */
          p-8                    /* generous padding */
          text-center            /* center text */
        "
      >
        {/* Empty Icon */}
        <div className="text-4xl mb-3">🔍</div>
        
        {/* Message */}
        <h3 className="text-gray-700 dark:text-gray-300 font-semibold">
          No Results Found
        </h3>
        
        {/* Helpful Tips */}
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
          Try searching for:
        </p>
        <ul className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          <li>• A condition name (e.g., &quot;diabetes&quot;, &quot;hypertension&quot;)</li>
          <li>• An ICD-10 code (e.g., &quot;E11&quot;, &quot;J06.9&quot;)</li>
        </ul>
      </div>
    );
  }
  
  // =========================================================================
  // State 4: Initial State (before any search)
  // =========================================================================
  // Show helpful prompt before user searches
  
  if (!hasSearched) {
    return (
      <div 
        className="
          bg-hv-light            /* light green background */
          dark:bg-hv-light       /* same in dark mode */
          rounded-lg             /* rounded corners */
          p-8                    /* generous padding */
          text-center            /* center text */
        "
      >
        {/* Welcome Icon */}
        <div className="text-4xl mb-3">🏥</div>
        
        {/* Welcome Message */}
        <h3 className="text-hv-dark font-semibold">
          Search ICD-10 Medical Codes
        </h3>
        
        {/* Instructions */}
        <p className="text-hv-secondary text-sm mt-2">
          Enter a condition name or ICD-10 code above to get started.
        </p>
      </div>
    );
  }
  
  // =========================================================================
  // State 5: Has Results
  // =========================================================================
  // Display the list of results as cards
  
  return (
    <div>
      {/* Results Count */}
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Found {results.length} result{results.length !== 1 ? 's' : ''}
      </p>
      
      {/* Results Grid
          - grid: CSS Grid layout
          - gap-3: 12px gap between cards
          - sm:grid-cols-2: 2 columns on small screens and up
          - lg:grid-cols-3: 3 columns on large screens
      */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {/* 
          map() iterates over each result and creates a ResultCard
          
          The syntax is: array.map((item, index) => <Component />)
          
          key={result.code} helps React track which items changed
          (React requires a unique "key" for list items)
        */}
        {results.map((result) => (
          <ResultCard
            key={result.code}  
            code={result.code}
            name={result.name}
          />
        ))}
      </div>
    </div>
  );
}
