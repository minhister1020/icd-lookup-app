/**
 * CategorySection Component
 * =========================
 * 
 * A collapsible accordion section that displays ICD-10 search results
 * grouped by chapter (body system / disease category).
 * 
 * DESIGN FEATURES:
 * - Color-coded left border per chapter
 * - Smooth expand/collapse animation
 * - Chapter icon and name with result count
 * - Chevron rotation animation
 * - Keyboard accessible (Enter/Space to toggle)
 * - Screen reader friendly (aria-expanded, role)
 * 
 * @example
 * <CategorySection
 *   category={endocrineCategory}
 *   onToggle={(chapterId) => handleToggle(chapterId)}
 *   onToggleFavorite={(code, name) => toggleFavorite(code, name)}
 *   isFavorite={(code) => favorites.has(code)}
 * />
 */

'use client';

import { useMemo, memo } from 'react';
import { 
  ChevronDown,
  Bug,
  Heart,
  Activity,
  Brain,
  Eye,
  Ear,
  Wind,
  Utensils,
  Shirt,
  Bone,
  Baby,
  Dna,
  Stethoscope,
  Bandage,
  Car,
  ClipboardList,
  CircleDot,
  Droplets,
  type LucideIcon
} from 'lucide-react';
import { CategoryGroup, ScoredICD10Result } from '../types/icd';
import ResultCard from './ResultCard';
import { DrugResult, ClinicalTrialResult } from '../types/icd';

// =============================================================================
// Chapter Icon Mapping
// =============================================================================

/**
 * Maps ICD-10 chapter IDs to appropriate Lucide icons.
 * Icons are chosen to represent the body system or condition type.
 */
const CHAPTER_ICONS: Record<number, LucideIcon> = {
  0: CircleDot,      // Unknown
  1: Bug,            // Infectious diseases
  2: CircleDot,      // Neoplasms (tumors)
  3: Droplets,       // Blood diseases
  4: Activity,       // Endocrine/Metabolic
  5: Brain,          // Mental disorders
  6: Brain,          // Nervous system
  7: Eye,            // Eye diseases
  8: Ear,            // Ear diseases
  9: Heart,          // Circulatory
  10: Wind,          // Respiratory
  11: Utensils,      // Digestive
  12: Shirt,         // Skin diseases (using shirt as skin covering)
  13: Bone,          // Musculoskeletal
  14: CircleDot,     // Genitourinary
  15: Baby,          // Pregnancy
  16: Baby,          // Perinatal
  17: Dna,           // Congenital/Chromosomal
  18: Stethoscope,   // Symptoms/Signs
  19: Bandage,       // Injuries
  20: Car,           // External causes
  21: ClipboardList, // Health factors
};

/**
 * Get the icon component for a chapter.
 */
function getChapterIcon(chapterId: number): LucideIcon {
  return CHAPTER_ICONS[chapterId] || CircleDot;
}

// =============================================================================
// Color Classes Helper
// =============================================================================

/**
 * Get Tailwind color classes for a chapter.
 * Returns classes for border, background, and text styling.
 */
function getChapterColorClasses(color: string): {
  border: string;
  bgLight: string;
  bgAccent: string;
  text: string;
  textMuted: string;
} {
  // Map chapter colors to full Tailwind class sets
  const colorMap: Record<string, {
    border: string;
    bgLight: string;
    bgAccent: string;
    text: string;
    textMuted: string;
  }> = {
    red: {
      border: 'border-l-red-500',
      bgLight: 'bg-red-50 dark:bg-red-900/10',
      bgAccent: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-700 dark:text-red-400',
      textMuted: 'text-red-600 dark:text-red-500',
    },
    pink: {
      border: 'border-l-pink-500',
      bgLight: 'bg-pink-50 dark:bg-pink-900/10',
      bgAccent: 'bg-pink-100 dark:bg-pink-900/30',
      text: 'text-pink-700 dark:text-pink-400',
      textMuted: 'text-pink-600 dark:text-pink-500',
    },
    rose: {
      border: 'border-l-rose-500',
      bgLight: 'bg-rose-50 dark:bg-rose-900/10',
      bgAccent: 'bg-rose-100 dark:bg-rose-900/30',
      text: 'text-rose-700 dark:text-rose-400',
      textMuted: 'text-rose-600 dark:text-rose-500',
    },
    emerald: {
      border: 'border-l-emerald-500',
      bgLight: 'bg-emerald-50 dark:bg-emerald-900/10',
      bgAccent: 'bg-emerald-100 dark:bg-emerald-900/30',
      text: 'text-emerald-700 dark:text-emerald-400',
      textMuted: 'text-emerald-600 dark:text-emerald-500',
    },
    violet: {
      border: 'border-l-violet-500',
      bgLight: 'bg-violet-50 dark:bg-violet-900/10',
      bgAccent: 'bg-violet-100 dark:bg-violet-900/30',
      text: 'text-violet-700 dark:text-violet-400',
      textMuted: 'text-violet-600 dark:text-violet-500',
    },
    purple: {
      border: 'border-l-purple-500',
      bgLight: 'bg-purple-50 dark:bg-purple-900/10',
      bgAccent: 'bg-purple-100 dark:bg-purple-900/30',
      text: 'text-purple-700 dark:text-purple-400',
      textMuted: 'text-purple-600 dark:text-purple-500',
    },
    cyan: {
      border: 'border-l-cyan-500',
      bgLight: 'bg-cyan-50 dark:bg-cyan-900/10',
      bgAccent: 'bg-cyan-100 dark:bg-cyan-900/30',
      text: 'text-cyan-700 dark:text-cyan-400',
      textMuted: 'text-cyan-600 dark:text-cyan-500',
    },
    teal: {
      border: 'border-l-teal-500',
      bgLight: 'bg-teal-50 dark:bg-teal-900/10',
      bgAccent: 'bg-teal-100 dark:bg-teal-900/30',
      text: 'text-teal-700 dark:text-teal-400',
      textMuted: 'text-teal-600 dark:text-teal-500',
    },
    sky: {
      border: 'border-l-sky-500',
      bgLight: 'bg-sky-50 dark:bg-sky-900/10',
      bgAccent: 'bg-sky-100 dark:bg-sky-900/30',
      text: 'text-sky-700 dark:text-sky-400',
      textMuted: 'text-sky-600 dark:text-sky-500',
    },
    blue: {
      border: 'border-l-blue-500',
      bgLight: 'bg-blue-50 dark:bg-blue-900/10',
      bgAccent: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-400',
      textMuted: 'text-blue-600 dark:text-blue-500',
    },
    indigo: {
      border: 'border-l-indigo-500',
      bgLight: 'bg-indigo-50 dark:bg-indigo-900/10',
      bgAccent: 'bg-indigo-100 dark:bg-indigo-900/30',
      text: 'text-indigo-700 dark:text-indigo-400',
      textMuted: 'text-indigo-600 dark:text-indigo-500',
    },
    amber: {
      border: 'border-l-amber-500',
      bgLight: 'bg-amber-50 dark:bg-amber-900/10',
      bgAccent: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-700 dark:text-amber-400',
      textMuted: 'text-amber-600 dark:text-amber-500',
    },
    orange: {
      border: 'border-l-orange-500',
      bgLight: 'bg-orange-50 dark:bg-orange-900/10',
      bgAccent: 'bg-orange-100 dark:bg-orange-900/30',
      text: 'text-orange-700 dark:text-orange-400',
      textMuted: 'text-orange-600 dark:text-orange-500',
    },
    yellow: {
      border: 'border-l-yellow-500',
      bgLight: 'bg-yellow-50 dark:bg-yellow-900/10',
      bgAccent: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-700 dark:text-yellow-400',
      textMuted: 'text-yellow-600 dark:text-yellow-500',
    },
    lime: {
      border: 'border-l-lime-500',
      bgLight: 'bg-lime-50 dark:bg-lime-900/10',
      bgAccent: 'bg-lime-100 dark:bg-lime-900/30',
      text: 'text-lime-700 dark:text-lime-400',
      textMuted: 'text-lime-600 dark:text-lime-500',
    },
    green: {
      border: 'border-l-green-500',
      bgLight: 'bg-green-50 dark:bg-green-900/10',
      bgAccent: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-700 dark:text-green-400',
      textMuted: 'text-green-600 dark:text-green-500',
    },
    fuchsia: {
      border: 'border-l-fuchsia-500',
      bgLight: 'bg-fuchsia-50 dark:bg-fuchsia-900/10',
      bgAccent: 'bg-fuchsia-100 dark:bg-fuchsia-900/30',
      text: 'text-fuchsia-700 dark:text-fuchsia-400',
      textMuted: 'text-fuchsia-600 dark:text-fuchsia-500',
    },
    slate: {
      border: 'border-l-slate-500',
      bgLight: 'bg-slate-50 dark:bg-slate-900/10',
      bgAccent: 'bg-slate-100 dark:bg-slate-900/30',
      text: 'text-slate-700 dark:text-slate-400',
      textMuted: 'text-slate-600 dark:text-slate-500',
    },
    gray: {
      border: 'border-l-gray-500',
      bgLight: 'bg-gray-50 dark:bg-gray-900/10',
      bgAccent: 'bg-gray-100 dark:bg-gray-800/50',
      text: 'text-gray-700 dark:text-gray-400',
      textMuted: 'text-gray-600 dark:text-gray-500',
    },
  };

  return colorMap[color] || colorMap.gray;
}

// =============================================================================
// Props Interface
// =============================================================================

interface CategorySectionProps {
  /** The category group containing chapter info and results */
  category: CategoryGroup;
  
  /** Callback when the category header is clicked to toggle expand/collapse */
  onToggle: (chapterId: number) => void;
  
  /** Whether this is the first (most relevant) category - for "Top Match" context */
  isFirstCategory?: boolean;
  
  /** Callback to toggle favorite status for a result */
  onToggleFavorite?: (code: string, name: string) => void;
  
  /** Check if a code is favorited */
  isFavorite?: (code: string) => boolean;
  
  /** Optional: Callback when drugs are loaded (for caching) */
  onDrugsLoaded?: (icdCode: string, drugs: DrugResult[]) => void;
  
  /** Optional: Callback when trials are loaded (for caching) */
  onTrialsLoaded?: (icdCode: string, trials: ClinicalTrialResult[]) => void;
}

// =============================================================================
// Component
// =============================================================================

const CategorySection = memo(function CategorySection({
  category,
  onToggle,
  isFirstCategory = false,
  onToggleFavorite,
  isFavorite,
  onDrugsLoaded,
  onTrialsLoaded,
}: CategorySectionProps) {
  const { chapter, results, isExpanded } = category;
  const colorClasses = useMemo(() => getChapterColorClasses(chapter.color), [chapter.color]);
  const IconComponent = useMemo(() => getChapterIcon(chapter.id), [chapter.id]);
  
  // Determine which results to show based on expanded state
  // When collapsed, show first 3 as a preview
  const PREVIEW_COUNT = 3;
  const displayedResults = isExpanded ? results : results.slice(0, PREVIEW_COUNT);
  const hasMoreResults = results.length > PREVIEW_COUNT;
  const hiddenCount = results.length - PREVIEW_COUNT;
  
  /**
   * Handle keyboard navigation for accessibility.
   * Allow Enter and Space to toggle the section.
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle(chapter.id);
    }
  };
  
  /**
   * Calculate the rank offset for results in this category.
   * The first category starts at rank 1, subsequent categories
   * need to account for results in previous categories.
   */
  const getRankForResult = (result: ScoredICD10Result, index: number): number | undefined => {
    // Only show rank badges in the first category (contains top matches)
    if (!isFirstCategory) return undefined;
    // 1-based ranking
    return index + 1;
  };
  
  return (
    <div 
      className={`
        rounded-xl
        overflow-hidden
        border
        border-gray-200
        dark:border-gray-700
        ${colorClasses.bgLight}
        border-l-4
        ${colorClasses.border}
        transition-all
        duration-200
      `}
    >
      {/* Clickable Header */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-controls={`category-content-${chapter.id}`}
        onClick={() => onToggle(chapter.id)}
        onKeyDown={handleKeyDown}
        className={`
          flex
          items-center
          justify-between
          gap-3
          px-4
          py-3
          cursor-pointer
          select-none
          hover:${colorClasses.bgAccent}
          transition-colors
          duration-150
          focus:outline-none
          focus:ring-2
          focus:ring-[#1976D2]
          focus:ring-inset
        `}
      >
        {/* Left: Icon + Chapter Name */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Chapter Icon */}
          <div 
            className={`
              flex-shrink-0
              w-8
              h-8
              rounded-lg
              ${colorClasses.bgAccent}
              flex
              items-center
              justify-center
            `}
          >
            <IconComponent 
              className={`w-4 h-4 ${colorClasses.text}`}
              aria-hidden="true"
            />
          </div>
          
          {/* Chapter Name */}
          <div className="min-w-0">
            <h3 
              className={`
                font-semibold
                text-sm
                ${colorClasses.text}
                truncate
              `}
            >
              {chapter.shortName}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate hidden sm:block">
              {chapter.codeRange}
            </p>
          </div>
        </div>
        
        {/* Right: Count Badge + Chevron */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Result Count Badge */}
          <span 
            className={`
              px-2.5
              py-1
              rounded-full
              text-xs
              font-medium
              ${colorClasses.bgAccent}
              ${colorClasses.textMuted}
            `}
          >
            {results.length} {results.length === 1 ? 'result' : 'results'}
          </span>
          
          {/* Expand/Collapse Chevron */}
          <ChevronDown 
            className={`
              w-5
              h-5
              text-gray-400
              dark:text-gray-500
              transition-transform
              duration-200
              ${isExpanded ? 'rotate-180' : 'rotate-0'}
            `}
            aria-hidden="true"
          />
        </div>
      </div>
      
      {/* Expandable Content */}
      <div
        id={`category-content-${chapter.id}`}
        className={`
          overflow-hidden
          transition-all
          duration-300
          ease-in-out
          ${isExpanded ? 'max-h-[5000px] opacity-100' : `max-h-0 opacity-0`}
        `}
      >
        {/* Results Grid */}
        <div className="p-4 pt-2 space-y-3">
          {displayedResults.map((result, index) => (
            <ResultCard
              key={result.code}
              code={result.code}
              name={result.name}
              score={result.score}
              rank={getRankForResult(result, index)}
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
          
          {/* "Show More" indicator when collapsed with hidden results */}
          {!isExpanded && hasMoreResults && (
            <button
              type="button"
              onClick={() => onToggle(chapter.id)}
              className={`
                w-full
                py-2
                text-center
                text-sm
                font-medium
                ${colorClasses.text}
                hover:underline
                transition-colors
              `}
            >
              Show {hiddenCount} more {hiddenCount === 1 ? 'result' : 'results'}
            </button>
          )}
        </div>
      </div>
      
      {/* Collapsed Preview - show when collapsed with results */}
      {!isExpanded && results.length > 0 && (
        <div className="px-4 pb-3 pt-1">
          {/* Preview of first few results as compact pills */}
          <div className="flex flex-wrap gap-1.5">
            {results.slice(0, 4).map((result) => (
              <span
                key={result.code}
                className={`
                  inline-flex
                  items-center
                  px-2
                  py-0.5
                  rounded-md
                  text-xs
                  font-mono
                  ${colorClasses.bgAccent}
                  ${colorClasses.textMuted}
                `}
                title={result.name}
              >
                {result.code}
              </span>
            ))}
            {results.length > 4 && (
              <span 
                className={`
                  inline-flex
                  items-center
                  px-2
                  py-0.5
                  rounded-md
                  text-xs
                  text-gray-500
                  dark:text-gray-400
                `}
              >
                +{results.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default CategorySection;
