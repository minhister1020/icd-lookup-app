/**
 * SearchBar Component
 * ===================
 * 
 * A modern, glass-morphism styled search bar with:
 * - Search icon inside input
 * - Gradient focus effects
 * - Loading state with spinner
 * - Smooth micro-interactions
 * 
 * DESIGN FEATURES:
 * - Large, prominent input field
 * - Icon integration with lucide-react
 * - Button with shadow and scale effects
 * - Professional placeholder text
 */

'use client';

import { useState } from 'react';
import { Search, Loader2, Clock, X } from 'lucide-react';

// =============================================================================
// Props Interface
// =============================================================================

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  recentSearches?: string[];  // Array of recent search terms
}

// =============================================================================
// Component
// =============================================================================

export default function SearchBar({ 
  onSearch, 
  isLoading = false,
  recentSearches = []
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      onSearch(trimmedQuery);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };
  
  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* Search Input Container */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Input Wrapper with Icon */}
        <div className="relative flex-1">
          {/* Search Icon */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          
          {/* Input Field */}
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Search conditions (e.g., diabetes, hypertension, E11.9)"
            disabled={isLoading}
            className="
              w-full
              pl-12
              pr-4
              py-4
              text-base
              sm:text-lg
              border-2
              border-gray-200
              dark:border-gray-600
              rounded-xl
              bg-white
              dark:bg-gray-800
              text-gray-900
              dark:text-gray-100
              placeholder-gray-400
              dark:placeholder-gray-500
              focus:outline-none
              focus:border-[#00D084]
              focus:ring-4
              focus:ring-[#00D084]/10
              disabled:bg-gray-100
              dark:disabled:bg-gray-700
              disabled:cursor-not-allowed
              transition-all
              duration-200
            "
          />
        </div>
        
        {/* Search Button */}
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="
            flex
            items-center
            justify-center
            gap-2
            px-8
            py-4
            bg-gradient-to-r
            from-[#00D084]
            to-[#00A66C]
            hover:from-[#00C077]
            hover:to-[#009660]
            text-white
            font-semibold
            text-base
            sm:text-lg
            rounded-xl
            shadow-lg
            shadow-[#00D084]/25
            hover:shadow-xl
            hover:shadow-[#00D084]/30
            disabled:from-gray-300
            disabled:to-gray-400
            disabled:shadow-none
            disabled:cursor-not-allowed
            dark:disabled:from-gray-600
            dark:disabled:to-gray-700
            active:scale-95
            transition-all
            duration-200
          "
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Searching...</span>
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              <span>Search</span>
            </>
          )}
        </button>
      </div>
      
      {/* Suggestions Section */}
      <div className="mt-4 space-y-3">
        {/* Recent Searches - Only show if there are recent searches */}
        {recentSearches.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <Clock className="w-3.5 h-3.5" />
              Recent:
            </span>
            {recentSearches.map((term) => (
              <button 
                key={term}
                type="button"
                onClick={() => { 
                  setQuery(term);
                  onSearch(term);  // Immediately search when clicking recent
                }}
                className="
                  px-3 
                  py-1 
                  rounded-full 
                  bg-[#00D084]/10 
                  text-[#00A66C] 
                  dark:text-[#00D084]
                  hover:bg-[#00D084]/20 
                  border
                  border-[#00D084]/20
                  transition-all
                  duration-200
                  hover:scale-105
                  text-sm
                  font-medium
                "
              >
                {term}
              </button>
            ))}
          </div>
        )}
        
        {/* Quick Try Suggestions */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span>Try:</span>
          <button 
            type="button"
            onClick={() => { setQuery('diabetes'); }}
            className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-[#00D084]/10 hover:text-[#00A66C] dark:hover:text-[#00D084] transition-colors"
          >
            diabetes
          </button>
          <button 
            type="button"
            onClick={() => { setQuery('hypertension'); }}
            className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-[#00D084]/10 hover:text-[#00A66C] dark:hover:text-[#00D084] transition-colors"
          >
            hypertension
          </button>
          <button 
            type="button"
            onClick={() => { setQuery('E11.9'); }}
            className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-[#00D084]/10 hover:text-[#00A66C] dark:hover:text-[#00D084] transition-colors font-mono"
          >
            E11.9
          </button>
          <button 
            type="button"
            onClick={() => { setQuery('anxiety'); }}
            className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-[#00D084]/10 hover:text-[#00A66C] dark:hover:text-[#00D084] transition-colors"
          >
            anxiety
          </button>
        </div>
      </div>
    </form>
  );
}
