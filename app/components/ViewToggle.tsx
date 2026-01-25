/**
 * ViewToggle Component
 * ====================
 * 
 * A toggle button group to switch between List and Mind Map views.
 * 
 * DESIGN:
 * - Two buttons side by side
 * - Active button has HealthVerity green background
 * - Inactive button has gray background
 * - Smooth transition animation
 * 
 * ICONS:
 * - LayoutGrid: Represents the card grid (List View)
 * - Network: Represents the node graph (Mind Map View)
 */

'use client';

import { LayoutGrid, Network } from 'lucide-react';
import { ViewMode } from '../types/icd';

// =============================================================================
// Props Interface
// =============================================================================

interface ViewToggleProps {
  /** Currently active view mode */
  currentView: ViewMode;
  
  /** Callback when user changes the view */
  onViewChange: (view: ViewMode) => void;
  
  /** Whether to disable the toggle (e.g., during loading) */
  disabled?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export default function ViewToggle({ 
  currentView, 
  onViewChange,
  disabled = false 
}: ViewToggleProps) {
  return (
    <div 
      className="
        inline-flex
        rounded-xl
        bg-gray-100
        dark:bg-gray-800
        p-1
        gap-1
      "
      role="tablist"
      aria-label="View mode toggle"
    >
      {/* List View Button */}
      <button
        type="button"
        role="tab"
        aria-selected={currentView === 'list'}
        aria-label="List view"
        disabled={disabled}
        onClick={() => onViewChange('list')}
        className={`
          flex
          items-center
          gap-2
          px-4
          py-2
          rounded-lg
          text-sm
          font-medium
          transition-all
          duration-200
          disabled:opacity-50
          disabled:cursor-not-allowed
          ${currentView === 'list'
            ? 'bg-white dark:bg-gray-700 text-[#00A66C] dark:text-[#00D084] shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }
        `}
      >
        <LayoutGrid className="w-4 h-4" />
        <span className="hidden sm:inline">List</span>
      </button>
      
      {/* Mind Map View Button */}
      <button
        type="button"
        role="tab"
        aria-selected={currentView === 'mindmap'}
        aria-label="Mind map view"
        disabled={disabled}
        onClick={() => onViewChange('mindmap')}
        className={`
          flex
          items-center
          gap-2
          px-4
          py-2
          rounded-lg
          text-sm
          font-medium
          transition-all
          duration-200
          disabled:opacity-50
          disabled:cursor-not-allowed
          ${currentView === 'mindmap'
            ? 'bg-white dark:bg-gray-700 text-[#00A66C] dark:text-[#00D084] shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }
        `}
      >
        <Network className="w-4 h-4" />
        <span className="hidden sm:inline">Mind Map</span>
      </button>
    </div>
  );
}
