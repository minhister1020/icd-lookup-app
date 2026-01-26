/**
 * ResultCard Component
 * ====================
 * 
 * A professional, polished card component for displaying ICD-10 results.
 * NOW WITH: Drug expansion feature (Phase 3A)
 * 
 * DESIGN FEATURES:
 * - Soft shadows with hover elevation
 * - Smooth micro-interactions (scale, translate)
 * - ICD code badge with branded colors
 * - Expandable drug section (blue theme)
 * - Loading states and error handling
 */

'use client';

import { useState } from 'react';
import { ChevronRight, Pill, Loader2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { DrugResult } from '../types/icd';
import { searchDrugsByCondition } from '../lib/openFdaApi';
import DrugCard from './DrugCard';

// =============================================================================
// Props Interface
// =============================================================================

interface ResultCardProps {
  /** The ICD-10 code (e.g., "E11.9") */
  code: string;
  
  /** The condition name (e.g., "Type 2 diabetes mellitus without complications") */
  name: string;
}

// =============================================================================
// Component
// =============================================================================

export default function ResultCard({ code, name }: ResultCardProps) {
  // Drug expansion state - managed locally with caching
  const [drugs, setDrugs] = useState<DrugResult[]>([]);
  const [drugsLoading, setDrugsLoading] = useState(false);
  const [drugsError, setDrugsError] = useState<string | null>(null);
  const [drugsExpanded, setDrugsExpanded] = useState(false);
  const [hasFetchedDrugs, setHasFetchedDrugs] = useState(false);
  
  /**
   * Handles loading drugs for this condition.
   * - First click: Fetches from API and expands
   * - Subsequent clicks: Just toggles expand/collapse (uses cache)
   */
  const handleToggleDrugs = async () => {
    // Prevent multiple simultaneous requests
    if (drugsLoading) return;
    
    // If already fetched, just toggle visibility
    if (hasFetchedDrugs) {
      setDrugsExpanded(!drugsExpanded);
      return;
    }
    
    // First time: fetch from API
    setDrugsLoading(true);
    setDrugsError(null);
    setDrugsExpanded(true);
    
    try {
      const results = await searchDrugsByCondition(name);
      setDrugs(results);
      setHasFetchedDrugs(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load drugs';
      setDrugsError(message);
    } finally {
      setDrugsLoading(false);
    }
  };
  
  return (
    <div 
      className="
        group
        relative
        bg-white
        dark:bg-gray-800
        rounded-2xl
        border
        border-gray-100
        dark:border-gray-700
        shadow-sm
        hover:shadow-xl
        hover:shadow-gray-200/50
        dark:hover:shadow-none
        hover:border-[#00D084]/30
        dark:hover:border-[#00D084]/40
        transition-all
        duration-300
        ease-out
        overflow-hidden
      "
    >
      {/* Main Card Content */}
      <div 
        className="
          p-5
          cursor-pointer
          hover:-translate-y-0.5
          active:scale-[0.99]
          transition-transform
          duration-200
        "
      >
        {/* Card Content */}
        <div className="flex items-start justify-between gap-4">
          {/* Left Side: Code Badge + Name */}
          <div className="flex-1 min-w-0">
            {/* ICD-10 Code Badge */}
            <div 
              className="
                inline-flex
                items-center
                px-3
                py-1.5
                rounded-lg
                bg-[#00D084]/10
                dark:bg-[#00D084]/20
                mb-3
              "
            >
              <span 
                className="
                  text-[#00A66C]
                  dark:text-[#00D084]
                  font-bold
                  text-sm
                  font-mono
                  tracking-wide
                "
              >
                {code}
              </span>
            </div>
            
            {/* Condition Name */}
            <h3 
              className="
                text-gray-800
                dark:text-gray-200
                font-medium
                text-base
                leading-snug
                group-hover:text-[#00A66C]
                dark:group-hover:text-[#00D084]
                transition-colors
                duration-200
              "
            >
              {name}
            </h3>
          </div>
          
          {/* Right Side: Chevron Icon (appears on hover) */}
          <div 
            className="
              flex-shrink-0
              w-8
              h-8
              rounded-full
              bg-gray-100
              dark:bg-gray-700
              flex
              items-center
              justify-center
              opacity-0
              group-hover:opacity-100
              translate-x-2
              group-hover:translate-x-0
              transition-all
              duration-300
            "
          >
            <ChevronRight 
              className="
                w-4
                h-4
                text-[#00D084]
              " 
            />
          </div>
        </div>
      </div>
      
      {/* Action Buttons Section */}
      <div 
        className="
          px-5
          pb-4
          pt-0
          flex
          items-center
          gap-2
          border-t
          border-gray-50
          dark:border-gray-700/50
        "
      >
        {/* View Drugs Button */}
        <button
          type="button"
          onClick={handleToggleDrugs}
          disabled={drugsLoading}
          className={`
            flex
            items-center
            gap-1.5
            px-3
            py-1.5
            rounded-lg
            text-xs
            font-medium
            transition-all
            duration-200
            ${drugsExpanded 
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50'
            }
            disabled:opacity-50
            disabled:cursor-not-allowed
          `}
        >
          {drugsLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Pill className="w-3.5 h-3.5" />
          )}
          <span>
            {drugsLoading 
              ? 'Loading...' 
              : drugsExpanded 
                ? 'Hide Drugs' 
                : 'View Drugs'
            }
          </span>
          {!drugsLoading && hasFetchedDrugs && drugs.length > 0 && (
            <span 
              className={`
                ml-1
                px-1.5
                py-0.5
                rounded-full
                text-[10px]
                font-bold
                ${drugsExpanded 
                  ? 'bg-white/20 text-white' 
                  : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                }
              `}
            >
              {drugs.length}
            </span>
          )}
          {!drugsLoading && (
            drugsExpanded 
              ? <ChevronUp className="w-3 h-3 ml-0.5" />
              : <ChevronDown className="w-3 h-3 ml-0.5" />
          )}
        </button>
      </div>
      
      {/* Expandable Drugs Section */}
      {drugsExpanded && (
        <div 
          className="
            border-t
            border-blue-100
            dark:border-blue-900/30
            bg-blue-50/50
            dark:bg-blue-900/10
            animate-in
            slide-in-from-top-2
            duration-200
          "
        >
          <div className="p-4">
            {/* Loading State */}
            {drugsLoading && (
              <div className="flex items-center justify-center py-6">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Searching drug database...
                  </p>
                </div>
              </div>
            )}
            
            {/* Error State */}
            {drugsError && !drugsLoading && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">
                    Failed to load drugs
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-300">
                    {drugsError}
                  </p>
                </div>
              </div>
            )}
            
            {/* No Results State */}
            {!drugsLoading && !drugsError && hasFetchedDrugs && drugs.length === 0 && (
              <div className="text-center py-4">
                <Pill className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No drugs found for this condition
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  The OpenFDA database may not have drugs listed for this specific condition
                </p>
              </div>
            )}
            
            {/* Drugs List */}
            {!drugsLoading && !drugsError && drugs.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Pill className="w-3 h-3" />
                  Related Drugs ({drugs.length})
                </p>
                <div className="grid gap-3 sm:grid-cols-1">
                  {drugs.map((drug, index) => (
                    <DrugCard key={`${drug.brandName}-${index}`} drug={drug} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Subtle Bottom Accent Line (appears on hover) */}
      <div 
        className="
          absolute
          bottom-0
          left-4
          right-4
          h-0.5
          bg-gradient-to-r
          from-[#00D084]
          to-[#00A66C]
          rounded-full
          opacity-0
          group-hover:opacity-100
          transition-opacity
          duration-300
        "
      />
    </div>
  );
}
