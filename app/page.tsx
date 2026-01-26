/**
 * Home Page - ICD Mind Map Lookup Tool
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

import { useState, useEffect, useCallback } from 'react';
import { Activity } from 'lucide-react';

// Import our custom components
import SearchBar from './components/SearchBar';
import SearchResults from './components/SearchResults';

// Import our API helper function
import { searchICD10 } from './lib/api';

// Import TypeScript types for type safety
import { ICD10Result, ViewMode, DrugResult, ClinicalTrialResult } from './types/icd';

// =============================================================================
// Main Component
// =============================================================================

// Keys for localStorage
const RECENT_SEARCHES_KEY = 'icd-recent-searches';
const VIEW_MODE_KEY = 'icd-view-mode';

export default function Home() {
  // ---------------------------------------------------------------------------
  // State Management
  // ---------------------------------------------------------------------------
  
  // Core search state
  const [results, setResults] = useState<ICD10Result[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  
  // Phase 3C: Centralized drug/trial state for Mind Map
  // Maps ICD code -> array of related data
  const [drugsMap, setDrugsMap] = useState<Map<string, DrugResult[]>>(new Map());
  const [trialsMap, setTrialsMap] = useState<Map<string, ClinicalTrialResult[]>>(new Map());
  
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
      
      const savedViewMode = localStorage.getItem(VIEW_MODE_KEY);
      if (savedViewMode === 'list' || savedViewMode === 'mindmap') {
        setViewMode(savedViewMode);
      }
    } catch (err) {
      console.warn('Failed to load preferences:', err);
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
      } catch (err) {
        console.warn('Failed to save recent searches:', err);
      }
      
      return trimmed;
    });
  };
  
  // ---------------------------------------------------------------------------
  // Helper: Handle View Mode Change
  // ---------------------------------------------------------------------------
  
  const handleViewModeChange = (newMode: ViewMode) => {
    setViewMode(newMode);
    try {
      localStorage.setItem(VIEW_MODE_KEY, newMode);
    } catch (err) {
      console.warn('Failed to save view mode:', err);
    }
  };
  
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
  // Event Handlers
  // ---------------------------------------------------------------------------
  
  const handleSearch = async (query: string) => {
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    
    // Clear previous drugs/trials when new search starts
    setDrugsMap(new Map());
    setTrialsMap(new Map());
    
    addToRecentSearches(query);
    
    try {
      const searchResults = await searchICD10(query);
      console.log('API returned:', searchResults);
      setResults(searchResults);
    } catch (err) {
      setResults([]);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* ================================================================= */}
      {/* Sticky Header */}
      {/* ================================================================= */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D084] to-[#00A66C] flex items-center justify-center shadow-lg shadow-[#00D084]/20">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 dark:text-white text-lg">
                  ICD Mind Map
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 -mt-0.5">
                  by Bobby
                </p>
              </div>
            </div>
            
            {/* Status Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00D084]/10 border border-[#00D084]/20">
              <span className="w-2 h-2 rounded-full bg-[#00D084] animate-pulse" />
              <span className="text-xs font-medium text-[#00A66C] dark:text-[#00D084]">
                Phase 3 - Multi-API
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ================================================================= */}
      {/* Hero Section */}
      {/* ================================================================= */}
      <section className="relative overflow-hidden">
        {/* Background Gradient Glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#00D084]/20 via-[#00D084]/5 to-transparent rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          {/* Title */}
          <div className="text-center mb-10">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
              Search{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D084] to-[#00A66C]">
                ICD-10 Codes
              </span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Find medical diagnosis codes, related drugs, and clinical trials.
            </p>
          </div>
          
          {/* Search Card with Glow Effect */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#00D084]/30 via-[#00A66C]/20 to-[#00D084]/30 rounded-3xl blur-xl opacity-60" />
            
            <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none p-6 sm:p-8 border border-gray-100 dark:border-gray-700">
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
        <SearchResults
          results={results}
          isLoading={isLoading}
          error={error}
          hasSearched={hasSearched}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          drugsMap={drugsMap}
          trialsMap={trialsMap}
          onDrugsLoaded={handleDrugsLoaded}
          onTrialsLoaded={handleTrialsLoaded}
        />
      </main>

      {/* ================================================================= */}
      {/* Footer */}
      {/* ================================================================= */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Data:{' '}
              <a 
                href="https://clinicaltables.nlm.nih.gov/" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#00D084] hover:text-[#00A66C] font-medium transition-colors"
              >
                ClinicalTables
              </a>
              {' • '}
              <a 
                href="https://open.fda.gov/" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#3B82F6] hover:text-blue-600 font-medium transition-colors"
              >
                OpenFDA
              </a>
              {' • '}
              <a 
                href="https://clinicaltrials.gov/" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#9333EA] hover:text-purple-600 font-medium transition-colors"
              >
                ClinicalTrials.gov
              </a>
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Built with Next.js & React Flow
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
