/**
 * SearchBar Component
 * ===================
 * 
 * A search input field with a button for searching ICD-10 codes.
 * 
 * Features:
 * - Text input for entering search queries
 * - Search button with HealthVerity styling
 * - Keyboard support (Enter key triggers search)
 * - Loading state (disables button while searching)
 * 
 * REACT CONCEPTS USED:
 * - useState: Managing the input value
 * - Event handlers: Responding to user actions
 * - Callbacks: Passing functions as props
 * - Controlled components: React controls the input value
 * 
 * "use client" DIRECTIVE:
 * This tells Next.js that this component uses client-side features
 * (like useState, event handlers). Without this, Next.js assumes
 * the component is server-rendered only.
 */

'use client';

import { useState } from 'react';

// =============================================================================
// Props Interface
// =============================================================================

/**
 * Props that SearchBar expects from its parent component.
 */
interface SearchBarProps {
  /** 
   * Callback function called when user submits a search.
   * The parent component provides this function to handle the search.
   * 
   * @param query - The search term entered by the user
   */
  onSearch: (query: string) => void;
  
  /** Whether a search is currently in progress (disables the button) */
  isLoading?: boolean;  // The ? makes this optional (defaults to false)
}

// =============================================================================
// Component
// =============================================================================

/**
 * SearchBar - Input field and button for searching ICD-10 codes
 * 
 * @example
 * <SearchBar 
 *   onSearch={(query) => console.log('Searching:', query)}
 *   isLoading={false}
 * />
 */
export default function SearchBar({ onSearch, isLoading = false }: SearchBarProps) {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  
  /**
   * useState hook to track the current input value.
   * 
   * useState returns an array with two items:
   * - query: The current value
   * - setQuery: Function to update the value
   * 
   * When setQuery is called, React re-renders the component with the new value.
   */
  const [query, setQuery] = useState('');
  
  // ---------------------------------------------------------------------------
  // Event Handlers
  // ---------------------------------------------------------------------------
  
  /**
   * Handles the search form submission.
   * 
   * @param e - The form event
   */
  const handleSubmit = (e: React.FormEvent) => {
    // Prevent the default form behavior (page refresh)
    e.preventDefault();
    
    // Only search if there's something to search
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      // Call the onSearch function provided by the parent
      onSearch(trimmedQuery);
    }
  };
  
  /**
   * Handles changes to the input field.
   * 
   * This is called every time the user types a character.
   * We update our state to match what's in the input.
   * 
   * @param e - The input change event
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // e.target.value is the current text in the input field
    setQuery(e.target.value);
  };
  
  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  
  return (
    // Using a <form> allows us to handle Enter key automatically
    <form onSubmit={handleSubmit} className="w-full">
      {/* 
        Container for input and button
        - flex: Flexbox layout (items in a row)
        - gap-2: 8px gap between items
      */}
      <div className="flex gap-2">
        {/* Search Input */}
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search for conditions (e.g., diabetes, E11.9)"
          disabled={isLoading}
          className="
            /* Size & Layout */
            flex-1                 /* take up remaining space */
            px-4                   /* horizontal padding */
            py-3                   /* vertical padding */
            
            /* Border & Shape */
            border-2               /* 2px border */
            border-gray-200        /* light gray border */
            dark:border-gray-600   /* darker in dark mode */
            rounded-lg             /* rounded corners */
            
            /* Background */
            bg-white               /* white background */
            dark:bg-gray-800       /* dark background in dark mode */
            
            /* Text */
            text-gray-900          /* dark text */
            dark:text-gray-100     /* light text in dark mode */
            placeholder-gray-400   /* gray placeholder text */
            
            /* Focus State */
            focus:outline-none     /* remove default outline */
            focus:border-hv-primary /* green border on focus */
            focus:ring-2           /* add a ring effect */
            focus:ring-hv-primary/20 /* semi-transparent green ring */
            
            /* Disabled State */
            disabled:bg-gray-100   /* gray background when disabled */
            disabled:cursor-not-allowed
            
            /* Animation */
            transition-colors      /* smooth color transitions */
            duration-200           /* 200ms transition */
          "
        />
        
        {/* Search Button */}
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="
            /* Size & Layout */
            px-6                   /* horizontal padding */
            py-3                   /* vertical padding */
            
            /* Background */
            bg-hv-primary          /* HealthVerity green */
            hover:bg-hv-secondary  /* darker green on hover */
            
            /* Text */
            text-white             /* white text */
            font-semibold          /* semi-bold font */
            
            /* Shape */
            rounded-lg             /* rounded corners */
            
            /* Disabled State */
            disabled:bg-gray-300   /* gray when disabled */
            disabled:cursor-not-allowed
            dark:disabled:bg-gray-600
            
            /* Animation */
            transition-colors      /* smooth color transitions */
            duration-200           /* 200ms transition */
            
            /* Hover Effect (when not disabled) */
            hover:shadow-lg        /* shadow on hover */
            active:scale-95        /* slightly smaller when clicked */
          "
        >
          {/* Show different text based on loading state */}
          {isLoading ? (
            // Loading state: show spinner and text
            <span className="flex items-center gap-2">
              {/* Mini spinner */}
              <span 
                className="
                  w-4 h-4 
                  border-2 
                  border-white/30 
                  border-t-white 
                  rounded-full 
                  animate-spin
                "
              />
              Searching...
            </span>
          ) : (
            // Normal state: just show "Search"
            'Search'
          )}
        </button>
      </div>
      
      {/* Helper Text */}
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        💡 Tip: You can search by condition name or ICD-10 code
      </p>
    </form>
  );
}
