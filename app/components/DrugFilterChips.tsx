/**
 * DrugFilterChips Component
 * =========================
 *
 * Filter chips for filtering drugs by dosage form (Tablet, Injection, etc.)
 * Displays clickable chips that toggle on/off to filter the drug list.
 *
 * BEHAVIOR:
 * - When no filters selected: show all drugs
 * - When filters selected: show drugs matching ANY selected form (OR logic)
 * - Multiple filters can be selected simultaneously
 * - Clear button resets all filters
 */

'use client';

import { memo } from 'react';
import { X, Filter } from 'lucide-react';

// =============================================================================
// Props Interface
// =============================================================================

interface DrugFilterChipsProps {
  /** List of available dosage forms to filter by */
  availableForms: string[];
  /** Currently selected filter forms */
  selectedForms: string[];
  /** Callback when a form chip is toggled */
  onToggleForm: (form: string) => void;
  /** Callback to clear all filters */
  onClearFilters: () => void;
}

// =============================================================================
// Component
// =============================================================================

const DrugFilterChips = memo(function DrugFilterChips({
  availableForms,
  selectedForms,
  onToggleForm,
  onClearFilters,
}: DrugFilterChipsProps) {
  // Don't render if there's only one form (nothing to filter)
  if (availableForms.length <= 1) {
    return null;
  }

  const hasActiveFilters = selectedForms.length > 0;

  return (
    <div className="mb-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Filter className="w-3 h-3 text-gray-400" />
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Filter by form
          </span>
        </div>

        {/* Clear button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="
              flex items-center gap-1
              px-1.5 py-0.5
              text-[10px] font-medium
              text-gray-500 dark:text-gray-400
              hover:text-gray-700 dark:hover:text-gray-300
              hover:bg-gray-100 dark:hover:bg-gray-700
              rounded
              transition-colors
            "
          >
            <X className="w-2.5 h-2.5" />
            Clear
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {availableForms.map((form) => {
          const isSelected = selectedForms.includes(form);

          return (
            <button
              key={form}
              type="button"
              onClick={() => onToggleForm(form)}
              className={`
                px-2 py-1
                text-[11px] font-medium
                rounded-full
                border
                transition-all
                ${
                  isSelected
                    ? 'bg-blue-500 text-white border-blue-500 dark:bg-blue-600 dark:border-blue-600'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                }
              `}
            >
              {form}
            </button>
          );
        })}
      </div>
    </div>
  );
});

export default DrugFilterChips;
