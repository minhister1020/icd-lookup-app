/**
 * Home Page - ICD Mind Map Lookup Tool
 * =====================================
 * 
 * This is the main page of our application. It brings together all the
 * components we built and manages the application state.
 * 
 * WHAT THIS PAGE DOES:
 * 1. Displays the app title
 * 2. Shows a search bar for users to enter queries
 * 3. Calls the ClinicalTables API when user searches
 * 4. Displays the results (or loading/error states)
 * 
 * KEY REACT CONCEPTS USED:
 * - "use client": Tells Next.js this component runs in the browser
 * - useState: Manages component state (data that can change)
 * - Event handlers: Functions that respond to user actions
 * - Lifting state up: Parent component manages state for children
 * 
 * ARCHITECTURE PATTERN:
 * This page follows a common React pattern called "Container/Presentational":
 * - This page (Container): Manages data and logic
 * - Child components (Presentational): Just display data passed to them
 */

'use client';
// ☝️ IMPORTANT: This directive tells Next.js that this component needs to run
// in the browser (client-side). We need this because:
// - useState hook only works in the browser
// - Event handlers (like onClick) only work in the browser
// Without this, Next.js would try to render this on the server and fail.

import { useState } from 'react';
// ☝️ useState is a React Hook that lets us add "state" to our component.
// State = data that can change over time and trigger re-renders.

// Import our custom components
import SearchBar from './components/SearchBar';
import SearchResults from './components/SearchResults';

// Import our API helper function
import { searchICD10 } from './lib/api';

// Import TypeScript types for type safety
import { ICD10Result } from './types/icd';

// =============================================================================
// Main Component
// =============================================================================

/**
 * Home - The main page component
 * 
 * This component:
 * 1. Manages all the state for the search feature
 * 2. Handles the search logic (calling the API)
 * 3. Passes data down to child components
 */
export default function Home() {
  // ---------------------------------------------------------------------------
  // State Management
  // ---------------------------------------------------------------------------
  
  /**
   * STATE: Search Results
   * 
   * useState<ICD10Result[]>([]) means:
   * - <ICD10Result[]> = TypeScript type (array of ICD10Result objects)
   * - ([]) = Initial value is an empty array
   * 
   * Returns: [currentValue, setterFunction]
   * - results: The current array of search results
   * - setResults: Function to update the results
   */
  const [results, setResults] = useState<ICD10Result[]>([]);
  
  /**
   * STATE: Loading Indicator
   * 
   * Tracks whether we're currently fetching data from the API.
   * - true = API request in progress, show loading spinner
   * - false = No request in progress
   */
  const [isLoading, setIsLoading] = useState(false);
  
  /**
   * STATE: Error Message
   * 
   * Stores any error message if the API request fails.
   * - null = No error
   * - string = Error message to display
   */
  const [error, setError] = useState<string | null>(null);
  
  /**
   * STATE: Has Searched Flag
   * 
   * Tracks whether the user has performed at least one search.
   * This helps us show different UI:
   * - false = Show welcome message
   * - true = Show results (or "no results" if empty)
   */
  const [hasSearched, setHasSearched] = useState(false);
  
  // ---------------------------------------------------------------------------
  // Event Handlers
  // ---------------------------------------------------------------------------
  
  /**
   * handleSearch - Called when user submits a search
   * 
   * This is an "async" function because we need to wait for the API response.
   * The "async/await" pattern makes asynchronous code look synchronous.
   * 
   * FLOW:
   * 1. User types "diabetes" and clicks Search
   * 2. SearchBar calls onSearch("diabetes")
   * 3. This function runs:
   *    - Sets loading to true (shows spinner)
   *    - Calls the API
   *    - Updates results or error
   *    - Sets loading to false (hides spinner)
   * 4. React re-renders with the new state
   * 
   * @param query - The search term from the SearchBar
   */
  const handleSearch = async (query: string) => {
    // Step 1: Reset state and show loading
    // ------------------------------------
    setIsLoading(true);      // Show loading spinner
    setError(null);          // Clear any previous errors
    setHasSearched(true);    // Mark that user has searched
    
    // Step 2: Call the API
    // --------------------
    try {
      // await pauses execution until searchICD10() completes
      // This prevents the UI from showing results before we have them
      const searchResults = await searchICD10(query);
      
      // Debug: Log the API response to see what data we're getting
      console.log('API returned:', searchResults);
      
      // Step 3a: Success - Update results
      // ---------------------------------
      setResults(searchResults);
      
    } catch (err) {
      // Step 3b: Error - Show error message
      // -----------------------------------
      // If searchICD10() throws an error, we catch it here
      
      // Clear any old results
      setResults([]);
      
      // Set the error message
      // Check if err is an Error object to get its message
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      // Step 4: Always hide loading (success or error)
      // -----------------------------------------------
      // "finally" runs whether try succeeded or catch ran
      setIsLoading(false);
    }
  };
  
  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  
  return (
    <div 
      className="
        min-h-screen          /* minimum height = full viewport */
        bg-gray-50            /* light gray background */
        dark:bg-gray-900      /* dark background in dark mode */
      "
    >
      {/* Main Container - Centers content with max width */}
      <main 
        className="
          max-w-4xl             /* maximum width: 896px */
          mx-auto               /* center horizontally */
          px-4                  /* horizontal padding */
          py-8                  /* vertical padding */
          sm:px-6               /* more padding on small screens+ */
          lg:px-8               /* even more on large screens */
        "
      >
        {/* ================================================================= */}
        {/* Header Section */}
        {/* ================================================================= */}
        <header className="text-center mb-8">
          {/* App Icon/Logo */}
          <div 
            className="
              text-5xl              /* large emoji */
              mb-4                  /* margin bottom */
            "
          >
            🏥
          </div>
          
          {/* App Title */}
          <h1 
            className="
              text-3xl              /* large text */
              sm:text-4xl           /* larger on small screens+ */
              font-bold             /* bold text */
              text-gray-900         /* dark text */
              dark:text-white       /* white in dark mode */
              mb-2                  /* small margin bottom */
            "
          >
            Bobby&apos;s ICD Mind Map Tool
          </h1>
          
          {/* Subtitle */}
          <p 
            className="
              text-gray-600         /* medium gray text */
              dark:text-gray-400    /* lighter in dark mode */
              text-lg               /* slightly larger text */
            "
          >
            Search and explore ICD-10 medical condition codes
          </p>
        </header>
        
        {/* ================================================================= */}
        {/* Search Section */}
        {/* ================================================================= */}
        <section 
          className="
            bg-white              /* white background */
            dark:bg-gray-800      /* dark background in dark mode */
            rounded-xl            /* rounded corners (extra large) */
            shadow-sm             /* subtle shadow */
            p-6                   /* padding */
            mb-8                  /* margin bottom */
          "
        >
          {/* 
            SearchBar Component
            -------------------
            We pass two props:
            - onSearch: The function to call when user searches
            - isLoading: Whether to show loading state
            
            When user clicks Search, SearchBar calls onSearch(query)
            which triggers our handleSearch function above.
          */}
          <SearchBar 
            onSearch={handleSearch}
            isLoading={isLoading}
          />
        </section>
        
        {/* ================================================================= */}
        {/* Results Section */}
        {/* ================================================================= */}
        <section>
          {/* 
            SearchResults Component
            -----------------------
            We pass all the state this component needs to display:
            - results: Array of ICD10Result objects
            - isLoading: Shows spinner while fetching
            - error: Shows error message if API failed
            - hasSearched: Controls whether to show welcome vs results
            
            SearchResults will automatically show the right UI based on
            which combination of these props it receives.
          */}
          <SearchResults
            results={results}
            isLoading={isLoading}
            error={error}
            hasSearched={hasSearched}
          />
        </section>
        
        {/* ================================================================= */}
        {/* Footer */}
        {/* ================================================================= */}
        <footer 
          className="
            mt-12                 /* margin top */
            pt-6                  /* padding top */
            border-t              /* top border */
            border-gray-200       /* light gray border */
            dark:border-gray-700  /* darker in dark mode */
            text-center           /* center text */
          "
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Data provided by{' '}
            <a 
              href="https://clinicaltables.nlm.nih.gov/" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-hv-primary hover:text-hv-secondary underline"
            >
              ClinicalTables API
            </a>
            {' '}(National Library of Medicine)
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Phase 1 - ICD-10 Search Interface
          </p>
        </footer>
      </main>
    </div>
  );
}
