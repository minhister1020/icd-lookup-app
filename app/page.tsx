/**
 * Home Page - MedCodeMap
 * =====================================
 * 
 * This is the main page of our application with a professional, 
 * production-ready design featuring:
 * - Sticky header with branding
 * - Hero section with gradient effects
 * - Glass-morphism search bar
 * - Responsive grid layout
 * 
 * Phase 3C: Now manages centralized state for:
 * - ICD-10 search results
 * - Drugs per ICD code (Map)
 * - Clinical trials per ICD code (Map)
 * 
 * This allows the Mind Map view to display all loaded data!
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Star, Clock } from 'lucide-react';
import Image from 'next/image';

// Import our custom components
import SearchBar from './components/SearchBar';
import SearchResults from './components/SearchResults';
import FavoritesPanel from './components/FavoritesPanel';
import HistoryPanel from './components/HistoryPanel';

// Import our API helper function
import { searchICD10, searchICD10More, getRelatedCodes, isSpecificCode } from './lib/api';

// Import code detection from conditionsApi
import { isICD10Code } from './lib/conditionsApi';
import { detectCodeType } from './lib/conditionsApi';
import { searchLocalHcpcs } from './lib/hcpcsLocalData';
import { HCPCSResult } from './types/icd';
import HcpcsResultCard from './components/HcpcsResultCard';

// Import favorites storage utilities
import { 
  getFavorites, 
  saveFavorites, 
  createFavoritesMap,
  getCodeCategory,
  getSearchHistory,
  addToHistory,
  clearSearchHistory,
  removeFromHistory
} from './lib/favoritesStorage';

// Import TypeScript types for type safety
import { DrugResult, ClinicalTrialResult, ScoredICD10Result, TranslationResult, FavoriteICD, SearchHistoryEntry } from './types/icd';

// =============================================================================
// Main Component
// =============================================================================

// Keys for localStorage
const RECENT_SEARCHES_KEY = 'icd-recent-searches';

export default function Home() {
  // ---------------------------------------------------------------------------
  // State Management
  // ---------------------------------------------------------------------------
  
  // Core search state
  const [results, setResults] = useState<ScoredICD10Result[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  // HCPCS search state
  const [hcpcsResults, setHcpcsResults] = useState<HCPCSResult[]>([]);
  const [isHcpcsSearch, setIsHcpcsSearch] = useState(false);
  const [hcpcsHintCount, setHcpcsHintCount] = useState(0);
  
  // Phase 4: Search metadata for pagination and total count display
  const [totalCount, setTotalCount] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [currentQuery, setCurrentQuery] = useState<string>('');
  
  // Phase 5: Translation metadata for displaying translation notice
  const [translation, setTranslation] = useState<TranslationResult | undefined>(undefined);
  
  // Phase 3C: Centralized drug/trial state
  // Maps ICD code -> array of related data (used by ResultCard to cache loaded data)
  const [drugsMap, setDrugsMap] = useState<Map<string, DrugResult[]>>(new Map());
  const [trialsMap, setTrialsMap] = useState<Map<string, ClinicalTrialResult[]>>(new Map());
  
  // Phase 6: Favorites state
  const [favorites, setFavorites] = useState<FavoriteICD[]>([]);
  const [showFavoritesPanel, setShowFavoritesPanel] = useState(false);
  
  // Phase 10: Related codes state (for sibling ICD codes display)
  const [relatedCodes, setRelatedCodes] = useState<ScoredICD10Result[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);
  const [showRelatedSection, setShowRelatedSection] = useState(false);
  
  // Phase 6C: Enhanced search history state
  const [searchHistory, setSearchHistory] = useState<SearchHistoryEntry[]>([]);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  
  // Create a Map for O(1) favorite lookup
  const favoritesMap = useMemo(() => createFavoritesMap(favorites), [favorites]);
  
  // ---------------------------------------------------------------------------
  // Load Preferences from localStorage on Mount
  // ---------------------------------------------------------------------------
  
  useEffect(() => {
    try {
      const savedSearches = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (savedSearches) {
        const parsed = JSON.parse(savedSearches);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed);
        }
      }
      
      // Phase 6: Load favorites from localStorage
      const savedFavorites = getFavorites();
      setFavorites(savedFavorites);
      
      // Phase 6C: Load enhanced search history
      const savedHistory = getSearchHistory();
      setSearchHistory(savedHistory);
    } catch {
      // Silently fail if localStorage is not available
    }
  }, []);
  
  // ---------------------------------------------------------------------------
  // Helper: Save Search to Recent Searches
  // ---------------------------------------------------------------------------
  
  const addToRecentSearches = (query: string) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter(
        (item) => item.toLowerCase() !== query.toLowerCase()
      );
      const updated = [query, ...filtered];
      const trimmed = updated.slice(0, 5);
      
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(trimmed));
      } catch {
        // Silently fail if localStorage is unavailable
      }
      
      return trimmed;
    });
  };
  
  // ---------------------------------------------------------------------------
  // Helper: Handle View Mode Change
  // ---------------------------------------------------------------------------
  // Phase 6C: Enhanced History Functions
  // ---------------------------------------------------------------------------
  
  /**
   * Adds a search to enhanced history with metadata.
   * Called after a successful search.
   */
  const addToEnhancedHistory = useCallback((query: string, resultCount: number, topResult?: ScoredICD10Result) => {
    const entry: SearchHistoryEntry = {
      query,
      searchedAt: new Date().toISOString(),
      resultCount,
      topResultCode: topResult?.code,
      topResultName: topResult?.name
    };
    
    const updated = addToHistory(entry);
    setSearchHistory(updated);
  }, []);
  
  /**
   * Removes a specific history entry.
   */
  const handleRemoveHistoryItem = useCallback((query: string) => {
    const updated = removeFromHistory(query);
    setSearchHistory(updated);
  }, []);
  
  /**
   * Clears all search history.
   */
  const handleClearHistory = useCallback(() => {
    clearSearchHistory();
    setSearchHistory([]);
    // Also clear legacy recent searches
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // Silently fail
    }
  }, []);
  
  // ---------------------------------------------------------------------------
  // Phase 6: Favorites Functions
  // ---------------------------------------------------------------------------
  
  /**
   * Toggles a result's favorite status.
   * If already favorited, removes it. Otherwise, adds it.
   * 
   * @param result - The ICD result to toggle
   */
  const toggleFavorite = useCallback((result: ScoredICD10Result) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.code === result.code);
      
      let updated: FavoriteICD[];
      
      if (exists) {
        // Remove from favorites
        updated = prev.filter(f => f.code !== result.code);
      } else {
        // Add to favorites
        const newFavorite: FavoriteICD = {
          code: result.code,
          name: result.name,
          favoritedAt: new Date().toISOString(),
          searchQuery: currentQuery || undefined,
          score: result.score,
          category: getCodeCategory(result.code)
        };
        updated = [newFavorite, ...prev];
      }
      
      // Persist to localStorage
      saveFavorites(updated);
      return updated;
    });
  }, [currentQuery]);
  
  /**
   * Removes a specific favorite by code.
   */
  const removeFavorite = useCallback((code: string) => {
    setFavorites(prev => {
      const updated = prev.filter(f => f.code !== code);
      saveFavorites(updated);
      return updated;
    });
  }, []);
  
  /**
   * Clears all favorites.
   */
  const clearAllFavorites = useCallback(() => {
    setFavorites([]);
    saveFavorites([]);
  }, []);
  
  /**
   * Imports favorites from external file, merging with existing.
   * Prevents duplicates by code.
   */
  const importFavorites = useCallback((imported: FavoriteICD[]) => {
    setFavorites(prev => {
      // Create set of existing codes for O(1) lookup
      const existingCodes = new Set(prev.map(f => f.code));
      
      // Filter out duplicates
      const newFavorites = imported.filter(f => !existingCodes.has(f.code));
      
      // Merge: new favorites first, then existing
      const merged = [...newFavorites, ...prev];
      
      // Save to localStorage
      saveFavorites(merged);
      return merged;
    });
  }, []);
  
  /**
   * Checks if a code is favorited (O(1) lookup).
   */
  const isFavorited = useCallback((code: string): boolean => {
    return favoritesMap.has(code);
  }, [favoritesMap]);
  
  // ---------------------------------------------------------------------------
  // Phase 3C: Callbacks for Drug/Trial Data
  // ---------------------------------------------------------------------------
  
  /**
   * Called by ResultCard when drugs are loaded for an ICD code.
   * Updates the centralized drugsMap for Mind Map visualization.
   */
  const handleDrugsLoaded = useCallback((icdCode: string, drugs: DrugResult[]) => {
    setDrugsMap(prev => {
      const next = new Map(prev);
      next.set(icdCode, drugs);
      return next;
    });
  }, []);
  
  /**
   * Called by ResultCard when trials are loaded for an ICD code.
   * Updates the centralized trialsMap for Mind Map visualization.
   */
  const handleTrialsLoaded = useCallback((icdCode: string, trials: ClinicalTrialResult[]) => {
    setTrialsMap(prev => {
      const next = new Map(prev);
      next.set(icdCode, trials);
      return next;
    });
  }, []);
  
  // ---------------------------------------------------------------------------
  // Phase 10: Related Codes Function
  // ---------------------------------------------------------------------------
  
  /**
   * Fetches related/sibling ICD-10 codes when user searches for a specific code.
   * Only triggers when BOTH conditions are met:
   * - Search query is an ICD-10 code format (e.g., "I21.9")
   * - Code is specific (has a dot), not just a category (e.g., "I21")
   * 
   * @param searchQuery - The user's search query
   */
  const fetchRelatedCodes = useCallback(async (searchQuery: string) => {
    // Only fetch for specific ICD codes (with dot), not categories or text
    if (!isICD10Code(searchQuery) || !isSpecificCode(searchQuery)) {
      setRelatedCodes([]);
      setShowRelatedSection(false);
      return;
    }
    
    console.log(`[RelatedCodes] Fetching siblings for specific code: "${searchQuery}"`);
    
    setIsLoadingRelated(true);
    setShowRelatedSection(true);
    
    try {
      const related = await getRelatedCodes(searchQuery);
      
      // Convert ICD10Result to ScoredICD10Result format for consistency
      const scoredRelated: ScoredICD10Result[] = related.map((r: { code: string; name: string }, index: number) => ({
        ...r,
        score: 50 - index, // Give decreasing scores for sorting (optional)
        scoreBreakdown: {
          keyword: 0,
          popularity: 0,
          specificity: 10,
          exactness: 0
        }
      }));
      
      setRelatedCodes(scoredRelated);
      console.log(`[RelatedCodes] Found ${scoredRelated.length} sibling codes`);
    } catch (error) {
      console.error('[RelatedCodes] Failed to fetch:', error);
      setRelatedCodes([]);
    } finally {
      setIsLoadingRelated(false);
    }
  }, []);
  
  // ---------------------------------------------------------------------------
  // Event Handlers
  // ---------------------------------------------------------------------------
  
  const handleSearch = async (query: string) => {
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    setCurrentQuery(query);

    // Clear previous drugs/trials when new search starts
    setDrugsMap(new Map());
    setTrialsMap(new Map());

    // Phase 10: Clear related codes on new search
    setRelatedCodes([]);
    setShowRelatedSection(false);

    addToRecentSearches(query);

    // Detect code type: HCPCS vs ICD-10 vs condition name
    const codeType = detectCodeType(query);

    // For plain-text queries, check if HCPCS matches exist (for hint banner)
    let hcpcsHintCount = 0;
    if (codeType === 'condition') {
      const hcpcsPreCheck = await searchLocalHcpcs(query, 1);
      if (hcpcsPreCheck.length > 0) {
        // Get actual count for the banner
        const fullCheck = await searchLocalHcpcs(query, 50);
        hcpcsHintCount = fullCheck.length;
      }
    }
    setHcpcsHintCount(hcpcsHintCount);

    try {
      if (codeType === 'hcpcs') {
        // ── HCPCS Search Path ──
        setIsHcpcsSearch(true);
        setResults([]); // Clear ICD-10 results
        setTranslation(undefined);
        setTotalCount(0);
        setHasMore(false);

        const hcpcsData = await searchLocalHcpcs(query, 20);
        setHcpcsResults(hcpcsData);

        // Phase 6C: Add to enhanced history
        addToEnhancedHistory(query, hcpcsData.length);
      } else {
        // ── ICD-10 / Condition Search Path (existing logic) ──
        setIsHcpcsSearch(false);
        setHcpcsResults([]); // Clear HCPCS results

        const {
          results: scoredResults,
          totalCount: total,
          hasMore: more,
          translation: translationResult
        } = await searchICD10(query);

        setResults(scoredResults);
        setTotalCount(total);
        setHasMore(more);
        setTranslation(translationResult);

        // Phase 6C: Add to enhanced history with metadata
        addToEnhancedHistory(query, total, scoredResults[0]);

        // Phase 10: Fetch related codes if this is a specific ICD code search
        fetchRelatedCodes(query);
      }
    } catch (err) {
      setResults([]);
      setHcpcsResults([]);
      setTotalCount(0);
      setHasMore(false);
      setTranslation(undefined);
      setRelatedCodes([]);
      setShowRelatedSection(false);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Phase 4C: Handles loading more results when "Load More" is clicked.
   * Appends new results to existing ones (doesn't replace).
   */
  const handleLoadMore = async () => {
    if (!currentQuery || isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    
    try {
      const { results: moreResults, hasMore: more } = await searchICD10More(
        currentQuery, 
        results.length
      );
      
      // Append new results (moreResults contains ALL results up to new limit)
      setResults(moreResults);
      setHasMore(more);
    } catch (err) {
      // Don't clear existing results on error, just log
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setIsLoadingMore(false);
    }
  };
  
  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8fafb] via-white to-[#f0fdf8] dark:from-[#0d1117] dark:via-[#161b22] dark:to-[#0d1117] bg-grid-pattern">
      {/* ================================================================= */}
      {/* Sticky Header */}
      {/* ================================================================= */}
      <header className="sticky top-0 z-50 glass-panel border-b border-gray-200/60 dark:border-gray-700/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center -space-x-0">
             <Image
              src="/medcodemap-svg.svg"
              alt="MedCodeMap"
              width={96}
              height={96}
              className="w-8 h-8 sm:w-12 sm:h-12 lg:w-14 lg:h-14 object-contain"
            />
              <div>
                <h1 className="font-bold text-gray-900 dark:text-white text-lg tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                  MedCodeMap
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 -mt-0.5 font-medium">
                  ICD-10 Lookup
                </p>
              </div>
            </div>
            
            {/* Phase 6: Favorites Button - Enhanced styling */}
            <button
              onClick={() => setShowFavoritesPanel(!showFavoritesPanel)}
              className={`
                group
                flex items-center gap-2 px-4 py-2 rounded-xl
                transition-all duration-300 ease-out
                transform hover:scale-105 active:scale-95
                ${showFavoritesPanel 
                  ? 'bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/40 dark:to-amber-900/40 border-yellow-300 dark:border-yellow-600 shadow-lg shadow-yellow-200/50 dark:shadow-yellow-900/30' 
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-yellow-400 dark:hover:border-yellow-600 hover:shadow-lg hover:shadow-yellow-100/50 dark:hover:shadow-yellow-900/20'
                }
                border-2 shadow-md
              `}
              aria-label={`View favorites (${favorites.length})`}
            >
              <Star 
                className={`
                  w-5 h-5 transition-all duration-300
                  ${favorites.length > 0 
                    ? 'text-yellow-500 fill-yellow-500 group-hover:scale-110' 
                    : 'text-gray-400 group-hover:text-yellow-400'
                  }
                `} 
              />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 hidden sm:inline">
                Favorites
              </span>
              {favorites.length > 0 && (
                <span className="
                  px-2 py-0.5 text-xs font-bold rounded-full 
                  bg-gradient-to-r from-yellow-500 to-amber-500 
                  text-white shadow-sm
                  animate-pulse
                ">
                  {favorites.length}
                </span>
              )}
            </button>
            
            {/* Phase 6C: History Button */}
            <button
              onClick={() => setShowHistoryPanel(!showHistoryPanel)}
              className={`
                group
                flex items-center gap-2 px-4 py-2 rounded-xl
                transition-all duration-300 ease-out
                transform hover:scale-105 active:scale-95
                ${showHistoryPanel 
                  ? 'bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 border-blue-300 dark:border-blue-600 shadow-lg shadow-blue-200/50 dark:shadow-blue-900/30' 
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-lg hover:shadow-blue-100/50 dark:hover:shadow-blue-900/20'
                }
                border-2 shadow-md
              `}
              aria-label={`View history (${searchHistory.length})`}
            >
              <Clock 
                className={`
                  w-5 h-5 transition-all duration-300
                  ${searchHistory.length > 0 
                    ? 'text-blue-500 group-hover:scale-110' 
                    : 'text-gray-400 group-hover:text-blue-400'
                  }
                `} 
              />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 hidden sm:inline">
                History
              </span>
              {searchHistory.length > 0 && (
                <span className="
                  px-2 py-0.5 text-xs font-bold rounded-full 
                  bg-gradient-to-r from-blue-500 to-indigo-500 
                  text-white shadow-sm
                ">
                  {searchHistory.length}
                </span>
              )}
            </button>
            
            {/* Status Badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#1976D2]/10 to-[#0D47A1]/5 border border-[#1976D2]/25 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#1976D2] status-indicator" />
              <span className="text-xs font-semibold text-[#0D47A1] dark:text-[#42A5F5]">
                Live
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ================================================================= */}
      {/* Hero Section */}
      {/* ================================================================= */}
      <section className="relative overflow-hidden">
        {/* Background Gradient Glow - Enhanced */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-[#1976D2]/15 via-[#1976D2]/8 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-20 left-1/4 w-[400px] h-[300px] bg-gradient-to-br from-[#80DEEA]/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-[400px] h-[300px] bg-gradient-to-bl from-[#90CAF9]/10 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
       {/* Title - Enhanced Typography */}
       <div className="text-center mb-12">
       <h2
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white mb-5 tracking-tight leading-[1.1]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Every diagnosis, drug, trial, and coverage —{' '}
              <span className="text-gradient-primary relative">
                connected
                <svg className="absolute -bottom-2 left-0 w-full h-3 text-[#1976D2]/30" viewBox="0 0 200 12" preserveAspectRatio="none">
                  <path d="M0,8 Q50,0 100,8 T200,8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              </span>
              .
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              The all-in-one medical reference that maps ICD-10 codes to related drugs, procedures, clinical trials, and Medicare coverage.
            </p>
          </div>

          {/* Search Card with Enhanced Glow Effect */}
          <div className="relative">
            {/* Multi-layer glow effect */}
            <div className="absolute -inset-2 bg-gradient-to-r from-[#1976D2]/25 via-[#80DEEA]/15 to-[#1976D2]/25 rounded-3xl blur-2xl opacity-70" />
            <div className="absolute -inset-1 bg-gradient-to-r from-[#1976D2]/20 via-[#0D47A1]/10 to-[#1976D2]/20 rounded-3xl blur-xl opacity-60" />

            <div className="relative glass-panel rounded-2xl shadow-xl p-6 sm:p-8 border border-white/60 dark:border-gray-700/50">
              <SearchBar
                onSearch={handleSearch}
                isLoading={isLoading}
                recentSearches={recentSearches}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* Results Section */}
      {/* ================================================================= */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {isHcpcsSearch ? (
          // ── HCPCS Results ──
          <div>
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-16 text-emerald-600">
                <div className="w-10 h-10 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4" />
                <span className="text-sm font-medium">Searching HCPCS codes...</span>
              </div>
            )}

            {error && (
              <div className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {!isLoading && !error && hasSearched && hcpcsResults.length === 0 && (
              <div className="max-w-md mx-auto bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  No HCPCS Codes Found
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  No HCPCS Level II codes match &quot;{currentQuery}&quot;. Try a different code or search term.
                </p>
              </div>
            )}

            {!isLoading && !error && hcpcsResults.length > 0 && (
              <div>
                {/* Results count header */}
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Found <span className="font-semibold text-emerald-600">{hcpcsResults.length}</span> HCPCS Level II {hcpcsResults.length === 1 ? 'code' : 'codes'}
                  </p>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 font-medium">
                    HCPCS Search
                  </span>
                </div>

                {/* Results grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {hcpcsResults.map((result, index) => (
                    <div
                      key={result.code}
                      className="animate-in fade-in slide-in-from-bottom-2"
                      style={{ animationDelay: `${Math.min(index, 10) * 50}ms`, animationFillMode: 'backwards' }}
                    >
                      <HcpcsResultCard
                        result={result}
                        rank={index + 1}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          // ── ICD-10 Results (existing) ──
          <>
            {/* HCPCS hint banner — shows when word search also has HCPCS matches */}
            {hcpcsHintCount > 0 && !isLoading && (
              <div className="mb-4 flex items-center justify-between px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50">
                <p className="text-sm text-emerald-700 dark:text-emerald-400">
                  Also found <span className="font-semibold">{hcpcsHintCount}</span> HCPCS Level II {hcpcsHintCount === 1 ? 'code' : 'codes'} for &quot;{currentQuery}&quot;
                </p>
                <button
                  onClick={() => {
                    setIsHcpcsSearch(true);
                    setResults([]);
                    setTranslation(undefined);
                    setTotalCount(0);
                    setHasMore(false);
                    searchLocalHcpcs(currentQuery, 20).then(setHcpcsResults);
                  }}
                  className="ml-3 flex-shrink-0 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors"
                >
                  View HCPCS Results
                </button>
              </div>
            )}

            <SearchResults
            results={results}
            isLoading={isLoading}
            error={error}
            hasSearched={hasSearched}
            drugsMap={drugsMap}
            trialsMap={trialsMap}
            onDrugsLoaded={handleDrugsLoaded}
            onTrialsLoaded={handleTrialsLoaded}
            totalCount={totalCount}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            isLoadingMore={isLoadingMore}
            translation={translation}
            favorites={favorites}
            favoritesMap={favoritesMap}
            onToggleFavorite={toggleFavorite}
            onRemoveFavorite={removeFavorite}
            onClearAllFavorites={clearAllFavorites}
            isFavorited={isFavorited}
            showFavoritesPanel={showFavoritesPanel}
            onToggleFavoritesPanel={() => setShowFavoritesPanel(!showFavoritesPanel)}
            onSearchFromFavorite={handleSearch}
            relatedCodes={relatedCodes}
            isLoadingRelated={isLoadingRelated}
            showRelatedSection={showRelatedSection}
            searchedCode={currentQuery}
            />
          </>
        )}
      </main>

      {/* ================================================================= */}
      {/* Footer */}
      {/* ================================================================= */}
      <footer className="border-t border-gray-200/60 dark:border-gray-800/60 glass-panel mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Data:{' '}
              <a
                href="https://clinicaltables.nlm.nih.gov/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1976D2] hover:text-[#0D47A1] font-semibold transition-colors hover:underline decoration-2 underline-offset-2"
              >
                ClinicalTables
              </a>
              {' • '}
              <a
                href="https://open.fda.gov/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#3B82F6] hover:text-blue-600 font-semibold transition-colors hover:underline decoration-2 underline-offset-2"
              >
                OpenFDA
              </a>
              {' • '}
              <a
                href="https://clinicaltrials.gov/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#9333EA] hover:text-purple-600 font-semibold transition-colors hover:underline decoration-2 underline-offset-2"
              >
                ClinicalTrials.gov
              </a>
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
              Built with Next.js & React Flow
            </p>
          </div>
        </div>
      </footer>
      
      {/* ================================================================= */}
      {/* Phase 6: Favorites Panel */}
      {/* ================================================================= */}
      <FavoritesPanel
        isOpen={showFavoritesPanel}
        onClose={() => setShowFavoritesPanel(false)}
        favorites={favorites}
        onRemove={removeFavorite}
        onSearch={handleSearch}
        onClearAll={clearAllFavorites}
        onImport={importFavorites}
      />
      
      {/* Phase 6C: History Panel */}
      <HistoryPanel
        isOpen={showHistoryPanel}
        onClose={() => setShowHistoryPanel(false)}
        history={searchHistory}
        onRemove={handleRemoveHistoryItem}
        onSearch={handleSearch}
        onClearAll={handleClearHistory}
      />
    </div>
  );
}
