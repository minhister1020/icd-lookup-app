/**
 * SearchResults Component
 * =======================
 * 
 * Container component with professional styling for all result states.
 * Displays ICD-10 search results in a card grid or grouped by category.
 * 
 * Features:
 * - Scored results with relevance ranking
 * - Total count display ("847 results, showing top 25")
 * - Load More functionality
 * - Favorites support
 * - Category grouping by ICD-10 chapter (Phase 7)
 * - Expand/Collapse all controls
 */

'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { 
  AlertCircle, 
  SearchX, 
  Sparkles, 
  Loader2, 
  ChevronDown, 
  Lightbulb,
  LayoutGrid,
  Layers,
  ChevronsUpDown,
  ChevronsDownUp,
  Target,
  AlertTriangle
} from 'lucide-react';
import { ScoredICD10Result, DrugResult, ClinicalTrialResult, TranslationResult, FavoriteICD, GroupedSearchResults } from '../types/icd';
import ResultCard from './ResultCard';
import CategorySection from './CategorySection';
import ChapterFilterDropdown from './ChapterFilterDropdown';
import RelatedCodesSection from './RelatedCodesSection';
import { groupByChapter, toggleCategoryExpansion, expandAllCategories, collapseAllCategories } from '../lib/grouping';

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
  
  // Centralized drug/trial data (cached for ResultCards)
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
  
  // Phase 10: Related codes functionality
  relatedCodes?: ScoredICD10Result[];
  isLoadingRelated?: boolean;
  showRelatedSection?: boolean;
  searchedCode?: string;
}

// =============================================================================
// View Mode Type
// =============================================================================

type ViewMode = 'flat' | 'grouped';

// =============================================================================
// Component
// =============================================================================

export default function SearchResults({ 
  results, 
  isLoading, 
  error,
  hasSearched,
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
  // Phase 10: Related codes props
  relatedCodes = [],
  isLoadingRelated = false,
  showRelatedSection = false,
  searchedCode = '',
}: SearchResultsProps) {
  
  // =========================================================================
  // Animation Control - Prevent animation replay on re-renders
  // =========================================================================

  /**
   * Track if this component has completed its initial render.
   * Used to prevent animations from replaying when results update.
   */
  const hasMounted = useRef(false);

  /**
   * Track result codes that have already been animated.
   * New results (e.g., from Load More) will animate, existing ones won't.
   */
  const animatedResultsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    hasMounted.current = true;
  }, []);

  /**
   * Update the set of animated results when results change.
   * Only mark new results as "to be animated" if this isn't the first render.
   */
  useEffect(() => {
    if (hasMounted.current) {
      // Mark all current results as animated so they don't re-animate
      results.forEach(r => animatedResultsRef.current.add(r.code));
    } else {
      // First render - all results should animate initially
      animatedResultsRef.current = new Set(results.map(r => r.code));
    }
  }, [results]);

  /**
   * Determines if a result should animate (only if it hasn't been seen before).
   */
  const shouldAnimate = useCallback((code: string): boolean => {
    return !animatedResultsRef.current.has(code);
  }, []);

  // =========================================================================
  // Phase 7: Category Grouping State
  // =========================================================================

  /** View mode: 'flat' for card grid, 'grouped' for category sections */
  const [viewMode, setViewMode] = useState<ViewMode>('grouped');

  /** Grouped results - computed from results array */
  const [groupedResults, setGroupedResults] = useState<GroupedSearchResults | null>(null);
  
  // =========================================================================
  // Phase 8: Chapter Filter State
  // =========================================================================
  
  /**
   * Selected chapter IDs for filtering in Grouped view.
   * 
   * - Empty array [] = show ALL chapters (no filtering)
   * - Array with values [4, 9] = only show chapters 4 and 9
   * 
   * Filter only applies to Grouped view, not Flat view.
   */
  const [selectedChapters, setSelectedChapters] = useState<number[]>([]);
  
  /**
   * Compute grouped results whenever results change.
   * We use useMemo for efficient re-computation.
   */
  const computedGroupedResults = useMemo(() => {
    if (results.length === 0) return null;
    return groupByChapter(results);
  }, [results]);
  
  /**
   * Merge computed groups with any existing expansion state.
   * This preserves user's expand/collapse choices after Load More.
   */
  const displayedGroupedResults = useMemo(() => {
    if (!computedGroupedResults) return null;
    
    // If we have previous state, merge expansion states
    if (groupedResults) {
      const existingExpansions = new Map<number, boolean>();
      groupedResults.categories.forEach(cat => {
        existingExpansions.set(cat.chapter.id, cat.isExpanded);
      });
      
      return {
        ...computedGroupedResults,
        categories: computedGroupedResults.categories.map((cat) => ({
          ...cat,
          // Preserve existing expansion state if available, otherwise default to collapsed
          isExpanded: existingExpansions.has(cat.chapter.id) 
            ? existingExpansions.get(cat.chapter.id)!
            : false // Default: all collapsed so users see chapter headers + filter
        }))
      };
    }
    
    return computedGroupedResults;
  }, [computedGroupedResults, groupedResults]);
  
  // =========================================================================
  // Phase 8: Chapter Filter Logic
  // =========================================================================
  
  /**
   * Filtered grouped results based on selectedChapters.
   * 
   * - When selectedChapters is empty → returns all categories (no filtering)
   * - When selectedChapters has values → only includes matching chapter IDs
   * 
   * This filtered result is what gets rendered in Grouped view.
   */
  const filteredGroupedResults = useMemo(() => {
    if (!displayedGroupedResults) return null;
    
    // If no chapters selected, show all (no filtering)
    if (selectedChapters.length === 0) {
      return displayedGroupedResults;
    }
    
    // Filter categories to only include selected chapters
    const filteredCategories = displayedGroupedResults.categories.filter(
      category => selectedChapters.includes(category.chapter.id)
    );
    
    // Calculate new totals for filtered results
    const filteredTotalResults = filteredCategories.reduce(
      (sum, cat) => sum + cat.results.length, 
      0
    );
    
    return {
      categories: filteredCategories,
      totalResults: filteredTotalResults,
      totalCategories: filteredCategories.length
    };
  }, [displayedGroupedResults, selectedChapters]);
  
  /**
   * Get list of available chapters from current results.
   * Used for populating the chapter filter dropdown.
   */
  const availableChapters = useMemo(() => {
    if (!displayedGroupedResults) return [];
    return displayedGroupedResults.categories.map(cat => cat.chapter);
  }, [displayedGroupedResults]);
  
  /**
   * Map of chapter ID → number of results in that chapter.
   * Used to display counts in the dropdown like "Endocrine (12)".
   */
  const chapterResultCounts = useMemo(() => {
    if (!displayedGroupedResults) return new Map<number, number>();
    
    const counts = new Map<number, number>();
    displayedGroupedResults.categories.forEach(cat => {
      counts.set(cat.chapter.id, cat.results.length);
    });
    return counts;
  }, [displayedGroupedResults]);
  
  /**
   * Clear chapter filter - reset to show all chapters.
   */
  const clearChapterFilter = useCallback(() => {
    setSelectedChapters([]);
  }, []);
  
  /**
   * Toggle a chapter's selection in the filter.
   * 
   * @param chapterId - The chapter ID to toggle
   */
  const toggleChapterFilter = useCallback((chapterId: number) => {
    setSelectedChapters(prev => {
      if (prev.includes(chapterId)) {
        // Remove from selection
        return prev.filter(id => id !== chapterId);
      } else {
        // Add to selection
        return [...prev, chapterId];
      }
    });
  }, []);
  
  /**
   * Handle category toggle - update the grouped results state.
   */
  const handleCategoryToggle = useCallback((chapterId: number) => {
    if (!displayedGroupedResults) return;
    
    const updated = toggleCategoryExpansion(displayedGroupedResults, chapterId);
    setGroupedResults(updated);
  }, [displayedGroupedResults]);
  
  /**
   * Expand all categories.
   */
  const handleExpandAll = useCallback(() => {
    if (!displayedGroupedResults) return;
    
    const updated = expandAllCategories(displayedGroupedResults);
    setGroupedResults(updated);
  }, [displayedGroupedResults]);
  
  /**
   * Collapse all categories.
   */
  const handleCollapseAll = useCallback(() => {
    if (!displayedGroupedResults) return;
    
    const updated = collapseAllCategories(displayedGroupedResults);
    setGroupedResults(updated);
  }, [displayedGroupedResults]);
  
  /**
   * Check if a code is favorited - wrapper for parent callback.
   */
  const checkIsFavorite = useCallback((code: string): boolean => {
    if (isFavorited) return isFavorited(code);
    return favoritesMap.has(code);
  }, [isFavorited, favoritesMap]);
  
  /**
   * Toggle favorite for a result in grouped view.
   */
  const handleToggleFavoriteGrouped = useCallback((code: string, _name: string) => {
    if (!onToggleFavorite) return;
    
    // Find the result in results array to pass full object
    // Note: _name is unused but required for callback signature compatibility
    const result = results.find(r => r.code === code);
    if (result) {
      onToggleFavorite(result);
    }
  }, [onToggleFavorite, results]);
  
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
        <div className="bg-gradient-to-br from-[#1976D2]/5 to-[#0D47A1]/5 border border-[#1976D2]/20 rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#1976D2]/20 to-[#0D47A1]/20 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7 text-[#1976D2]" />
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
  
  // Get the grouped data for display (use filtered results in grouped view)
  const grouped = filteredGroupedResults;
  
  // Phase 10: Find exact match for specific code searches
  // Don't assume results[0] is the match - search for it explicitly
  const exactMatch = showRelatedSection 
    ? results.find(r => r.code.toUpperCase() === searchedCode.toUpperCase())
    : null;
  
  return (
    <div>
      {/* Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Search Results
            {/* Phase 4: Show "ranked by relevance" indicator - hide for specific code search */}
            {!showRelatedSection && (
              <span className="ml-2 text-xs font-normal text-[#1976D2] bg-[#1976D2]/10 px-2 py-0.5 rounded-full">
                Ranked by relevance
              </span>
            )}
            {/* Phase 10: Show "Code Lookup" indicator for specific code searches */}
            {showRelatedSection && (
              <span className="ml-2 text-xs font-normal text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                Code Lookup
              </span>
            )}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {/* Phase 10: Special message for specific code search */}
            {showRelatedSection ? (
              <>
                Showing <span className="font-mono font-medium text-indigo-600 dark:text-indigo-400">{searchedCode}</span>
                {relatedCodes.length > 0 && (
                  <> and <span className="font-medium text-[#1976D2]">{relatedCodes.length}</span> related codes</>
                )}
              </>
            ) : viewMode === 'grouped' && grouped ? (
              /* Phase 7: Show grouped info when in grouped mode */
              <>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {grouped.totalResults}
                </span>
                {' results in '}
                <span className="font-medium text-[#1976D2]">
                  {grouped.totalCategories}
                </span>
                {' '}
                {grouped.totalCategories === 1 ? 'category' : 'categories'}
                {/* Phase 8: Show filter info when chapters are filtered */}
                {selectedChapters.length > 0 && displayedGroupedResults && (
                  <span className="text-amber-600 dark:text-amber-400">
                    {' '}(filtered from {displayedGroupedResults.totalCategories})
                  </span>
                )}
                {showingSubset && selectedChapters.length === 0 && (
                  <span className="text-gray-400 dark:text-gray-500">
                    {' '}(from {totalCount.toLocaleString()} total)
                  </span>
                )}
              </>
            ) : showingSubset ? (
              <>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {totalCount.toLocaleString()}
                </span>
                {' results found, showing top '}
                <span className="font-medium text-[#1976D2]">{results.length}</span>
              </>
            ) : (
              <>{results.length} ICD codes</>
            )}
          </p>
        </div>
        
        {/* View Controls - HIDE when showing related codes view */}
        {!showRelatedSection && (
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setViewMode('flat')}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
                  transition-all duration-150
                  ${viewMode === 'flat'
                    ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }
                `}
                title="Flat view - show all results in a grid"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Flat</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grouped')}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
                  transition-all duration-150
                  ${viewMode === 'grouped'
                    ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }
                `}
                title="Grouped view - organize by body system"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grouped</span>
              </button>
            </div>
            
            {/* Expand/Collapse All - Only show in grouped mode */}
            {viewMode === 'grouped' && grouped && grouped.totalCategories > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleExpandAll}
                  className="
                    flex items-center gap-1 px-2 py-1.5
                    text-xs text-gray-500 dark:text-gray-400
                    hover:text-gray-700 dark:hover:text-gray-300
                    hover:bg-gray-100 dark:hover:bg-gray-800
                    rounded-md transition-colors
                  "
                  title="Expand all categories"
                >
                  <ChevronsUpDown className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Expand</span>
                </button>
                <button
                  type="button"
                  onClick={handleCollapseAll}
                  className="
                    flex items-center gap-1 px-2 py-1.5
                    text-xs text-gray-500 dark:text-gray-400
                    hover:text-gray-700 dark:hover:text-gray-300
                    hover:bg-gray-100 dark:hover:bg-gray-800
                    rounded-md transition-colors
                  "
                  title="Collapse all categories"
                >
                  <ChevronsDownUp className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Collapse</span>
                </button>
              </div>
            )}
            
            {/* Phase 8: Chapter Filter Dropdown - Only show in grouped mode with multiple chapters */}
            {viewMode === 'grouped' && displayedGroupedResults && displayedGroupedResults.totalCategories > 1 && (
              <ChapterFilterDropdown
                availableChapters={availableChapters}
                selectedChapters={selectedChapters}
                onToggleChapter={toggleChapterFilter}
                onClearFilter={clearChapterFilter}
                chapterResultCounts={chapterResultCounts}
              />
            )}
          </div>
        )}
      </div>
      
      {/* Phase 5: Translation Badge - Show when query was translated (not for specific code searches) */}
      {translation?.wasTranslated && !showRelatedSection && (
        <TranslationBadge translation={translation} />
      )}
      
      {/* ================================================================= */}
      {/* Phase 10: Specific Code Search View (Related Codes) */}
      {/* ================================================================= */}
      {showRelatedSection ? (
        <div className="space-y-6">
          {/* Your Search - Exact Match Section */}
          {exactMatch ? (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              {/* Header Label */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Your Search
                  </span>
                </div>
                <span className="
                  px-2 py-0.5 
                  bg-emerald-100 dark:bg-emerald-900/30 
                  text-emerald-700 dark:text-emerald-400 
                  text-xs rounded-full font-medium
                  flex items-center gap-1
                ">
                  <Sparkles className="w-3 h-3" />
                  Exact Match
                </span>
              </div>
              
              {/* Exact Match Card - Full Width, Highlighted */}
              <div className="
                p-1
                rounded-2xl
                bg-gradient-to-r from-emerald-100/50 to-teal-100/50
                dark:from-emerald-900/20 dark:to-teal-900/20
                border border-emerald-200 dark:border-emerald-800/50
              ">
                <ResultCard
                  code={exactMatch.code}
                  name={exactMatch.name}
                  onDrugsLoaded={onDrugsLoaded}
                  onTrialsLoaded={onTrialsLoaded}
                  score={exactMatch.score}
                  rank={1}
                  isFavorite={isFavorited ? isFavorited(exactMatch.code) : favoritesMap.has(exactMatch.code)}
                  onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(exactMatch) : undefined}
                />
              </div>
            </div>
          ) : (
            /* Code Not Found Warning */
            <div className="
              animate-in fade-in slide-in-from-bottom-2
              p-4
              bg-amber-50 dark:bg-amber-900/20
              border border-amber-200 dark:border-amber-800/50
              rounded-xl
            ">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-300">
                    Code &ldquo;{searchedCode}&rdquo; not found in database
                  </p>
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                    This code may not exist or may have been deprecated. Showing related codes that may help:
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Related Codes Section */}
          <RelatedCodesSection
            searchedCode={searchedCode}
            relatedCodes={relatedCodes}
            isLoading={isLoadingRelated}
            isFavorite={checkIsFavorite}
            onToggleFavorite={handleToggleFavoriteGrouped}
            onDrugsLoaded={onDrugsLoaded}
            onTrialsLoaded={onTrialsLoaded}
          />
        </div>
      ) : (
        /* ================================================================= */
        /* Normal Search View (Grouped or Flat) */
        /* ================================================================= */
        <>
          {/* Phase 7: Grouped View - Category Sections */}
          {viewMode === 'grouped' && grouped ? (
            <div className="space-y-4">
              {grouped.categories.map((category, index) => (
                <div
                  key={category.chapter.id}
                  className="animate-in fade-in slide-in-from-bottom-2"
                  style={{ 
                    animationDelay: `${Math.min(index, 5) * 75}ms`, 
                    animationFillMode: 'backwards' 
                  }}
                >
                  <CategorySection
                    category={category}
                    onToggle={handleCategoryToggle}
                    isFirstCategory={index === 0}
                    onToggleFavorite={handleToggleFavoriteGrouped}
                    isFavorite={checkIsFavorite}
                    onDrugsLoaded={onDrugsLoaded}
                    onTrialsLoaded={onTrialsLoaded}
                  />
                </div>
              ))}
            </div>
          ) : (
            /* Flat View - Card Grid */
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((result, index) => {
                const animate = shouldAnimate(result.code);
                return (
                  <div
                    key={result.code}
                    className={animate ? "animate-in fade-in slide-in-from-bottom-2" : ""}
                    style={animate ? { animationDelay: `${Math.min(index, 10) * 50}ms`, animationFillMode: 'backwards' } : undefined}
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
                );
              })}
            </div>
          )}
        </>
      )}
      
      {/* Phase 4C: Load More Button - Hide for specific code searches */}
      {hasMore && onLoadMore && !showRelatedSection && (
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
              hover:border-[#1976D2]/50
              hover:text-[#0D47A1] dark:hover:text-[#42A5F5]
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
    </div>
  );
}
