/**
 * SearchBar Component
 * ===================
 * 
 * A modern, glass-morphism styled search bar with:
 * - Search icon inside input
 * - Gradient focus effects
 * - Loading state with spinner
 * - Smooth micro-interactions
 * - **Intelligent autocomplete** (Phase 4)
 * 
 * DESIGN FEATURES:
 * - Large, prominent input field
 * - Icon integration with lucide-react
 * - Button with shadow and scale effects
 * - Professional placeholder text
 * - Two-tier autocomplete (Local + NIH API)
 * 
 * AUTOCOMPLETE FEATURES:
 * - 300ms debounced suggestions
 * - Local medical term mappings (instant)
 * - NIH Conditions API fallback (cached 24hr)
 * - Keyboard navigation (↑↓ Enter Esc)
 * - Source transparency ([Local] vs [NIH])
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Loader2, Clock, Info } from 'lucide-react';
import { useAutocomplete, type AutocompleteSuggestion } from '../hooks/useAutocomplete';
import AutocompleteDropdown from './AutocompleteDropdown';

// =============================================================================
// Props Interface
// =============================================================================

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  recentSearches?: string[];  // Array of recent search terms
  /** Whether to auto-trigger search when selecting from autocomplete (default: false) */
  autoSearchOnSelect?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export default function SearchBar({ 
  onSearch, 
  isLoading = false,
  recentSearches = [],
  autoSearchOnSelect = false
}: SearchBarProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // ==========================================================================
  // Autocomplete Hook Integration
  // ==========================================================================
  
  /**
   * Handle autocomplete selection.
   * - Always populates the input with the medical term
   * - Optionally triggers search based on autoSearchOnSelect prop
   * - For NIH suggestions with ICD codes, searches by code for reliable results
   */
  const handleAutocompleteSelect = useCallback((medicalTerm: string, suggestion?: AutocompleteSuggestion) => {
    if (autoSearchOnSelect) {
      // For NIH suggestions with ICD codes, search by code for reliable results
      const searchTerm = suggestion?.source === 'nih' && suggestion?.icdHint 
        ? suggestion.icdHint 
        : medicalTerm;
      onSearch(searchTerm);
    }
    // Focus back to input after selection
    inputRef.current?.focus();
  }, [autoSearchOnSelect, onSearch]);
  
  const {
    inputValue: query,
    setInputValue: setQuery,
    suggestions,
    isLoading: isAutocompleteLoading,
    showDropdown,
    highlightedIndex,
    setHighlightedIndex,
    selectSuggestionDirect,
    clearSuggestions,
    handleKeyDown: handleAutocompleteKeyDown,
  } = useAutocomplete({
    onSelect: handleAutocompleteSelect,
    debounceMs: 300,
    minChars: 2,
    maxLocalResults: 5,
    maxNihResults: 5,
    nihTriggerThreshold: 3,
  });
  
  // ==========================================================================
  // Event Handlers
  // ==========================================================================
  
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
  
  // Cleanup blur timeout on unmount
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);
  
  /**
   * Handle form submission (Search button or Enter key).
   * Clears autocomplete and triggers full search.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearSuggestions();
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      onSearch(trimmedQuery);
    }
  };
  
  /**
   * Handle input change - delegates to autocomplete hook.
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };
  
  /**
   * Handle keyboard events on the input.
   * - Autocomplete navigation (↑↓ Enter Esc) is handled first
   * - If not handled, Enter submits the form normally
   */
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Let autocomplete handle navigation keys first
    const handled = handleAutocompleteKeyDown(e);
    if (handled) {
      e.preventDefault();
      return;
    }
    
    // Enter with no highlighted suggestion = submit form
    // (Form's onSubmit will handle this)
  };
  
  /**
   * Handle input blur - close autocomplete with delay.
   * The 150ms delay allows click events on dropdown items to fire first.
   */
  const handleInputBlur = () => {
    blurTimeoutRef.current = setTimeout(() => {
      clearSuggestions();
    }, 150);
  };
  
  /**
   * Handle input focus - cancel any pending blur.
   * This prevents the dropdown from closing if user quickly re-focuses.
   */
  const handleInputFocus = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* Search Input Container */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Input Wrapper with Icon and Autocomplete Dropdown */}
        <div className="relative flex-1">
          {/* Search Icon */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          
          {/* Input Field - Enhanced with Clinical Clarity style */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            onBlur={handleInputBlur}
            onFocus={handleInputFocus}
            placeholder="Search (e.g., heart attack, diabetes, I21.9)"
            disabled={isLoading}
            autoComplete="off"
            role="combobox"
            aria-expanded={showDropdown}
            aria-haspopup="listbox"
            aria-controls="autocomplete-listbox"
            aria-activedescendant={
              highlightedIndex >= 0 
                ? `autocomplete-listbox-option-${highlightedIndex}` 
                : undefined
            }
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
              focus:border-[#1976D2]
              focus:ring-4
              focus:ring-[#1976D2]/15
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
          
          {/* Autocomplete Dropdown */}
          {showDropdown && (
            <AutocompleteDropdown
              suggestions={suggestions}
              isLoading={isAutocompleteLoading}
              highlightedIndex={highlightedIndex}
              onSelect={selectSuggestionDirect}
              onHighlight={setHighlightedIndex}
              id="autocomplete-listbox"
            />
          )}
          
          {/* Info Tooltip Button (Step 8) */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2" ref={tooltipRef}>
            <button
              type="button"
              onClick={() => setShowTooltip(!showTooltip)}
              className="
                p-1.5
                rounded-full
                text-gray-400
                hover:text-[#1976D2]
                hover:bg-[#1976D2]/10
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
                    <span className="text-[#1976D2] font-bold">•</span>
                    <span>
                      <strong className="text-gray-700 dark:text-gray-300">Common terms:</strong>{' '}
                      Use everyday language like &ldquo;heart attack&rdquo; or &ldquo;broken bone&rdquo;
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#1976D2] font-bold">•</span>
                    <span>
                      <strong className="text-gray-700 dark:text-gray-300">Medical terms:</strong>{' '}
                      Search directly with &ldquo;myocardial infarction&rdquo; or &ldquo;fracture&rdquo;
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#1976D2] font-bold">•</span>
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
            from-[#1976D2]
            via-[#1565C0]
            to-[#0D47A1]
            hover:from-[#42A5F5]
            hover:via-[#1976D2]
            hover:to-[#0D47A1]
            text-white
            font-bold
            text-base
            sm:text-lg
            tracking-wide
            rounded-xl
            shadow-lg
            shadow-[#1976D2]/30
            hover:shadow-xl
            hover:shadow-[#1976D2]/40
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
                  from-[#1976D2]/10
                  to-[#0D47A1]/5
                  text-[#0D47A1]
                  dark:text-[#42A5F5]
                  hover:from-[#1976D2]/20
                  hover:to-[#0D47A1]/15
                  border
                  border-[#1976D2]/25
                  transition-all
                  duration-200
                  hover:scale-105
                  hover:shadow-sm
                  hover:shadow-[#1976D2]/20
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
            onClick={() => { setQuery('diabetes'); onSearch('diabetes'); }}
            className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            diabetes
          </button>
          <button 
            type="button"
            onClick={() => { setQuery('heart failure'); onSearch('heart failure'); }}
            className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
            title="Translates to: congestive heart failure"
          >
            heart failure
          </button>
          <button 
            type="button"
            onClick={() => { setQuery('COPD'); onSearch('COPD'); }}
            className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            COPD
          </button>
          <button 
            type="button"
            onClick={() => { setQuery('breast cancer'); onSearch('breast cancer'); }}
            className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            breast cancer
          </button>
          <button 
            type="button"
            onClick={() => { setQuery('chronic kidney disease'); onSearch('chronic kidney disease'); }}
            className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
            title="Translates to: chronic renal failure"
          >
            chronic kidney disease
          </button>
        </div>
      </div>
    </form>
  );
}
