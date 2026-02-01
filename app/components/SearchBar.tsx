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

import { useState, useRef, useEffect } from 'react';
import { Search, Loader2, Clock, Info } from 'lucide-react';

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
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  // Close tooltip when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setShowTooltip(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
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
          
          {/* Input Field - Enhanced with Clinical Clarity style */}
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Search (e.g., heart attack, diabetes, I21.9)"
            disabled={isLoading}
            style={{ fontFamily: 'var(--font-body)' }}
            className="
              w-full
              pl-12
              pr-12
              py-4
              text-base
              sm:text-lg
              font-medium
              border-2
              border-gray-200/80
              dark:border-gray-600/60
              rounded-xl
              bg-white/80
              dark:bg-gray-800/80
              text-gray-900
              dark:text-gray-100
              placeholder-gray-400
              dark:placeholder-gray-500
              focus:outline-none
              focus:border-[#00D084]
              focus:ring-4
              focus:ring-[#00D084]/15
              focus:bg-white
              dark:focus:bg-gray-800
              disabled:bg-gray-100
              dark:disabled:bg-gray-700
              disabled:cursor-not-allowed
              transition-all
              duration-300
              shadow-sm
              hover:shadow-md
              hover:border-gray-300
              dark:hover:border-gray-500
            "
          />
          
          {/* Info Tooltip Button (Step 8) */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2" ref={tooltipRef}>
            <button
              type="button"
              onClick={() => setShowTooltip(!showTooltip)}
              className="
                p-1.5
                rounded-full
                text-gray-400
                hover:text-[#00D084]
                hover:bg-[#00D084]/10
                transition-colors
                duration-200
              "
              aria-label="Search tips"
            >
              <Info className="w-4 h-4" />
            </button>
            
            {/* Tooltip Dropdown */}
            {showTooltip && (
              <div className="
                absolute
                right-0
                top-full
                mt-2
                w-72
                p-4
                bg-white
                dark:bg-gray-800
                rounded-xl
                shadow-xl
                border
                border-gray-200
                dark:border-gray-700
                z-50
                animate-in fade-in slide-in-from-top-2
                duration-200
              ">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-sm mb-2">
                  Search Tips
                </h4>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-[#00D084] font-bold">•</span>
                    <span>
                      <strong className="text-gray-700 dark:text-gray-300">Common terms:</strong>{' '}
                      Use everyday language like &ldquo;heart attack&rdquo; or &ldquo;broken bone&rdquo;
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#00D084] font-bold">•</span>
                    <span>
                      <strong className="text-gray-700 dark:text-gray-300">Medical terms:</strong>{' '}
                      Search directly with &ldquo;myocardial infarction&rdquo; or &ldquo;fracture&rdquo;
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#00D084] font-bold">•</span>
                    <span>
                      <strong className="text-gray-700 dark:text-gray-300">ICD codes:</strong>{' '}
                      Enter codes like &ldquo;E11.9&rdquo; or &ldquo;I21&rdquo;
                    </span>
                  </li>
                </ul>
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    We automatically translate common terms to medical terminology for better results.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Search Button - Enhanced with Clinical Clarity style */}
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          style={{ fontFamily: 'var(--font-display)' }}
          className="
            flex
            items-center
            justify-center
            gap-2.5
            px-8
            py-4
            bg-gradient-to-r
            from-[#00D084]
            via-[#00C077]
            to-[#00A66C]
            hover:from-[#00E590]
            hover:via-[#00D084]
            hover:to-[#00A66C]
            text-white
            font-bold
            text-base
            sm:text-lg
            tracking-wide
            rounded-xl
            shadow-lg
            shadow-[#00D084]/30
            hover:shadow-xl
            hover:shadow-[#00D084]/40
            hover:-translate-y-0.5
            disabled:from-gray-300
            disabled:to-gray-400
            disabled:shadow-none
            disabled:cursor-not-allowed
            disabled:hover:translate-y-0
            dark:disabled:from-gray-600
            dark:disabled:to-gray-700
            active:scale-[0.98]
            active:shadow-md
            transition-all
            duration-200
            ring-2
            ring-white/20
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
            <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 font-medium">
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
                  px-3.5
                  py-1.5
                  rounded-full
                  bg-gradient-to-r
                  from-[#00D084]/10
                  to-[#00A66C]/5
                  text-[#00A66C]
                  dark:text-[#00D084]
                  hover:from-[#00D084]/20
                  hover:to-[#00A66C]/15
                  border
                  border-[#00D084]/25
                  transition-all
                  duration-200
                  hover:scale-105
                  hover:shadow-sm
                  hover:shadow-[#00D084]/20
                  active:scale-[0.98]
                  text-sm
                  font-semibold
                "
              >
                {term}
              </button>
            ))}
          </div>
        )}
        
        {/* Quick Try Suggestions - Mix of common terms and medical terms */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span>Try:</span>
          {/* Common terms (will be translated) */}
          <button 
            type="button"
            onClick={() => { setQuery('heart attack'); onSearch('heart attack'); }}
            className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            title="Translates to: myocardial infarction"
          >
            heart attack
          </button>
          <button 
            type="button"
            onClick={() => { setQuery('broken bone'); onSearch('broken bone'); }}
            className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            title="Translates to: fracture"
          >
            broken bone
          </button>
          {/* Medical terms (no translation needed) */}
          <button 
            type="button"
            onClick={() => { setQuery('diabetes'); onSearch('diabetes'); }}
            className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-[#00D084]/10 hover:text-[#00A66C] dark:hover:text-[#00D084] transition-colors"
          >
            diabetes
          </button>
          <button 
            type="button"
            onClick={() => { setQuery('I21.9'); onSearch('I21.9'); }}
            className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-[#00D084]/10 hover:text-[#00A66C] dark:hover:text-[#00D084] transition-colors font-mono"
            title="ICD-10 code for acute myocardial infarction"
          >
            I21.9
          </button>
          <button 
            type="button"
            onClick={() => { setQuery('high blood pressure'); onSearch('high blood pressure'); }}
            className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            title="Translates to: hypertension"
          >
            high blood pressure
          </button>
        </div>
      </div>
    </form>
  );
}
