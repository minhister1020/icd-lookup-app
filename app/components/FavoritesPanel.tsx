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
 * 
 * Phase 6D: Export/Import Features:
 * - Export favorites as JSON file
 * - Import favorites from JSON file
 * - Merge imported with existing (no duplicates)
 */

'use client';

import { useState, useRef } from 'react';
import { X, Star, Search, Trash2, Clock, Download, Upload, CheckCircle, AlertCircle } from 'lucide-react';
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
  
  /** Callback to import favorites (merge with existing) */
  onImport?: (imported: FavoriteICD[]) => void;
}

// Export format interface
interface FavoritesExport {
  version: string;
  exportDate: string;
  appName: string;
  count: number;
  favorites: FavoriteICD[];
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
  onImport,
}: FavoritesPanelProps) {
  // State for import/export status messages
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Clear status message after 3 seconds
  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 3000);
  };
  
  // Export favorites as JSON file
  const handleExport = () => {
    try {
      const exportData: FavoritesExport = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        appName: 'ICD Mind Map Lookup Tool',
        count: favorites.length,
        favorites: favorites
      };
      
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Generate filename with date
      const date = new Date().toISOString().split('T')[0];
      const filename = `icd-favorites-${date}.json`;
      
      // Create download link and click it
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showStatus('success', `Exported ${favorites.length} favorites`);
    } catch (error) {
      console.error('Export failed:', error);
      showStatus('error', 'Export failed');
    }
  };
  
  // Import favorites from JSON file
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        // Validate structure
        if (!data.favorites || !Array.isArray(data.favorites)) {
          throw new Error('Invalid format: missing favorites array');
        }
        
        // Validate each favorite has required fields
        const validFavorites: FavoriteICD[] = data.favorites.filter(
          (f: unknown): f is FavoriteICD =>
            typeof f === 'object' &&
            f !== null &&
            'code' in f &&
            'name' in f &&
            typeof (f as FavoriteICD).code === 'string' &&
            typeof (f as FavoriteICD).name === 'string'
        ).map((f: FavoriteICD) => ({
          ...f,
          // Ensure favoritedAt exists
          favoritedAt: f.favoritedAt || new Date().toISOString()
        }));
        
        if (validFavorites.length === 0) {
          throw new Error('No valid favorites found in file');
        }
        
        // Call import handler
        if (onImport) {
          onImport(validFavorites);
          showStatus('success', `Imported ${validFavorites.length} favorites`);
        }
      } catch (error) {
        console.error('Import failed:', error);
        const message = error instanceof Error ? error.message : 'Invalid file format';
        showStatus('error', message);
      }
    };
    
    reader.onerror = () => {
      showStatus('error', 'Failed to read file');
    };
    
    reader.readAsText(file);
    
    // Reset file input so same file can be re-imported
    event.target.value = '';
  };
  
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
                      
                      {/* Actions - Always visible on mobile, hover on desktop */}
                      <div className="
                        flex items-center gap-1.5
                        sm:opacity-0 sm:group-hover:opacity-100
                        transition-all duration-200
                      ">
                        {/* Search Button */}
                        <button
                          onClick={() => {
                            onSearch(favorite.code);
                            onClose();
                          }}
                          className="
                            w-9 h-9 sm:w-8 sm:h-8 rounded-xl sm:rounded-full
                            bg-[#00D084]/10 hover:bg-[#00D084]/20
                            active:bg-[#00D084]/30
                            text-[#00A66C] dark:text-[#00D084]
                            flex items-center justify-center
                            transition-all duration-200
                            hover:scale-110 active:scale-95
                          "
                          title="Search this code"
                          aria-label={`Search for ${favorite.code}`}
                        >
                          <Search className="w-4 h-4" />
                        </button>
                        
                        {/* Remove Button */}
                        <button
                          onClick={() => onRemove(favorite.code)}
                          className="
                            w-9 h-9 sm:w-8 sm:h-8 rounded-xl sm:rounded-full
                            bg-red-50 hover:bg-red-100 active:bg-red-200
                            dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:active:bg-red-900/60
                            text-red-500
                            flex items-center justify-center
                            transition-all duration-200
                            hover:scale-110 active:scale-95
                          "
                          title="Remove from favorites"
                          aria-label={`Remove ${favorite.code} from favorites`}
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
        <div className="
          px-6 py-4
          border-t border-gray-200 dark:border-gray-700
          bg-gray-50 dark:bg-gray-800/50
          space-y-3
        ">
          {/* Status Message */}
          {statusMessage && (
            <div className={`
              flex items-center gap-2 p-2 rounded-lg text-sm
              animate-in fade-in slide-in-from-bottom-2 duration-200
              ${statusMessage.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
              }
            `}>
              {statusMessage.type === 'success' 
                ? <CheckCircle className="w-4 h-4" /> 
                : <AlertCircle className="w-4 h-4" />
              }
              {statusMessage.text}
            </div>
          )}
          
          {/* Export/Import Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              disabled={favorites.length === 0}
              className="
                flex-1 py-2 px-3
                rounded-lg
                bg-blue-50 hover:bg-blue-100
                dark:bg-blue-900/20 dark:hover:bg-blue-900/40
                text-blue-600 dark:text-blue-400
                text-sm font-medium
                flex items-center justify-center gap-2
                transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="
                flex-1 py-2 px-3
                rounded-lg
                bg-purple-50 hover:bg-purple-100
                dark:bg-purple-900/20 dark:hover:bg-purple-900/40
                text-purple-600 dark:text-purple-400
                text-sm font-medium
                flex items-center justify-center gap-2
                transition-colors
              "
            >
              <Upload className="w-4 h-4" />
              Import
            </button>
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </div>
          
          {/* Clear All Button */}
          {favorites.length > 0 && (
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
              Clear All
            </button>
          )}
        </div>
      </div>
    </>
  );
}
