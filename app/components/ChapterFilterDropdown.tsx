/**
 * ChapterFilterDropdown Component
 * ================================
 * 
 * A dropdown component for filtering ICD-10 results by chapter (body system).
 * Used in Grouped view to show/hide specific chapters.
 * 
 * Features:
 * - Button shows "All Chapters" or "X chapters" count
 * - Dropdown with checkbox list of available chapters
 * - Each item shows chapter name, code range, and result count
 * - Clear filter button when filtering is active
 * - Click outside to close
 * 
 * Phase 8: Search Filters
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Filter, X, Check } from 'lucide-react';
import { ChapterInfo } from '../types/icd';

// =============================================================================
// Props Interface
// =============================================================================

interface ChapterFilterDropdownProps {
  /** Chapters available in the current search results */
  availableChapters: ChapterInfo[];
  
  /** Currently selected chapter IDs (empty = all selected) */
  selectedChapters: number[];
  
  /** Callback when a chapter is toggled */
  onToggleChapter: (id: number) => void;
  
  /** Callback to clear all filters (show all chapters) */
  onClearFilter: () => void;
  
  /** Optional: Map of chapter ID to result count */
  chapterResultCounts?: Map<number, number>;
}

// =============================================================================
// Component
// =============================================================================

export default function ChapterFilterDropdown({
  availableChapters,
  selectedChapters,
  onToggleChapter,
  onClearFilter,
  chapterResultCounts
}: ChapterFilterDropdownProps) {
  // =========================================================================
  // State
  // =========================================================================
  
  /** Whether the dropdown is open */
  const [isOpen, setIsOpen] = useState(false);
  
  /** Ref for the dropdown container (for click-outside detection) */
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // =========================================================================
  // Click Outside Handler
  // =========================================================================
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);
  
  // =========================================================================
  // Handlers
  // =========================================================================
  
  const toggleDropdown = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);
  
  const handleToggleChapter = useCallback((id: number) => {
    onToggleChapter(id);
  }, [onToggleChapter]);
  
  const handleClearFilter = useCallback(() => {
    onClearFilter();
    setIsOpen(false);
  }, [onClearFilter]);
  
  // =========================================================================
  // Derived State
  // =========================================================================
  
  /** Whether any filter is active */
  const isFiltering = selectedChapters.length > 0;
  
  /** Total available chapters count */
  const totalChapters = availableChapters.length;
  
  /** Button label text - shows "X of Y chapters" when filtering for clarity */
  const buttonLabel = isFiltering
    ? `${selectedChapters.length} of ${totalChapters} chapters`
    : 'All Chapters';
  
  // =========================================================================
  // Render
  // =========================================================================
  
  // Don't render if no chapters available
  if (availableChapters.length === 0) {
    return null;
  }
  
  return (
    <div ref={dropdownRef} className="relative">
      {/* ================================================================= */}
      {/* Trigger Button */}
      {/* ================================================================= */}
      <button
        type="button"
        onClick={toggleDropdown}
        className={`
          flex items-center gap-2
          px-3 py-1.5
          rounded-lg
          text-xs font-medium
          border
          transition-all duration-150
          ${isFiltering
            ? 'bg-[#00D084]/10 border-[#00D084]/30 text-[#00A66C] dark:text-[#00D084]'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
          }
          hover:border-[#00D084]/50
          hover:shadow-sm
        `}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Filter className="w-3.5 h-3.5" />
        <span>{buttonLabel}</span>
        <ChevronDown 
          className={`
            w-3.5 h-3.5 
            transition-transform duration-200
            ${isOpen ? 'rotate-180' : ''}
          `} 
        />
      </button>
      
      {/* ================================================================= */}
      {/* Dropdown Panel */}
      {/* ================================================================= */}
      {isOpen && (
        <div 
          className="
            absolute z-50 
            mt-2 right-0
            w-72
            bg-white dark:bg-gray-800
            border border-gray-200 dark:border-gray-700
            rounded-xl
            shadow-xl shadow-gray-200/50 dark:shadow-black/30
            overflow-hidden
            animate-in fade-in slide-in-from-top-2
            duration-200
          "
          role="listbox"
          aria-label="Filter by chapter"
        >
          {/* Header */}
          <div className="
            px-4 py-3
            bg-gray-50 dark:bg-gray-900/50
            border-b border-gray-100 dark:border-gray-700
          ">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Filter by Chapter
              </span>
              {isFiltering && (
                <button
                  type="button"
                  onClick={handleClearFilter}
                  className="
                    flex items-center gap-1
                    px-2 py-1
                    rounded-md
                    text-xs font-medium
                    text-gray-500 dark:text-gray-400
                    hover:text-red-600 dark:hover:text-red-400
                    hover:bg-red-50 dark:hover:bg-red-900/20
                    transition-colors
                  "
                >
                  <X className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {isFiltering 
                ? `Showing ${selectedChapters.length} of ${totalChapters} chapters`
                : `Showing all ${totalChapters} chapters`
              }
            </p>
          </div>
          
          {/* Chapter List */}
          <div className="max-h-64 overflow-y-auto">
            {availableChapters.map((chapter) => {
              const isSelected = selectedChapters.includes(chapter.id);
              const resultCount = chapterResultCounts?.get(chapter.id);
              
              return (
                <button
                  key={chapter.id}
                  type="button"
                  onClick={() => handleToggleChapter(chapter.id)}
                  className={`
                    w-full
                    flex items-start gap-3
                    px-4 py-3
                    text-left
                    transition-colors duration-100
                    ${isSelected
                      ? 'bg-[#00D084]/5 dark:bg-[#00D084]/10'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }
                    border-b border-gray-100 dark:border-gray-700/50
                    last:border-b-0
                  `}
                  role="option"
                  aria-selected={isSelected}
                >
                  {/* Checkbox */}
                  <div className={`
                    flex-shrink-0
                    w-4 h-4 mt-0.5
                    rounded
                    border-2
                    flex items-center justify-center
                    transition-all duration-150
                    ${isSelected
                      ? 'bg-[#00D084] border-[#00D084]'
                      : 'border-gray-300 dark:border-gray-600'
                    }
                  `}>
                    {isSelected && (
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    )}
                  </div>
                  
                  {/* Chapter Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`
                        text-sm font-medium
                        ${isSelected
                          ? 'text-[#00A66C] dark:text-[#00D084]'
                          : 'text-gray-800 dark:text-gray-200'
                        }
                      `}>
                        {chapter.shortName}
                      </span>
                      {resultCount !== undefined && (
                        <span className="
                          px-1.5 py-0.5
                          rounded-full
                          text-[10px] font-semibold
                          bg-gray-100 dark:bg-gray-700
                          text-gray-500 dark:text-gray-400
                        ">
                          {resultCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                      {chapter.codeRange}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Footer hint */}
          <div className="
            px-4 py-2
            bg-gray-50 dark:bg-gray-900/50
            border-t border-gray-100 dark:border-gray-700
          ">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center">
              {isFiltering 
                ? 'Click chapters to toggle visibility'
                : 'Select chapters to filter results'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
