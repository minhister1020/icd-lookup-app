'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown, ChevronUp, ArrowLeft, Grid3X3, Search, Loader2 } from 'lucide-react';
import { getLocalCategories, browseByCategory, searchLocalHcpcs } from '../lib/hcpcsLocalData';
import { HCPCSResult } from '../types/icd';
import HcpcsResultCard from '../components/HcpcsResultCard';

export default function HcpcsPage() {
  // Categories loaded from local data
  const [categories, setCategories] = useState<{ prefix: string; name: string; description: string; count: number }[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);

  // Track which category is expanded
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  // Codes loaded for the expanded category
  const [categoryResults, setCategoryResults] = useState<HCPCSResult[]>([]);
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Search within the page
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<HCPCSResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Load categories on mount
  useEffect(() => {
    getLocalCategories().then(cats => {
      setCategories(cats);
      setIsCategoriesLoading(false);
    }).catch(() => setIsCategoriesLoading(false));
  }, []);

  const handleCategoryToggle = useCallback(async (prefix: string) => {
    // If already expanded, collapse
    if (expandedCategory === prefix) {
      setExpandedCategory(null);
      setCategoryResults([]);
      setCategoryError(null);
      return;
    }

    // Expand and fetch codes
    setExpandedCategory(prefix);
    setIsCategoryLoading(true);
    setCategoryError(null);
    setCategoryResults([]);

    try {
      const results = await browseByCategory(prefix);
      setCategoryResults(results);
    } catch {
      setCategoryError('Failed to load codes for this category. Please try again.');
    } finally {
      setIsCategoryLoading(false);
    }
  }, [expandedCategory]);

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearching(true);
    setHasSearched(true);
    setExpandedCategory(null); // Collapse any open category
    setCategoryResults([]);

    try {
      const results = await searchLocalHcpcs(query, 30);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Search
            </Link>
          </div>
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/medcodemap-svg.svg"
              alt="MedCodeMap"
              width={28}
              height={28}
              className="rounded-lg"
            />
            <span className="font-display text-lg font-bold text-gray-900 dark:text-white">
              MedCodeMap
            </span>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Page Title ── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium mb-3">
            <Grid3X3 className="w-3.5 h-3.5" />
            HCPCS Level II Reference
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">
            Browse HCPCS Codes
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Healthcare Common Procedure Coding System Level II codes for medical supplies, equipment, and non-physician services.
          </p>
        </div>

        {/* ── Search Bar ── */}
        <div className="max-w-xl mx-auto mb-8">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search HCPCS codes (e.g., J0135, wheelchair, insulin)..."
              className="w-full pl-10 pr-20 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {hasSearched && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="px-2 py-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  Clear
                </button>
              )}
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>
        </div>

        {/* ── Search Results (when active) ── */}
        {hasSearched && (
          <div className="mb-10">
            {isSearching ? (
              <div className="flex flex-col items-center justify-center py-12 text-emerald-600">
                <Loader2 className="w-8 h-8 animate-spin mb-3" />
                <span className="text-sm font-medium">Searching HCPCS codes...</span>
              </div>
            ) : searchResults.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Found <span className="font-semibold text-emerald-600">{searchResults.length}</span> results for &quot;{searchQuery}&quot;
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {searchResults.map((result, index) => (
                    <div
                      key={result.code}
                      className="animate-in fade-in slide-in-from-bottom-2"
                      style={{ animationDelay: `${Math.min(index, 10) * 50}ms`, animationFillMode: 'backwards' }}
                    >
                      <HcpcsResultCard result={result} rank={index + 1} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                No HCPCS codes found for &quot;{searchQuery}&quot;. Try a different term.
              </div>
            )}
          </div>
        )}

        {/* ── Category Grid ── */}
        {!hasSearched && isCategoriesLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-emerald-600">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <span className="text-sm font-medium">Loading HCPCS categories...</span>
          </div>
        )}

        {!hasSearched && !isCategoriesLoading && (
          <div className="space-y-3">
            {categories.map((category) => (
              <div
                key={category.prefix}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden transition-all hover:border-emerald-300 dark:hover:border-emerald-800"
              >
                {/* Category Header — clickable */}
                <button
                  onClick={() => handleCategoryToggle(category.prefix)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-bold">
                      {category.prefix}
                    </span>
                    <div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {category.name}
                        <span className="ml-2 text-xs font-normal text-gray-400">({category.count})</span>
                      </span>
                      <span className="block text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {category.description}
                      </span>
                    </div>
                  </div>
                  {expandedCategory === category.prefix ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                {/* Expanded Content */}
                {expandedCategory === category.prefix && (
                  <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-4 bg-gray-50/50 dark:bg-gray-800/20">
                    {isCategoryLoading ? (
                      <div className="flex items-center justify-center py-8 text-emerald-600">
                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                        <span className="text-sm">Loading {category.name} codes...</span>
                      </div>
                    ) : categoryError ? (
                      <div className="text-center py-6 text-red-500 text-sm">{categoryError}</div>
                    ) : categoryResults.length === 0 ? (
                      <div className="text-center py-6 text-gray-400 text-sm">
                        No codes found in this category.
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {categoryResults.map((result, index) => (
                          <div
                            key={result.code}
                            className="animate-in fade-in slide-in-from-bottom-1"
                            style={{ animationDelay: `${Math.min(index, 10) * 30}ms`, animationFillMode: 'backwards' }}
                          >
                            <HcpcsResultCard result={result} rank={index + 1} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
