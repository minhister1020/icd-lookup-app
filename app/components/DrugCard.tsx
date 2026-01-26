/**
 * DrugCard Component
 * ==================
 * 
 * Displays drug information from OpenFDA in a compact, readable card.
 * Uses a BLUE color theme to distinguish from ICD codes (green).
 * 
 * COLOR SCHEME:
 * - ICD-10 Codes: Green (#00D084)
 * - Drugs: Blue (#3B82F6)
 * - Clinical Trials: Purple (future)
 * 
 * DISPLAYS:
 * - Brand name (e.g., "Metformin")
 * - Generic name (e.g., "Metformin Hydrochloride")
 * - Manufacturer
 * - What it treats (indication)
 * - Optional warnings on hover/expand
 */

'use client';

import { useState } from 'react';
import { Pill, Building2, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { DrugResult } from '../types/icd';

// =============================================================================
// Props Interface
// =============================================================================

interface DrugCardProps {
  /** The drug data to display */
  drug: DrugResult;
}

// =============================================================================
// Component
// =============================================================================

export default function DrugCard({ drug }: DrugCardProps) {
  // Track whether the full indication is expanded
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div 
      className="
        group
        p-4
        bg-white
        dark:bg-gray-800
        rounded-xl
        border
        border-blue-100
        dark:border-blue-900/50
        shadow-sm
        hover:shadow-md
        hover:shadow-blue-100/50
        dark:hover:shadow-none
        hover:border-blue-200
        dark:hover:border-blue-700
        transition-all
        duration-200
      "
    >
      {/* Header: Icon + Brand Name */}
      <div className="flex items-start gap-3 mb-2">
        {/* Drug Icon */}
        <div 
          className="
            flex-shrink-0
            w-8
            h-8
            rounded-lg
            bg-blue-500/10
            dark:bg-blue-500/20
            flex
            items-center
            justify-center
          "
        >
          <Pill className="w-4 h-4 text-blue-500" />
        </div>
        
        {/* Names */}
        <div className="flex-1 min-w-0">
          {/* Brand Name */}
          <h4 
            className="
              font-semibold
              text-gray-800
              dark:text-gray-200
              text-sm
              leading-tight
              group-hover:text-blue-600
              dark:group-hover:text-blue-400
              transition-colors
            "
          >
            {drug.brandName}
          </h4>
          
          {/* Generic Name */}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
            {drug.genericName}
          </p>
        </div>
      </div>
      
      {/* Manufacturer */}
      <div className="flex items-center gap-1.5 mb-3">
        <Building2 className="w-3 h-3 text-gray-400" />
        <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {drug.manufacturer}
        </span>
      </div>
      
      {/* Indication (What it treats) */}
      <div className="mb-2">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
          Used for:
        </p>
        <p 
          className={`
            text-xs
            text-gray-600
            dark:text-gray-400
            leading-relaxed
            ${isExpanded ? '' : 'line-clamp-2'}
          `}
        >
          {drug.indication}
        </p>
        
        {/* Expand/Collapse button (if indication is long) */}
        {drug.indication.length > 100 && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="
              flex
              items-center
              gap-1
              mt-1
              text-xs
              text-blue-500
              hover:text-blue-600
              dark:hover:text-blue-400
              font-medium
              transition-colors
            "
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                Read more
              </>
            )}
          </button>
        )}
      </div>
      
      {/* Warnings (if present) */}
      {drug.warnings && isExpanded && (
        <div 
          className="
            mt-3
            pt-3
            border-t
            border-gray-100
            dark:border-gray-700
          "
        >
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
              Warning
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            {drug.warnings}
          </p>
        </div>
      )}
    </div>
  );
}
