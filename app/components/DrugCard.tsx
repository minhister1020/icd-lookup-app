/**
 * DrugCard Component
 * ==================
 * 
 * Displays drug information in a compact, readable card.
 * Uses a BLUE color theme to distinguish from ICD codes (green).
 * 
 * COLOR SCHEME:
 * - ICD-10 Codes: Blue (#1976D2)
 * - Drugs: Blue (#3B82F6)
 * - FDA-Approved Badge: Green
 * - Off-Label Badge: Amber/Orange
 * - Clinical Trials: Purple
 * 
 * DISPLAYS:
 * - Brand name (e.g., "Wegovy")
 * - Generic name (e.g., "semaglutide")
 * - FDA approval status badge
 * - Manufacturer
 * - Dosage form (e.g., "Oral Tablet - 1 MG")
 * - Optional warnings on hover/expand
 */

'use client';

import { useState, memo } from 'react';
import { Pill, Building2, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Info, FlaskConical, Layers } from 'lucide-react';
import { DrugResult, DrugClass, RelatedDrug } from '../types/icd';

// =============================================================================
// Props Interface
// =============================================================================

/** Badge types for FDA approval status */
export type DrugBadgeType = 'fda-approved' | 'off-label' | undefined;

interface DrugCardProps {
  /** The drug data to display */
  drug: DrugResult;
  /** Optional badge indicating FDA approval status */
  badgeType?: DrugBadgeType;
}

// =============================================================================
// Component
// =============================================================================

const DrugCard = memo(function DrugCard({ drug, badgeType }: DrugCardProps) {
  // Track whether the full indication is expanded
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div 
      className={`
        group
        p-4
        bg-white
        dark:bg-gray-800
        rounded-xl
        border
        shadow-sm
        hover:shadow-md
        transition-all
        duration-200
        ${badgeType === 'fda-approved' 
          ? 'border-green-200 dark:border-green-900/50 hover:border-green-300 dark:hover:border-green-700 hover:shadow-green-100/50' 
          : badgeType === 'off-label'
          ? 'border-amber-200 dark:border-amber-900/50 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-amber-100/50'
          : 'border-blue-100 dark:border-blue-900/50 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-blue-100/50'
        }
        dark:hover:shadow-none
      `}
    >
      {/* Header: Icon + Brand Name + Badge */}
      <div className="flex items-start gap-3 mb-2">
        {/* Drug Icon */}
        <div 
          className={`
            flex-shrink-0
            w-8
            h-8
            rounded-lg
            flex
            items-center
            justify-center
            ${badgeType === 'fda-approved'
              ? 'bg-green-500/10 dark:bg-green-500/20'
              : badgeType === 'off-label'
              ? 'bg-amber-500/10 dark:bg-amber-500/20'
              : 'bg-blue-500/10 dark:bg-blue-500/20'
            }
          `}
        >
          <Pill className={`w-4 h-4 ${
            badgeType === 'fda-approved' 
              ? 'text-green-600 dark:text-green-400' 
              : badgeType === 'off-label'
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-blue-500'
          }`} />
        </div>
        
        {/* Names + Badge */}
        <div className="flex-1 min-w-0">
          {/* Brand Name with Badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <h4 
              className={`
                font-semibold
                text-gray-800
                dark:text-gray-200
                text-sm
                leading-tight
                transition-colors
                ${badgeType === 'fda-approved'
                  ? 'group-hover:text-green-600 dark:group-hover:text-green-400'
                  : badgeType === 'off-label'
                  ? 'group-hover:text-amber-600 dark:group-hover:text-amber-400'
                  : 'group-hover:text-blue-600 dark:group-hover:text-blue-400'
                }
              `}
            >
              {drug.brandName}
            </h4>
            
            {/* FDA Approval Badge */}
            {badgeType === 'fda-approved' && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                <CheckCircle2 className="w-2.5 h-2.5" />
                FDA
              </span>
            )}
            {badgeType === 'off-label' && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                <Info className="w-2.5 h-2.5" />
                Off-Label
              </span>
            )}
          </div>
          
          {/* Generic Name */}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
            {drug.genericName}
          </p>

          {/* Drug Class Badges */}
          {drug.drugClasses && drug.drugClasses.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {drug.drugClasses.slice(0, 3).map((cls) => (
                <span
                  key={cls.classId}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  title={`${cls.classType}: ${cls.className}`}
                >
                  {cls.className}
                </span>
              ))}
              {drug.drugClasses.length > 3 && (
                <span className="text-[10px] text-gray-400 dark:text-gray-500 self-center">
                  +{drug.drugClasses.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Manufacturer */}
      <div className="flex items-center gap-1.5 mb-3">
        <Building2 className="w-3 h-3 text-gray-400" />
        <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {drug.manufacturer}
        </span>
      </div>
      
      {/* Dosage Form */}
      <div className="mb-2">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
          Dosage:
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
        
        {/* Expand/Collapse button (if indication is long or has extra data) */}
        {(drug.indication.length > 100 || drug.ingredients || drug.relatedDrugs) && (
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
                {drug.ingredients || drug.relatedDrugs ? 'More details' : 'Read more'}
              </>
            )}
          </button>
        )}
      </div>

      {/* Ingredients Section (for combination drugs) - Only shown when expanded */}
      {drug.ingredients && drug.ingredients.length > 1 && isExpanded && (
        <div
          className="
            mt-3
            pt-3
            border-t
            border-gray-100
            dark:border-gray-700
          "
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <FlaskConical className="w-3 h-3 text-purple-500" />
            <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
              Active Ingredients
            </span>
          </div>
          <ul className="ml-4 space-y-0.5">
            {drug.ingredients.map((ingredient) => (
              <li
                key={ingredient}
                className="text-xs text-gray-600 dark:text-gray-400 list-disc"
              >
                {ingredient}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Related Drugs Section - Only shown when expanded */}
      {drug.relatedDrugs && drug.relatedDrugs.length > 0 && isExpanded && (
        <div
          className="
            mt-3
            pt-3
            border-t
            border-gray-100
            dark:border-gray-700
          "
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <Layers className="w-3 h-3 text-blue-500" />
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
              Related Strengths/Forms
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {drug.relatedDrugs.slice(0, 5).map((related) => (
              <span
                key={related.rxcui}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                title={related.name}
              >
                {related.strength || related.dosageForm}
              </span>
            ))}
            {drug.relatedDrugs.length > 5 && (
              <span className="text-[10px] text-gray-400 dark:text-gray-500 self-center">
                +{drug.relatedDrugs.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}

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
});

export default DrugCard;
