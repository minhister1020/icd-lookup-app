/**
 * SearchResults Component
 * =======================
 * 
 * Container component with professional styling for all result states.
 * 
 * Phase 3C: Now supports:
 * - Passing drugsMap and trialsMap to MindMapView
 * - Callbacks to notify parent when drugs/trials are loaded
 * - Multi-node mind map visualization
 * 
 * Phase 4: Added support for:
 * - Scored results with relevance ranking
 * - Total count display ("847 results, showing top 25")
 * - hasMore flag for future "Load More" functionality
 */

import { AlertCircle, SearchX, Sparkles, Loader2, ChevronDown, Lightbulb } from 'lucide-react';
import { ScoredICD10Result, ViewMode, DrugResult, ClinicalTrialResult, TranslationResult, FavoriteICD } from '../types/icd';
import ResultCard from './ResultCard';
import ViewToggle from './ViewToggle';
import MindMapView from './MindMapView';

// =============================================================================
// Translation Badge Component (Phase 5)
// =============================================================================

interface TranslationBadgeProps {
  translation: TranslationResult;
}

function TranslationBadge({ translation }: TranslationBadgeProps) {
  if (!translation.wasTranslated) return null;
  
  return (
    <div className="
      mb-4
      p-3
      rounded-xl
      bg-gradient-to-r from-blue-50 to-indigo-50
      dark:from-blue-900/20 dark:to-indigo-900/20
      border border-blue-200/50
      dark:border-blue-800/50
      animate-in fade-in slide-in-from-top-2
      duration-300
    ">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="
          flex-shrink-0
          w-8 h-8
          rounded-lg
          bg-blue-100 dark:bg-blue-800/30
          flex items-center justify-center
        ">
          <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Showing results for{' '}
            <span className="font-semibold text-blue-700 dark:text-blue-300">
              &ldquo;{translation.medicalTerm}&rdquo;
            </span>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            You searched: &ldquo;{translation.originalTerm}&rdquo;
            {translation.icdHint && (
              <span className="ml-2 text-blue-500 dark:text-blue-400">
                • Related codes: {translation.icdHint}*
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Skeleton Card Component
// =============================================================================

function SkeletonCard({ delay = 0 }: { delay?: number }) {
  return (
    <div 
      className="
        p-5
        bg-white
        dark:bg-gray-800
        rounded-2xl
        border
        border-gray-100
        dark:border-gray-700
        animate-pulse
      "
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 mb-3">
        <div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded" />
      </div>
      
      <div className="space-y-2">
        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 w-3/4 bg-gray-100 dark:bg-gray-800 rounded" />
      </div>
    </div>
  );
}

// =============================================================================
// Props Interface
// =============================================================================

interface SearchResultsProps {
  results: ScoredICD10Result[];
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  
  // Phase 3C: Centralized drug/trial data for Mind Map
  drugsMap?: Map<string, DrugResult[]>;
  trialsMap?: Map<string, ClinicalTrialResult[]>;
  
  // Callbacks when drugs/trials are loaded in ResultCards
  onDrugsLoaded?: (icdCode: string, drugs: DrugResult[]) => void;
  onTrialsLoaded?: (icdCode: string, trials: ClinicalTrialResult[]) => void;
  
  // Phase 4: Search metadata for pagination/display
  totalCount?: number;
  hasMore?: boolean;
  
  // Phase 4C: Load More functionality
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  
  // Phase 5: Translation metadata for displaying translation notice
  translation?: TranslationResult;
  
  // Phase 6: Favorites functionality
  favorites?: FavoriteICD[];
  favoritesMap?: Map<string, FavoriteICD>;
  onToggleFavorite?: (result: ScoredICD10Result) => void;
  onRemoveFavorite?: (code: string) => void;
  onClearAllFavorites?: () => void;
  isFavorited?: (code: string) => boolean;
  showFavoritesPanel?: boolean;
  onToggleFavoritesPanel?: () => void;
  onSearchFromFavorite?: (code: string) => void;
}

// =============================================================================
// Component
// =============================================================================

export default function SearchResults({ 
  results, 
  isLoading, 
  error,
  hasSearched,
  viewMode,
  onViewModeChange,
  drugsMap = new Map(),
  trialsMap = new Map(),
  onDrugsLoaded,
  onTrialsLoaded,
  totalCount = 0,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
  translation,
  // Phase 6: Favorites props
  favorites = [],
  favoritesMap = new Map(),
  onToggleFavorite,
  onRemoveFavorite,
  onClearAllFavorites,
  isFavorited,
  showFavoritesPanel = false,
  onToggleFavoritesPanel,
  onSearchFromFavorite,
}: SearchResultsProps) {
  
  // Count total nodes for display
  const drugCount = Array.from(drugsMap.values()).reduce((sum, arr) => sum + arr.length, 0);
  const trialCount = Array.from(trialsMap.values()).reduce((sum, arr) => sum + arr.length, 0);
  const totalNodes = results.length + drugCount + trialCount;
  
  // Phase 4: Calculate if showing subset of results
  const showingSubset = totalCount > results.length;
  
  // =========================================================================
  // State 1: Loading
  // =========================================================================
  
  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            <div className="h-4 w-48 bg-gray-100 dark:bg-gray-800 rounded mt-2 animate-pulse" />
          </div>
          <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <SkeletonCard key={index} delay={index * 100} />
          ))}
        </div>
        
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8 animate-pulse">
          Searching ICD-10 database...
        </p>
      </div>
    );
  }
  
  // =========================================================================
  // State 2: Error
  // =========================================================================
  
  if (error) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
            Search Failed
          </h3>
          <p className="text-red-600 dark:text-red-300 text-sm mb-4">
            {error}
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-xs">
            Please check your internet connection and try again.
          </p>
        </div>
      </div>
    );
  }
  
  // =========================================================================
  // State 3: No Results
  // =========================================================================
  
  if (hasSearched && results.length === 0) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
            <SearchX className="w-7 h-7 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No Results Found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
            We couldn&apos;t find any ICD-10 codes matching your search.
          </p>
          <div className="text-left bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Search Tips
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Try a different spelling</li>
              <li>• Use broader terms (e.g., &quot;diabetes&quot; instead of &quot;diabetic&quot;)</li>
              <li>• Search by ICD-10 code directly (e.g., &quot;E11&quot;)</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
  
  // =========================================================================
  // State 4: Initial State
  // =========================================================================
  
  if (!hasSearched) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-gradient-to-br from-[#00D084]/5 to-[#00A66C]/5 border border-[#00D084]/20 rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00D084]/20 to-[#00A66C]/20 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7 text-[#00D084]" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Ready to Search
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
            Enter a condition name or ICD-10 code above to get started.
          </p>
          
          <div className="flex flex-wrap justify-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400">
              🔍 ICD-10 Search
            </span>
            <span className="px-3 py-1 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400">
              💊 Drug Info
            </span>
            <span className="px-3 py-1 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400">
              🔬 Clinical Trials
            </span>
          </div>
        </div>
      </div>
    );
  }
  
  // =========================================================================
  // State 5: Has Results
  // =========================================================================
  
  return (
    <div>
      {/* Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Search Results
            {/* Phase 4: Show "ranked by relevance" indicator */}
            <span className="ml-2 text-xs font-normal text-[#00D084] bg-[#00D084]/10 px-2 py-0.5 rounded-full">
              Ranked by relevance
            </span>
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {/* Phase 4: Show total count with "showing top X" */}
            {showingSubset ? (
              <>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {totalCount.toLocaleString()}
                </span>
                {' results found, showing top '}
                <span className="font-medium text-[#00D084]">{results.length}</span>
              </>
            ) : (
              <>{results.length} ICD codes</>
            )}
            {drugCount > 0 && <span className="text-blue-500"> • {drugCount} drugs</span>}
            {trialCount > 0 && <span className="text-purple-500"> • {trialCount} trials</span>}
          </p>
        </div>
        
        {/* View Toggle + Count Badge */}
        <div className="flex items-center gap-3">
          <ViewToggle 
            currentView={viewMode}
            onViewChange={onViewModeChange}
          />
          <div className="flex items-center gap-1.5">
            <div className="px-3 py-1.5 rounded-full bg-[#00D084]/10 border border-[#00D084]/20">
              <span className="text-sm font-semibold text-[#00A66C] dark:text-[#00D084]">
                {viewMode === 'mindmap' ? totalNodes : results.length}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Phase 5: Translation Badge - Show when query was translated */}
      {translation?.wasTranslated && (
        <TranslationBadge translation={translation} />
      )}
      
      {/* Conditional View Rendering */}
      {viewMode === 'list' ? (
        /* List View - Card Grid */
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((result, index) => (
              <div 
                key={result.code}
                className="animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${Math.min(index, 10) * 50}ms`, animationFillMode: 'backwards' }}
              >
                <ResultCard
                  code={result.code}
                  name={result.name}
                  onDrugsLoaded={onDrugsLoaded}
                  onTrialsLoaded={onTrialsLoaded}
                  // Phase 4C: Pass relevance data for badges
                  score={result.score}
                  rank={index + 1}
                  // Phase 6: Favorites props
                  isFavorite={isFavorited ? isFavorited(result.code) : favoritesMap.has(result.code)}
                  onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(result) : undefined}
                />
              </div>
            ))}
          </div>
          
          {/* Phase 4C: Load More Button */}
          {hasMore && onLoadMore && (
            <div className="mt-8 text-center">
              <button
                onClick={onLoadMore}
                disabled={isLoadingMore}
                className="
                  inline-flex items-center gap-2
                  px-6 py-3
                  bg-white dark:bg-gray-800
                  border border-gray-200 dark:border-gray-700
                  rounded-xl
                  text-gray-700 dark:text-gray-300
                  font-medium
                  shadow-sm
                  hover:shadow-md
                  hover:border-[#00D084]/50
                  hover:text-[#00A66C] dark:hover:text-[#00D084]
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                  transition-all duration-200
                "
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading more...
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Load More Results
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Showing {results.length} of {totalCount.toLocaleString()} results
              </p>
            </div>
          )}
        </>
      ) : (
        /* Mind Map View - React Flow Canvas with All Data */
        <div>
          {/* Hint for loading more data */}
          {drugCount === 0 && trialCount === 0 && (
            <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 text-center">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                💡 <strong>Tip:</strong> Switch to List view and click &quot;View Drugs&quot; or &quot;View Trials&quot; on any card to load related data into the Mind Map!
              </p>
            </div>
          )}
          
          <MindMapView 
            results={results}
            drugsMap={drugsMap}
            trialsMap={trialsMap}
          />
        </div>
      )}
    </div>
  );
}
