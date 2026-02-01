/**
 * HistoryPanel Component
 * ======================
 * 
 * A slide-in panel that displays search history with timestamps.
 * 
 * Phase 6C: Features:
 * - View all search history
 * - Display timestamp (relative time)
 * - Show result count for each search
 * - Click to re-search
 * - Remove individual entries
 * - Clear all history
 * - Empty state when no history
 */

'use client';

import { X, Clock, Search, Trash2, Hash } from 'lucide-react';
import { SearchHistoryEntry } from '../types/icd';
import { formatRelativeTime } from '../lib/favoritesStorage';

// =============================================================================
// Props Interface
// =============================================================================

interface HistoryPanelProps {
  /** Whether the panel is open */
  isOpen: boolean;
  
  /** Callback to close the panel */
  onClose: () => void;
  
  /** Array of search history entries */
  history: SearchHistoryEntry[];
  
  /** Callback to remove a history entry by query */
  onRemove: (query: string) => void;
  
  /** Callback to search a history item */
  onSearch: (query: string) => void;
  
  /** Callback to clear all history */
  onClearAll: () => void;
}

// =============================================================================
// Component
// =============================================================================

export default function HistoryPanel({
  isOpen,
  onClose,
  history,
  onRemove,
  onSearch,
  onClearAll,
}: HistoryPanelProps) {
  // Don't render if not open
  if (!isOpen) return null;
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="
          fixed inset-0 z-40
          bg-black/20 dark:bg-black/40
          backdrop-blur-sm
          animate-in fade-in duration-200
        "
        onClick={onClose}
      />
      
      {/* Panel */}
      <div 
        className="
          fixed right-0 top-0 bottom-0 z-50
          w-full sm:w-96 sm:max-w-md
          bg-white dark:bg-gray-900
          shadow-2xl
          border-l border-gray-200 dark:border-gray-700
          animate-in slide-in-from-right duration-300
          flex flex-col
        "
      >
        {/* Header */}
        <div className="
          flex items-center justify-between
          px-6 py-4
          border-b border-gray-200 dark:border-gray-700
          bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20
        ">
          <div className="flex items-center gap-3">
            <div className="
              w-10 h-10 rounded-xl
              bg-blue-100 dark:bg-blue-900/30
              flex items-center justify-center
            ">
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white text-lg">
                Search History
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {history.length} {history.length === 1 ? 'search' : 'searches'}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="
              w-8 h-8 rounded-full
              bg-gray-100 dark:bg-gray-800
              hover:bg-gray-200 dark:hover:bg-gray-700
              flex items-center justify-center
              transition-colors
            "
            aria-label="Close history panel"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Empty State */}
          {history.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full px-6 py-12">
              <div className="
                w-16 h-16 rounded-full
                bg-gray-100 dark:bg-gray-800
                flex items-center justify-center mb-4
              ">
                <Clock className="w-8 h-8 text-gray-300 dark:text-gray-600" />
              </div>
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                No search history
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-xs">
                Your search history will appear here after you search for ICD codes.
              </p>
            </div>
          )}
          
          {/* History List */}
          {history.length > 0 && (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {history.map((entry, index) => (
                <div
                  key={`${entry.query}-${index}`}
                  className="
                    px-6 py-4
                    hover:bg-gray-50 dark:hover:bg-gray-800/50
                    transition-colors
                    group
                  "
                >
                  <div className="flex items-start gap-3">
                    {/* Search Icon */}
                    <div className="
                      w-8 h-8 rounded-lg flex-shrink-0
                      bg-blue-50 dark:bg-blue-900/20
                      flex items-center justify-center
                    ">
                      <Search className="w-4 h-4 text-blue-500" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Query */}
                      <p className="font-medium text-gray-800 dark:text-gray-200 truncate">
                        {entry.query}
                      </p>
                      
                      {/* Metadata */}
                      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-gray-400 dark:text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(entry.searchedAt)}
                        </span>
                        {entry.resultCount !== undefined && (
                          <span className="flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            {entry.resultCount.toLocaleString()} results
                          </span>
                        )}
                      </div>
                      
                      {/* Top Result Preview */}
                      {entry.topResultCode && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
                          Top: <span className="font-mono text-blue-500">{entry.topResultCode}</span>
                          {entry.topResultName && ` - ${entry.topResultName}`}
                        </p>
                      )}
                    </div>
                    
                    {/* Actions - Always visible on mobile */}
                    <div className="
                      flex items-center gap-1.5
                      sm:opacity-0 sm:group-hover:opacity-100
                      transition-all duration-200
                    ">
                      {/* Re-Search Button */}
                      <button
                        onClick={() => {
                          onSearch(entry.query);
                          onClose();
                        }}
                        className="
                          w-9 h-9 sm:w-8 sm:h-8 rounded-xl sm:rounded-full
                          bg-[#1976D2]/10 hover:bg-[#1976D2]/20
                          active:bg-[#1976D2]/30
                          text-[#0D47A1] dark:text-[#42A5F5]
                          flex items-center justify-center
                          transition-all duration-200
                          hover:scale-110 active:scale-95
                        "
                        title="Search again"
                        aria-label={`Search for ${entry.query}`}
                      >
                        <Search className="w-4 h-4" />
                      </button>
                      
                      {/* Remove Button */}
                      <button
                        onClick={() => onRemove(entry.query)}
                        className="
                          w-9 h-9 sm:w-8 sm:h-8 rounded-xl sm:rounded-full
                          bg-red-50 hover:bg-red-100 active:bg-red-200
                          dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:active:bg-red-900/60
                          text-red-500
                          flex items-center justify-center
                          transition-all duration-200
                          hover:scale-110 active:scale-95
                        "
                        title="Remove from history"
                        aria-label={`Remove ${entry.query} from history`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        {history.length > 0 && (
          <div className="
            px-6 py-4
            border-t border-gray-200 dark:border-gray-700
            bg-gray-50 dark:bg-gray-800/50
          ">
            <button
              onClick={() => {
                if (confirm('Are you sure you want to clear all search history?')) {
                  onClearAll();
                }
              }}
              className="
                w-full py-2 px-4
                rounded-lg
                bg-red-50 hover:bg-red-100
                dark:bg-red-900/20 dark:hover:bg-red-900/40
                text-red-600 dark:text-red-400
                text-sm font-medium
                flex items-center justify-center gap-2
                transition-colors
              "
            >
              <Trash2 className="w-4 h-4" />
              Clear All History
            </button>
          </div>
        )}
      </div>
    </>
  );
}
