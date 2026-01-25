/**
 * SearchResults Component
 * =======================
 * 
 * Container component with professional styling for all result states.
 * 
 * DESIGN FEATURES:
 * - Modern loading spinner with gradient
 * - Clean error and empty states
 * - Responsive grid layout
 * - Smooth fade-in animations
 */

import { AlertCircle, SearchX, Sparkles } from 'lucide-react';
import { ICD10Result } from '../types/icd';
import ResultCard from './ResultCard';

// =============================================================================
// Skeleton Card Component
// =============================================================================

/**
 * SkeletonCard - Placeholder card shown while loading
 * 
 * Mimics the structure of ResultCard with animated gray boxes.
 * Uses Tailwind's animate-pulse for the shimmer effect.
 */
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
      {/* Skeleton Code Badge */}
      <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 mb-3">
        <div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded" />
      </div>
      
      {/* Skeleton Name Lines */}
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
  results: ICD10Result[];
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
}

// =============================================================================
// Component
// =============================================================================

export default function SearchResults({ 
  results, 
  isLoading, 
  error,
  hasSearched 
}: SearchResultsProps) {
  
  // =========================================================================
  // State 1: Loading - Show Skeleton Cards
  // =========================================================================
  
  if (isLoading) {
    return (
      <div>
        {/* Loading Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            <div className="h-4 w-48 bg-gray-100 dark:bg-gray-800 rounded mt-2 animate-pulse" />
          </div>
          <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        </div>
        
        {/* Skeleton Cards Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Generate 6 skeleton cards */}
          {[...Array(6)].map((_, index) => (
            <SkeletonCard key={index} delay={index * 100} />
          ))}
        </div>
        
        {/* Loading Text */}
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
  // State 3: No Results (after search)
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
  // State 4: Initial State (before any search)
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
          
          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400">
              🔍 Instant Search
            </span>
            <span className="px-3 py-1 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400">
              📋 Official ICD-10 Codes
            </span>
            <span className="px-3 py-1 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400">
              🏥 NLM Database
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Search Results
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Found {results.length} matching ICD-10 code{results.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        {/* Results Count Badge */}
        <div className="px-3 py-1.5 rounded-full bg-[#00D084]/10 border border-[#00D084]/20">
          <span className="text-sm font-semibold text-[#00A66C] dark:text-[#00D084]">
            {results.length}
          </span>
        </div>
      </div>
      
      {/* Results Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((result, index) => (
          <div 
            key={result.code}
            className="animate-in fade-in slide-in-from-bottom-2"
            style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
          >
            <ResultCard
              code={result.code}
              name={result.name}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
