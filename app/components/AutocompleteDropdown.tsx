/**
 * AutocompleteDropdown Component
 * ==============================
 * 
 * Displays autocomplete suggestions for medical term search.
 * Supports keyboard navigation, accessibility, and mobile touch targets.
 * 
 * FEATURES:
 * - Source badges: [Local] with Database icon, [NIH] with Globe icon
 * - Loading spinner for NIH API fetching
 * - Empty state with helpful message
 * - Clinical Blue theme (#1976D2, #0D47A1)
 * - 44px minimum touch targets for mobile accessibility
 * - Keyboard hints footer
 * - Full ARIA support for screen readers
 * - Auto-scroll highlighted item into view
 * 
 * @example
 * ```tsx
 * <AutocompleteDropdown
 *   suggestions={suggestions}
 *   isLoading={isLoading}
 *   highlightedIndex={highlightedIndex}
 *   onSelect={selectSuggestionDirect}
 *   onHighlight={setHighlightedIndex}
 * />
 * ```
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { Database, Globe, Loader2, Search, ArrowUp, ArrowDown } from 'lucide-react';
import type { AutocompleteSuggestion, SuggestionSource } from '../hooks/useAutocomplete';

// =============================================================================
// Constants
// =============================================================================

/**
 * Detect if user is on a mobile/touch device.
 * Computed once at module load to avoid re-checking on every render.
 */
const IS_MOBILE = typeof window !== 'undefined' && 
  ('ontouchstart' in window || navigator.maxTouchPoints > 0);

// =============================================================================
// Types
// =============================================================================

export interface AutocompleteDropdownProps {
  /** Array of suggestions to display */
  suggestions: AutocompleteSuggestion[];
  /** Whether NIH API is currently loading */
  isLoading: boolean;
  /** Currently highlighted suggestion index (-1 for none) */
  highlightedIndex: number;
  /** Callback when a suggestion is selected */
  onSelect: (suggestion: AutocompleteSuggestion) => void;
  /** Callback when a suggestion is highlighted (hover/keyboard) */
  onHighlight?: (index: number) => void;
  /** Optional: Show keyboard hints footer (default: true on desktop) */
  showKeyboardHints?: boolean;
  /** Optional: Custom empty state message */
  emptyMessage?: string;
  /** Optional: ID for ARIA labeling */
  id?: string;
}

// =============================================================================
// Sub-Components
// =============================================================================

/**
 * Source badge component showing where the suggestion came from.
 */
function SourceBadge({ source }: { source: SuggestionSource }) {
  if (source === 'local') {
    return (
      <span 
        className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium 
                   bg-[#1976D2]/10 text-[#1976D2] dark:bg-[#42A5F5]/20 dark:text-[#90CAF9]
                   rounded"
        title="From local medical term mappings"
      >
        <Database className="w-2.5 h-2.5" aria-hidden="true" />
        Local
      </span>
    );
  }
  
  return (
    <span 
      className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium 
                 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400
                 rounded"
      title="From NIH Medical Conditions Database"
    >
      <Globe className="w-2.5 h-2.5" aria-hidden="true" />
      NIH
    </span>
  );
}

/**
 * Loading indicator shown when fetching NIH results.
 */
function LoadingIndicator() {
  return (
    <div 
      className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500 dark:text-gray-400"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="w-4 h-4 animate-spin text-[#1976D2]" aria-hidden="true" />
      <span>Searching NIH database...</span>
    </div>
  );
}

/**
 * Empty state when no suggestions are found.
 */
function EmptyState({ message }: { message: string }) {
  return (
    <div 
      className="flex flex-col items-center gap-2 px-4 py-6 text-center"
      role="status"
      aria-live="polite"
    >
      <Search className="w-8 h-8 text-gray-300 dark:text-gray-600" aria-hidden="true" />
      <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500">
        Try a different term or medical abbreviation
      </p>
    </div>
  );
}

/**
 * Keyboard hints footer for desktop users.
 */
function KeyboardHints() {
  return (
    <div 
      className="flex items-center justify-center gap-3 px-3 py-2 text-[10px] text-gray-400 
                 dark:text-gray-500 border-t border-gray-100 dark:border-gray-700/50 
                 bg-gray-50/50 dark:bg-gray-800/30"
      aria-hidden="true"
    >
      <span className="inline-flex items-center gap-1">
        <kbd className="inline-flex items-center justify-center w-4 h-4 rounded border 
                       border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 
                       text-[9px] font-mono">
          <ArrowUp className="w-2.5 h-2.5" />
        </kbd>
        <kbd className="inline-flex items-center justify-center w-4 h-4 rounded border 
                       border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 
                       text-[9px] font-mono">
          <ArrowDown className="w-2.5 h-2.5" />
        </kbd>
        <span className="ml-0.5">navigate</span>
      </span>
      <span className="text-gray-300 dark:text-gray-600">·</span>
      <span className="inline-flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 
                       bg-white dark:bg-gray-700 text-[9px] font-mono">
          Enter
        </kbd>
        <span>select</span>
      </span>
      <span className="text-gray-300 dark:text-gray-600">·</span>
      <span className="inline-flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 
                       bg-white dark:bg-gray-700 text-[9px] font-mono">
          Esc
        </kbd>
        <span>close</span>
      </span>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function AutocompleteDropdown({
  suggestions,
  isLoading,
  highlightedIndex,
  onSelect,
  onHighlight,
  showKeyboardHints = true,
  emptyMessage = 'No suggestions found',
  id = 'autocomplete-listbox',
}: AutocompleteDropdownProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<Map<number, HTMLLIElement>>(new Map());

  // Clear itemRefs when suggestions change to prevent memory leaks
  useEffect(() => {
    itemRefs.current.clear();
  }, [suggestions]);

  // Auto-scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0) {
      const item = itemRefs.current.get(highlightedIndex);
      if (item) {
        item.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }
  }, [highlightedIndex]);

  // Determine if we should show the dropdown content
  const hasContent = suggestions.length > 0 || isLoading;
  const isEmpty = suggestions.length === 0 && !isLoading;

  // Determine if keyboard hints should be shown (hide on mobile)
  const shouldShowKeyboardHints = showKeyboardHints && !IS_MOBILE && suggestions.length > 0;

  return (
    <div
      className="absolute top-full left-0 right-0 z-50 mt-1 
                 bg-white dark:bg-gray-800 
                 border border-gray-200 dark:border-gray-700 
                 rounded-xl shadow-lg shadow-black/10 dark:shadow-black/30
                 overflow-hidden"
      role="listbox"
      id={id}
      aria-label="Search suggestions"
    >
      {/* Suggestions List */}
      {suggestions.length > 0 && (
        <ul
          ref={listRef}
          className="max-h-[300px] overflow-y-auto py-1"
          aria-live="polite"
        >
          {suggestions.map((suggestion, index) => {
            const isHighlighted = index === highlightedIndex;
            
            return (
              <li
                key={suggestion.id}
                ref={(el) => {
                  if (el) itemRefs.current.set(index, el);
                }}
                role="option"
                aria-selected={isHighlighted}
                id={`${id}-option-${index}`}
                className={`
                  flex flex-col gap-0.5 px-4 py-3 cursor-pointer
                  min-h-[44px] /* Mobile touch target */
                  transition-colors duration-100
                  ${isHighlighted
                    ? 'bg-[#1976D2]/10 dark:bg-[#1976D2]/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }
                `}
                onClick={() => onSelect(suggestion)}
                onMouseEnter={() => onHighlight?.(index)}
                onMouseLeave={() => onHighlight?.(-1)}
              >
                {/* Top row: Display term + Source badge */}
                <div className="flex items-center justify-between gap-2">
                  <span 
                    className={`
                      font-medium text-sm truncate
                      ${isHighlighted 
                        ? 'text-[#0D47A1] dark:text-[#90CAF9]' 
                        : 'text-gray-900 dark:text-gray-100'
                      }
                    `}
                  >
                    {suggestion.displayTerm}
                  </span>
                  <SourceBadge source={suggestion.source} />
                </div>
                
                {/* Bottom row: Medical term (if different) + ICD hint */}
                {(suggestion.displayTerm.toLowerCase() !== suggestion.medicalTerm.toLowerCase() || 
                  suggestion.icdHint) && (
                  <div className="flex items-center gap-2 text-xs">
                    {suggestion.displayTerm.toLowerCase() !== suggestion.medicalTerm.toLowerCase() && (
                      <span className="text-gray-500 dark:text-gray-400 truncate">
                        → {suggestion.medicalTerm}
                      </span>
                    )}
                    {suggestion.icdHint && (
                      <span 
                        className={`
                          ml-auto px-1.5 py-0.5 rounded font-mono text-[10px]
                          ${isHighlighted
                            ? 'bg-[#1976D2]/20 text-[#0D47A1] dark:bg-[#1976D2]/30 dark:text-[#90CAF9]'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                          }
                        `}
                      >
                        {suggestion.icdHint}
                      </span>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Loading State */}
      {isLoading && suggestions.length === 0 && <LoadingIndicator />}
      
      {/* Loading indicator when fetching more (has some results) */}
      {isLoading && suggestions.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 text-xs text-gray-400 
                       dark:text-gray-500 border-t border-gray-100 dark:border-gray-700/50">
          <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
          <span>Loading more from NIH...</span>
        </div>
      )}

      {/* Empty State */}
      {isEmpty && <EmptyState message={emptyMessage} />}

      {/* Keyboard Hints Footer */}
      {shouldShowKeyboardHints && <KeyboardHints />}

      {/* Screen reader announcements */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {suggestions.length > 0 && (
          `${suggestions.length} suggestion${suggestions.length === 1 ? '' : 's'} available. ` +
          `Use up and down arrows to navigate.`
        )}
        {isLoading && 'Loading suggestions...'}
        {isEmpty && emptyMessage}
      </div>
    </div>
  );
}

export default AutocompleteDropdown;
