/**
 * FavoritesPanel Component
 * ========================
 * 
 * A slide-in panel that displays saved favorites.
 * 
 * Phase 6: Features:
 * - View all saved favorites
 * - Click to search a favorite
 * - Remove individual favorites
 * - Clear all favorites
 * - Color-coded by category
 * - Relative timestamps
 * - Empty state when no favorites
 */

'use client';

import { X, Star, Search, Trash2, Clock } from 'lucide-react';
import { FavoriteICD, getCategoryColor } from '../types/icd';
import { formatRelativeTime } from '../lib/favoritesStorage';

// =============================================================================
// Props Interface
// =============================================================================

interface FavoritesPanelProps {
  /** Whether the panel is open */
  isOpen: boolean;
  
  /** Callback to close the panel */
  onClose: () => void;
  
  /** Array of saved favorites */
  favorites: FavoriteICD[];
  
  /** Callback to remove a favorite by code */
  onRemove: (code: string) => void;
  
  /** Callback to search for a favorite */
  onSearch: (code: string) => void;
  
  /** Callback to clear all favorites */
  onClearAll: () => void;
}

// =============================================================================
// Component
// =============================================================================

export default function FavoritesPanel({
  isOpen,
  onClose,
  favorites,
  onRemove,
  onSearch,
  onClearAll,
}: FavoritesPanelProps) {
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
          w-full max-w-md
          bg-white dark:bg-gray-900
          shadow-2xl
          animate-in slide-in-from-right duration-300
          flex flex-col
        "
      >
        {/* Header */}
        <div className="
          flex items-center justify-between
          px-6 py-4
          border-b border-gray-200 dark:border-gray-700
          bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20
        ">
          <div className="flex items-center gap-3">
            <div className="
              w-10 h-10 rounded-xl
              bg-yellow-100 dark:bg-yellow-900/30
              flex items-center justify-center
            ">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white text-lg">
                Favorites
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {favorites.length} saved {favorites.length === 1 ? 'code' : 'codes'}
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
            aria-label="Close favorites panel"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Empty State */}
          {favorites.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full px-6 py-12">
              <div className="
                w-16 h-16 rounded-full
                bg-gray-100 dark:bg-gray-800
                flex items-center justify-center mb-4
              ">
                <Star className="w-8 h-8 text-gray-300 dark:text-gray-600" />
              </div>
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                No favorites yet
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-xs">
                Click the star icon on any search result to save it to your favorites.
              </p>
            </div>
          )}
          
          {/* Favorites List */}
          {favorites.length > 0 && (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {favorites.map((favorite) => {
                const colors = getCategoryColor(favorite.code);
                
                return (
                  <div
                    key={favorite.code}
                    className="
                      px-6 py-4
                      hover:bg-gray-50 dark:hover:bg-gray-800/50
                      transition-colors
                      group
                    "
                  >
                    <div className="flex items-start gap-3">
                      {/* Category Color Indicator */}
                      <div className={`
                        w-1 h-full min-h-[60px] rounded-full flex-shrink-0
                        ${colors.bg}
                      `} />
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Code Badge */}
                        <div className={`
                          inline-flex items-center
                          px-2 py-1 rounded-md
                          ${colors.bg} ${colors.text}
                          font-mono font-bold text-sm
                          mb-1
                        `}>
                          {favorite.code}
                        </div>
                        
                        {/* Name */}
                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-1">
                          {favorite.name}
                        </p>
                        
                        {/* Metadata */}
                        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatRelativeTime(favorite.favoritedAt)}
                          </span>
                          {favorite.score && (
                            <span>Score: {favorite.score}</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="
                        flex items-center gap-1
                        opacity-0 group-hover:opacity-100
                        transition-opacity
                      ">
                        {/* Search Button */}
                        <button
                          onClick={() => {
                            onSearch(favorite.code);
                            onClose();
                          }}
                          className="
                            w-8 h-8 rounded-full
                            bg-[#00D084]/10 hover:bg-[#00D084]/20
                            text-[#00A66C] dark:text-[#00D084]
                            flex items-center justify-center
                            transition-colors
                          "
                          title="Search this code"
                        >
                          <Search className="w-4 h-4" />
                        </button>
                        
                        {/* Remove Button */}
                        <button
                          onClick={() => onRemove(favorite.code)}
                          className="
                            w-8 h-8 rounded-full
                            bg-red-50 hover:bg-red-100
                            dark:bg-red-900/20 dark:hover:bg-red-900/40
                            text-red-500
                            flex items-center justify-center
                            transition-colors
                          "
                          title="Remove from favorites"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Footer */}
        {favorites.length > 0 && (
          <div className="
            px-6 py-4
            border-t border-gray-200 dark:border-gray-700
            bg-gray-50 dark:bg-gray-800/50
          ">
            <button
              onClick={() => {
                if (confirm('Are you sure you want to remove all favorites?')) {
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
              Clear All Favorites
            </button>
          </div>
        )}
      </div>
    </>
  );
}
