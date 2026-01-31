/**
 * RelatedCodesSection Component
 * =============================
 * 
 * Displays related/sibling ICD-10 codes for a searched specific code.
 * When a user searches for "I21.9", this component shows all other
 * codes in the I21.x family (I21.0, I21.1, I21.2, etc.)
 * 
 * DESIGN FEATURES:
 * - Collapsible section (collapsed by default)
 * - Count badge showing number of related codes
 * - Visual hierarchy with left border
 * - Loading state with subtle animation
 * - Empty state for standalone codes
 * - Reuses ResultCard for each related code
 * - Smooth expand/collapse animation
 * 
 * @example
 * <RelatedCodesSection
 *   searchedCode="I21.9"
 *   relatedCodes={relatedCodes}
 *   isLoading={isLoadingRelated}
 *   isFavorite={(code) => favorites.has(code)}
 *   onToggleFavorite={(code, name) => toggleFavorite(code, name)}
 *   onDrugsLoaded={handleDrugsLoaded}
 *   onTrialsLoaded={handleTrialsLoaded}
 * />
 */

'use client';

import { useState } from 'react';
import { 
  ChevronDown, 
  Loader2, 
  GitBranch,
  Info
} from 'lucide-react';
import { ScoredICD10Result, DrugResult, ClinicalTrialResult } from '../types/icd';
import ResultCard from './ResultCard';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Determines if an ICD-10 code is billable (specific enough for billing).
 * 
 * Generally, codes with a decimal point are billable - they indicate
 * a specific diagnosis. Category codes (3 chars, no dot) are typically
 * NOT billable as they're too general.
 * 
 * @param code - The ICD-10 code to check
 * @returns True if the code is billable (has decimal)
 * 
 * @example
 * isBillableCode("I21.9")   // true - specific code
 * isBillableCode("I21")     // false - category only
 * isBillableCode("E11.65")  // true - specific code
 */
export function isBillableCode(code: string): boolean {
  return code.includes('.');
}

/**
 * Extracts the parent category from an ICD-10 code.
 * Used to show the family relationship in the header.
 * 
 * @param code - The ICD-10 code
 * @returns The 3-character parent category
 */
function getParentCategory(code: string): string {
  return code.substring(0, 3).toUpperCase();
}

// =============================================================================
// Props Interface
// =============================================================================

interface RelatedCodesSectionProps {
  /** The ICD-10 code that was searched (e.g., "I21.9") */
  searchedCode: string;
  
  /** Array of related/sibling codes in the same family */
  relatedCodes: ScoredICD10Result[];
  
  /** Whether related codes are currently being fetched */
  isLoading: boolean;
  
  /** Check if a code is favorited */
  isFavorite?: (code: string) => boolean;
  
  /** Callback to toggle favorite status for a code */
  onToggleFavorite?: (code: string, name: string) => void;
  
  /** Callback when drugs are loaded for a code (for caching) */
  onDrugsLoaded?: (icdCode: string, drugs: DrugResult[]) => void;
  
  /** Callback when trials are loaded for a code (for caching) */
  onTrialsLoaded?: (icdCode: string, trials: ClinicalTrialResult[]) => void;
}

// =============================================================================
// Component
// =============================================================================

export default function RelatedCodesSection({
  searchedCode,
  relatedCodes,
  isLoading,
  isFavorite,
  onToggleFavorite,
  onDrugsLoaded,
  onTrialsLoaded,
}: RelatedCodesSectionProps) {
  // Collapsed by default to avoid overwhelming the user
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Extract parent category for display
  const parentCategory = getParentCategory(searchedCode);
  
  /**
   * Handle keyboard navigation for accessibility.
   * Allow Enter and Space to toggle the section.
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsExpanded(!isExpanded);
    }
  };
  
  // Don't render anything if not loading and no related codes
  // This handles standalone codes like I10 that have no siblings
  if (!isLoading && relatedCodes.length === 0) {
    return (
      <div className="
        mb-6
        p-4
        rounded-xl
        bg-gray-50 dark:bg-gray-800/50
        border border-gray-200 dark:border-gray-700
        border-l-4 border-l-gray-400
      ">
        <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
          <Info className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">Standalone Code</p>
            <p className="text-xs mt-0.5">
              {searchedCode} has no related codes in its category
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className="
        mb-6
        rounded-xl
        overflow-hidden
        border
        border-gray-200
        dark:border-gray-700
        bg-gradient-to-r from-indigo-50 to-purple-50
        dark:from-indigo-900/10 dark:to-purple-900/10
        border-l-4
        border-l-indigo-500
        transition-all
        duration-200
      "
    >
      {/* Clickable Header */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-controls="related-codes-content"
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={handleKeyDown}
        className="
          flex
          items-center
          justify-between
          gap-3
          px-4
          py-3
          cursor-pointer
          select-none
          hover:bg-indigo-100/50 dark:hover:bg-indigo-900/20
          transition-colors
          duration-150
          focus:outline-none
          focus:ring-2
          focus:ring-indigo-500
          focus:ring-inset
        "
      >
        {/* Left: Icon + Title */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Branch Icon */}
          <div 
            className="
              flex-shrink-0
              w-8
              h-8
              rounded-lg
              bg-indigo-100 dark:bg-indigo-900/30
              flex
              items-center
              justify-center
            "
          >
            <GitBranch 
              className="w-4 h-4 text-indigo-600 dark:text-indigo-400"
              aria-hidden="true"
            />
          </div>
          
          {/* Title and Subtitle */}
          <div className="min-w-0">
            <h3 
              className="
                font-semibold
                text-sm
                text-indigo-700 dark:text-indigo-300
                truncate
              "
            >
              Related Codes
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              Other codes in the {parentCategory}.x family
            </p>
          </div>
        </div>
        
        {/* Right: Count Badge + Chevron */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Loading Indicator */}
          {isLoading && (
            <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
          )}
          
          {/* Result Count Badge */}
          {!isLoading && (
            <span 
              className="
                px-2.5
                py-1
                rounded-full
                text-xs
                font-medium
                bg-indigo-100 dark:bg-indigo-900/30
                text-indigo-600 dark:text-indigo-400
              "
            >
              {relatedCodes.length} {relatedCodes.length === 1 ? 'code' : 'codes'}
            </span>
          )}
          
          {/* Expand/Collapse Chevron */}
          <ChevronDown 
            className={`
              w-5
              h-5
              text-indigo-400
              dark:text-indigo-500
              transition-transform
              duration-200
              ${isExpanded ? 'rotate-180' : 'rotate-0'}
            `}
            aria-hidden="true"
          />
        </div>
      </div>
      
      {/* Loading State (shown when loading, even if collapsed) */}
      {isLoading && (
        <div className="px-4 pb-4">
          <div className="flex items-center justify-center py-4 text-indigo-500 dark:text-indigo-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm">Finding related codes...</span>
          </div>
        </div>
      )}
      
      {/* Expandable Content */}
      {!isLoading && (
        <div
          id="related-codes-content"
          className={`
            overflow-hidden
            transition-all
            duration-300
            ease-in-out
            ${isExpanded ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}
          `}
        >
          {/* Results List */}
          <div className="p-4 pt-2 space-y-3">
            {/* Explanation Text */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              These codes are in the same family as <span className="font-mono font-medium">{searchedCode}</span>
            </p>
            
            {/* Related Code Cards */}
            {relatedCodes.map((result) => (
              <ResultCard
                key={result.code}
                code={result.code}
                name={result.name}
                score={result.score}
                rank={undefined} // No rank badges for related codes
                isFavorite={isFavorite?.(result.code) ?? false}
                onToggleFavorite={
                  onToggleFavorite 
                    ? () => onToggleFavorite(result.code, result.name) 
                    : undefined
                }
                onDrugsLoaded={onDrugsLoaded}
                onTrialsLoaded={onTrialsLoaded}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Collapsed Preview - show code pills when collapsed */}
      {!isLoading && !isExpanded && relatedCodes.length > 0 && (
        <div className="px-4 pb-3 pt-1">
          <div className="flex flex-wrap gap-1.5">
            {relatedCodes.slice(0, 6).map((result) => (
              <span
                key={result.code}
                className="
                  inline-flex
                  items-center
                  px-2
                  py-0.5
                  rounded-md
                  text-xs
                  font-mono
                  bg-indigo-100 dark:bg-indigo-900/30
                  text-indigo-600 dark:text-indigo-400
                "
                title={result.name}
              >
                {result.code}
              </span>
            ))}
            {relatedCodes.length > 6 && (
              <span 
                className="
                  inline-flex
                  items-center
                  px-2
                  py-0.5
                  rounded-md
                  text-xs
                  text-gray-500
                  dark:text-gray-400
                "
              >
                +{relatedCodes.length - 6} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
