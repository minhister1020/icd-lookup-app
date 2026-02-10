/**
 * MedicareCoverageSection Component
 * ==================================
 * 
 * A reusable, self-contained component for displaying Medicare coverage data.
 * Renders its own trigger button and expandable NCD/LCD results.
 * 
 * Used by:
 * - ResultCard (ICD-10 results — searches by condition name)
 * - Future: HCPCS detail view (searches by HCPCS code description)
 * 
 * FEATURES:
 * - Lazy loading: data fetched only on first expand
 * - Local caching via hasFetched flag (won't re-fetch)
 * - Loading, error, and empty states
 * - NCD and LCD cards with links to CMS website
 * - Amber theme consistent with existing design
 */

'use client';

import { useState, useCallback, memo } from 'react';
import {
  Loader2,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  Shield
} from 'lucide-react';

// =============================================================================
// Props Interface
// =============================================================================

interface MedicareCoverageSectionProps {
  /** The search term to query CMS — typically a condition name or code description */
  searchTerm: string;
}

// =============================================================================
// Component
// =============================================================================

function MedicareCoverageSection({ searchTerm }: MedicareCoverageSectionProps) {
  // =========================================================================
  // State
  // =========================================================================
  const [coverageExpanded, setCoverageExpanded] = useState(false);
  const [coverageLoading, setCoverageLoading] = useState(false);
  const [coverageError, setCoverageError] = useState<string | null>(null);
  const [coverageData, setCoverageData] = useState<{
    ncds: any[];
    lcds: any[];
    totalResults: number;
  } | null>(null);
  const [hasFetchedCoverage, setHasFetchedCoverage] = useState(false);

  // =========================================================================
  // Handler
  // =========================================================================

  /**
   * Handles loading Medicare coverage data.
   * - First click: Fetches from CMS API and expands
   * - Subsequent clicks: Just toggles expand/collapse (uses cache)
   */
  const handleToggleCoverage = useCallback(async () => {
    if (hasFetchedCoverage) {
      setCoverageExpanded(prev => !prev);
      return;
    }

    setCoverageLoading(true);
    setCoverageError(null);
    setCoverageExpanded(true);

    try {
      const response = await fetch(
        `/api/cms-coverage?condition=${encodeURIComponent(searchTerm)}`
      );
      if (!response.ok) throw new Error('Failed to fetch coverage data');
      const data = await response.json();
      setCoverageData(data);
      setHasFetchedCoverage(true);
    } catch (err) {
      setCoverageError(
        err instanceof Error ? err.message : 'Failed to load coverage data'
      );
    } finally {
      setCoverageLoading(false);
    }
  }, [searchTerm, hasFetchedCoverage]);

  // =========================================================================
  // Render
  // =========================================================================

  return (
    <>
      {/* Medicare Coverage Button (Amber) */}
      <button
        type="button"
        onClick={handleToggleCoverage}
        disabled={coverageLoading}
        className={`
          flex
          items-center
          gap-1.5
          px-3
          py-1.5
          rounded-lg
          text-xs
          font-medium
          transition-all
          duration-200
          ${coverageExpanded
            ? 'bg-amber-500 text-white hover:bg-amber-600'
            : 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50'
          }
          disabled:opacity-50
          disabled:cursor-not-allowed
        `}
      >
        {coverageLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Shield className="w-3.5 h-3.5" />
        )}
        <span>
          {coverageLoading
            ? 'Loading...'
            : coverageExpanded
              ? 'Hide Coverage'
              : 'Medicare Coverage'
          }
        </span>
        {!coverageLoading && hasFetchedCoverage && coverageData && coverageData.totalResults > 0 && (
          <span
            className={`
              ml-1
              px-1.5
              py-0.5
              rounded-full
              text-[10px]
              font-bold
              ${coverageExpanded
                ? 'bg-white/20 text-white'
                : 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
              }
            `}
          >
            {coverageData.totalResults}
          </span>
        )}
        {!coverageLoading && (
          coverageExpanded
            ? <ChevronUp className="w-3 h-3 ml-0.5" />
            : <ChevronDown className="w-3 h-3 ml-0.5" />
        )}
      </button>

      {/* Expandable Coverage Section (Amber Theme) */}
      {coverageExpanded && (
        <div
          className="
            basis-full
            w-full
            order-last
            -mx-5
            mt-2
            -mb-4
            border-t
            border-amber-100
            dark:border-amber-900/30
            bg-amber-50/50
            dark:bg-amber-900/10
            animate-in
            slide-in-from-top-2
            duration-200
          "
        >
          <div className="p-4 space-y-3">
            {/* Loading State */}
            {coverageLoading && (
              <div className="flex justify-center py-6">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Searching Medicare coverage...
                  </p>
                </div>
              </div>
            )}

            {/* Error State */}
            {coverageError && (
              <div className="text-center py-4">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-sm text-red-500">{coverageError}</p>
              </div>
            )}

            {/* Empty State */}
            {!coverageLoading && !coverageError && hasFetchedCoverage && coverageData?.totalResults === 0 && (
              <div className="text-center py-4">
                <Shield className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No Medicare coverage policies found
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  This condition may not have specific NCD/LCD coverage determinations
                </p>
              </div>
            )}

            {/* Results */}
            {!coverageLoading && !coverageError && coverageData && coverageData.totalResults > 0 && (
              <div className="space-y-3">
                {/* NCDs Section */}
                {coverageData.ncds.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                      <Shield className="w-3 h-3" />
                      National Coverage Determinations ({coverageData.ncds.length})
                    </p>
                    <div className="space-y-2">
                      {coverageData.ncds.map((ncd: any) => (
                        <a
                          key={ncd.documentId}
                          href={ncd.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-3 rounded-lg bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-800/50 hover:border-amber-400 dark:hover:border-amber-600 transition-colors"
                        >
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {ncd.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-amber-600 dark:text-amber-400 font-mono">
                              NCD {ncd.displayId}
                            </span>
                            {ncd.lastUpdated && (
                              <span className="text-xs text-gray-400">
                                Updated: {ncd.lastUpdated}
                              </span>
                            )}
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* LCDs Section */}
                {coverageData.lcds.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                      <Shield className="w-3 h-3" />
                      Local Coverage Determinations ({coverageData.lcds.length})
                    </p>
                    <div className="space-y-2">
                      {coverageData.lcds.map((lcd: any) => (
                        <a
                          key={lcd.documentId}
                          href={lcd.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-3 rounded-lg bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-800/50 hover:border-amber-400 dark:hover:border-amber-600 transition-colors"
                        >
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {lcd.title}
                          </p>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* CMS Disclaimer */}
                <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center pt-2 border-t border-amber-100 dark:border-amber-900/30">
                  Source: CMS Medicare Coverage Database • Coverage policies subject to change
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default memo(MedicareCoverageSection);
