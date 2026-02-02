/**
 * useAutocomplete Hook
 * ====================
 * 
 * Provides intelligent autocomplete suggestions for medical term search.
 * Uses a two-tier approach:
 * 
 * 1. LOCAL (instant, <50ms): Searches termMappings.ts for acronyms & synonyms
 * 2. NIH API (fast, cached): Fallback to NIH Conditions API if <3 local results
 * 
 * FEATURES:
 * - 300ms debounce on input
 * - Cancels pending requests on new input
 * - Skips autocomplete for ICD-10 codes (e.g., "E11.9")
 * - Handles loading states
 * - Deduplicates results from both sources
 * - Source transparency: marks each suggestion as [Local] or [NIH]
 * 
 * @example
 * ```tsx
 * const {
 *   suggestions,
 *   isLoading,
 *   showDropdown,
 *   selectSuggestion,
 *   clearSuggestions,
 * } = useAutocomplete({
 *   onSelect: (term) => setSearchQuery(term),
 * });
 * 
 * <input onChange={(e) => handleInputChange(e.target.value)} />
 * {showDropdown && <AutocompleteDropdown suggestions={suggestions} />}
 * ```
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  filterMappingsForAutocomplete, 
  type AutocompleteSuggestion as LocalSuggestion 
} from '../lib/termMappings';
import { searchConditionsAPI, isICD10Code } from '../lib/conditionsApi';

// =============================================================================
// Types
// =============================================================================

/**
 * Source of the autocomplete suggestion.
 */
export type SuggestionSource = 'local' | 'nih';

/**
 * A single autocomplete suggestion.
 */
export interface AutocompleteSuggestion {
  /** Unique identifier for React keys */
  id: string;
  /** Display term (what user typed or would type) */
  displayTerm: string;
  /** Medical terminology equivalent */
  medicalTerm: string;
  /** ICD-10 code hint (if available) */
  icdHint?: string;
  /** Source of this suggestion */
  source: SuggestionSource;
  /** Relevance score for sorting */
  score: number;
}

/**
 * Options for the useAutocomplete hook.
 */
export interface UseAutocompleteOptions {
  /** Callback when a suggestion is selected */
  onSelect?: (medicalTerm: string, suggestion: AutocompleteSuggestion) => void;
  /** Debounce delay in milliseconds (default: 300) */
  debounceMs?: number;
  /** Delay before fetching NIH results if local results are sparse (default: 500) */
  nihDelayMs?: number;
  /** Minimum characters before showing suggestions (default: 2) */
  minChars?: number;
  /** Maximum local results to show (default: 5) */
  maxLocalResults?: number;
  /** Maximum NIH results to show (default: 5) */
  maxNihResults?: number;
  /** Threshold for triggering NIH fetch (default: 3) */
  nihTriggerThreshold?: number;
}

/**
 * Return type of the useAutocomplete hook.
 */
export interface UseAutocompleteReturn {
  /** Current input value */
  inputValue: string;
  /** Set the input value (triggers autocomplete) */
  setInputValue: (value: string) => void;
  /** Array of autocomplete suggestions */
  suggestions: AutocompleteSuggestion[];
  /** Whether NIH API is currently loading */
  isLoading: boolean;
  /** Whether to show the dropdown */
  showDropdown: boolean;
  /** Currently highlighted suggestion index (-1 for none) */
  highlightedIndex: number;
  /** Set the highlighted index */
  setHighlightedIndex: (index: number) => void;
  /** Select a suggestion by index */
  selectSuggestion: (index: number) => void;
  /** Select a suggestion directly */
  selectSuggestionDirect: (suggestion: AutocompleteSuggestion) => void;
  /** Clear all suggestions and hide dropdown */
  clearSuggestions: () => void;
  /** Handle keyboard navigation (call from onKeyDown) */
  handleKeyDown: (e: React.KeyboardEvent) => boolean;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Generates a unique ID for a suggestion.
 */
function generateSuggestionId(source: SuggestionSource, term: string): string {
  return `${source}-${term.toLowerCase().replace(/\s+/g, '-')}`;
}

/**
 * Converts local mapping results to AutocompleteSuggestion format.
 */
function convertLocalSuggestions(
  localResults: LocalSuggestion[]
): AutocompleteSuggestion[] {
  return localResults.map((result) => ({
    id: generateSuggestionId('local', result.term),
    displayTerm: result.term,
    medicalTerm: result.medical,
    icdHint: result.icdHint,
    source: 'local' as const,
    score: result.score + 100, // Boost local results
  }));
}

/**
 * Deduplicates suggestions, preferring local over NIH.
 * Deduplication is based on the medical term (case-insensitive).
 */
function deduplicateSuggestions(
  suggestions: AutocompleteSuggestion[]
): AutocompleteSuggestion[] {
  const seen = new Map<string, AutocompleteSuggestion>();
  
  // Sort by score first so higher-scored items win
  const sorted = [...suggestions].sort((a, b) => b.score - a.score);
  
  for (const suggestion of sorted) {
    const key = suggestion.medicalTerm.toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, suggestion);
    }
  }
  
  // Return in score order
  return Array.from(seen.values()).sort((a, b) => b.score - a.score);
}

// =============================================================================
// Main Hook
// =============================================================================

export function useAutocomplete(
  options: UseAutocompleteOptions = {}
): UseAutocompleteReturn {
  const {
    onSelect,
    debounceMs = 300,
    nihDelayMs = 500,
    minChars = 2,
    maxLocalResults = 5,
    maxNihResults = 5,
    nihTriggerThreshold = 3,
  } = options;

  // State
  const [inputValue, setInputValueState] = useState('');
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Refs for cleanup and cancellation
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const nihTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentQueryRef = useRef<string>('');

  /**
   * Cancels any pending operations.
   */
  const cancelPending = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (nihTimerRef.current) {
      clearTimeout(nihTimerRef.current);
      nihTimerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * Clears suggestions and hides dropdown.
   */
  const clearSuggestions = useCallback(() => {
    cancelPending();
    setSuggestions([]);
    setShowDropdown(false);
    setHighlightedIndex(-1);
    setIsLoading(false);
  }, [cancelPending]);

  /**
   * Fetches NIH suggestions and merges with existing local results.
   */
  const fetchNihSuggestions = useCallback(
    async (query: string, localSuggestions: AutocompleteSuggestion[]) => {
      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();
      
      try {
        setIsLoading(true);
        
        const result = await searchConditionsAPI(query);
        
        // Check if this query is still current (user may have typed more)
        if (currentQueryRef.current !== query) {
          return;
        }
        
        if (result.found && result.primaryName) {
          // Convert NIH results to suggestions
          const nihSuggestions: AutocompleteSuggestion[] = [];
          
          // Primary result
          nihSuggestions.push({
            id: generateSuggestionId('nih', result.primaryName),
            displayTerm: result.consumerName || result.primaryName,
            medicalTerm: result.primaryName,
            icdHint: result.icdCodes[0]?.code,
            source: 'nih',
            score: 75, // NIH primary result score
          });
          
          // Related conditions (if any)
          if (result.relatedConditions) {
            result.relatedConditions.slice(0, maxNihResults - 1).forEach((condition, i) => {
              nihSuggestions.push({
                id: generateSuggestionId('nih', condition),
                displayTerm: condition,
                medicalTerm: condition,
                source: 'nih',
                score: 70 - i * 5, // Decreasing score for related
              });
            });
          }
          
          // Merge and deduplicate
          const merged = deduplicateSuggestions([
            ...localSuggestions,
            ...nihSuggestions,
          ]);
          
          // Only update if query is still current
          if (currentQueryRef.current === query) {
            setSuggestions(merged.slice(0, maxLocalResults + maxNihResults));
          }
        }
      } catch (error) {
        // Silently fail - local results are still shown
        if ((error as Error).name !== 'AbortError') {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[useAutocomplete] NIH fetch error:', error);
          }
        }
      } finally {
        if (currentQueryRef.current === query) {
          setIsLoading(false);
        }
      }
    },
    [maxLocalResults, maxNihResults]
  );

  /**
   * Processes input and fetches suggestions.
   */
  const processInput = useCallback(
    (query: string) => {
      currentQueryRef.current = query;
      
      // Reset state for new query
      setHighlightedIndex(-1);
      
      // Skip if query is too short
      if (query.length < minChars) {
        setSuggestions([]);
        setShowDropdown(false);
        setIsLoading(false);
        return;
      }
      
      // Skip autocomplete for ICD-10 codes
      if (isICD10Code(query)) {
        setSuggestions([]);
        setShowDropdown(false);
        setIsLoading(false);
        return;
      }
      
      // TIER 1: Local search (instant)
      const localResults = filterMappingsForAutocomplete(query, maxLocalResults);
      const localSuggestions = convertLocalSuggestions(localResults);
      
      // Show local results immediately
      setSuggestions(localSuggestions);
      setShowDropdown(localSuggestions.length > 0);
      
      // TIER 2: NIH API (if sparse local results)
      if (localSuggestions.length < nihTriggerThreshold) {
        // Delay NIH fetch slightly to avoid unnecessary API calls
        nihTimerRef.current = setTimeout(() => {
          fetchNihSuggestions(query, localSuggestions);
        }, nihDelayMs);
      }
    },
    [minChars, maxLocalResults, nihTriggerThreshold, nihDelayMs, fetchNihSuggestions]
  );

  /**
   * Sets input value with debounced autocomplete.
   */
  const setInputValue = useCallback(
    (value: string) => {
      setInputValueState(value);
      
      // Cancel any pending operations
      cancelPending();
      
      // Empty input - clear immediately
      if (!value.trim()) {
        clearSuggestions();
        return;
      }
      
      // Debounce the autocomplete processing
      debounceTimerRef.current = setTimeout(() => {
        processInput(value.trim());
      }, debounceMs);
    },
    [debounceMs, cancelPending, clearSuggestions, processInput]
  );

  /**
   * Selects a suggestion by index.
   */
  const selectSuggestion = useCallback(
    (index: number) => {
      if (index >= 0 && index < suggestions.length) {
        const suggestion = suggestions[index];
        setInputValueState(suggestion.medicalTerm);
        clearSuggestions();
        onSelect?.(suggestion.medicalTerm, suggestion);
      }
    },
    [suggestions, clearSuggestions, onSelect]
  );

  /**
   * Selects a suggestion directly.
   */
  const selectSuggestionDirect = useCallback(
    (suggestion: AutocompleteSuggestion) => {
      setInputValueState(suggestion.medicalTerm);
      clearSuggestions();
      onSelect?.(suggestion.medicalTerm, suggestion);
    },
    [clearSuggestions, onSelect]
  );

  /**
   * Handles keyboard navigation.
   * Returns true if the event was handled (should preventDefault).
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): boolean => {
      if (!showDropdown || suggestions.length === 0) {
        return false;
      }
      
      switch (e.key) {
        case 'ArrowDown':
          setHighlightedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          return true;
          
        case 'ArrowUp':
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          return true;
          
        case 'Enter':
          if (highlightedIndex >= 0) {
            selectSuggestion(highlightedIndex);
            return true;
          }
          // Let the form handle Enter if nothing highlighted
          return false;
          
        case 'Escape':
          clearSuggestions();
          return true;
          
        case 'Tab':
          // Close dropdown on Tab, don't prevent default
          clearSuggestions();
          return false;
          
        default:
          return false;
      }
    },
    [showDropdown, suggestions, highlightedIndex, selectSuggestion, clearSuggestions]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelPending();
    };
  }, [cancelPending]);

  return {
    inputValue,
    setInputValue,
    suggestions,
    isLoading,
    showDropdown,
    highlightedIndex,
    setHighlightedIndex,
    selectSuggestion,
    selectSuggestionDirect,
    clearSuggestions,
    handleKeyDown,
  };
}

export default useAutocomplete;
