'use client';

import { memo } from 'react';
import { Activity, Heart, Stethoscope, Package, Layers } from 'lucide-react';
import { ProcedureCategory } from '../types/icd';

// ============================================================
// Types
// ============================================================

type FilterOption = 'all' | ProcedureCategory;

interface ProcedureFilterChipsProps {
  activeFilter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
  /** Counts per category for badge numbers */
  counts: Record<FilterOption, number>;
}

// ============================================================
// Filter Definitions
// ============================================================

const FILTERS: Array<{
  key: FilterOption;
  label: string;
  icon: typeof Activity;
  activeColors: string;
}> = [
  {
    key: 'all',
    label: 'All',
    icon: Layers,
    activeColors: 'bg-teal-600 text-white border-teal-600 dark:bg-teal-500 dark:border-teal-500',
  },
  {
    key: 'diagnostic',
    label: 'Diagnostic',
    icon: Activity,
    activeColors: 'bg-sky-600 text-white border-sky-600 dark:bg-sky-500 dark:border-sky-500',
  },
  {
    key: 'therapeutic',
    label: 'Therapeutic',
    icon: Heart,
    activeColors: 'bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-500 dark:border-emerald-500',
  },
  {
    key: 'monitoring',
    label: 'Monitoring',
    icon: Stethoscope,
    activeColors: 'bg-amber-600 text-white border-amber-600 dark:bg-amber-500 dark:border-amber-500',
  },
  {
    key: 'equipment',
    label: 'Equipment',
    icon: Package,
    activeColors: 'bg-violet-600 text-white border-violet-600 dark:bg-violet-500 dark:border-violet-500',
  },
];

// ============================================================
// Component
// ============================================================

const ProcedureFilterChips = memo(function ProcedureFilterChips({
  activeFilter,
  onFilterChange,
  counts,
}: ProcedureFilterChipsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {FILTERS.map(({ key, label, icon: Icon, activeColors }) => {
        const isActive = activeFilter === key;
        const count = counts[key] ?? 0;

        // Hide filters with zero results (except "All")
        if (key !== 'all' && count === 0) return null;

        return (
          <button
            key={key}
            onClick={(e) => {
              e.stopPropagation();
              onFilterChange(key);
            }}
            className={`
              inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium
              border transition-all duration-150
              ${isActive
                ? activeColors
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
              }
            `}
          >
            <Icon className="h-3 w-3" />
            {label}
            <span className={`
              ml-0.5 px-1.5 py-0 rounded-full text-[10px] font-bold
              ${isActive
                ? 'bg-white/20 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }
            `}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
});

export default ProcedureFilterChips;
export type { FilterOption };
