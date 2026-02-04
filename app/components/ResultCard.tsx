/**
 * ResultCard Component
 * ====================
 * 
 * A professional, polished card component for displaying ICD-10 results.
 * NOW WITH: Drug expansion (Phase 3A) + Clinical Trial expansion (Phase 3B)
 * 
 * DESIGN FEATURES:
 * - Soft shadows with hover elevation
 * - Smooth micro-interactions (scale, translate)
 * - ICD code badge with branded colors
 * - Expandable drug section (blue theme)
 * - Expandable trial section (purple theme)
 * - Loading states and error handling
 * - Cached API responses (won't re-fetch)
 */

'use client';

import { useState, useMemo, useEffect, useRef, memo, useCallback } from 'react';
import { 
  ChevronRight, 
  Pill, 
  FlaskConical,
  Loader2, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle,
  Star
} from 'lucide-react';
import { DrugResult, ClinicalTrialResult, TrialStatus } from '../types/icd';
import { ValidatedDrugResult, DRUG_SCORE_THRESHOLDS } from '../lib/drugValidationPipeline';
import { searchTrialsByCondition } from '../lib/clinicalTrialsApi';
import DrugCard from './DrugCard';
import DrugFilterChips from './DrugFilterChips';
import { CheckCircle2, Info } from 'lucide-react';
import TrialCard from './TrialCard';

// =============================================================================
// Props Interface
// =============================================================================

interface ResultCardProps {
  /** The ICD-10 code (e.g., "E11.9") */
  code: string;
  
  /** The condition name (e.g., "Type 2 diabetes mellitus without complications") */
  name: string;
  
  /** Phase 3C: Callback when drugs are loaded (for Mind Map sync) */
  onDrugsLoaded?: (icdCode: string, drugs: DrugResult[]) => void;
  
  /** Phase 3C: Callback when trials are loaded (for Mind Map sync) */
  onTrialsLoaded?: (icdCode: string, trials: ClinicalTrialResult[]) => void;
  
  /** Phase 4C: Relevance score (0-100) for badge display */
  score?: number;
  
  /** Phase 4C: Position in search results (1-based) */
  rank?: number;
  
  /** Phase 6: Whether this code is favorited */
  isFavorite?: boolean;
  
  /** Phase 6: Callback to toggle favorite status */
  onToggleFavorite?: () => void;
}

// =============================================================================
// Component
// =============================================================================

function ResultCard({
  code,
  name,
  onDrugsLoaded,
  onTrialsLoaded,
  score,
  rank,
  isFavorite = false,
  onToggleFavorite,
}: ResultCardProps) {
  // =========================================================================
  // Animation Control - Prevent animation replay on re-renders
  // =========================================================================
  const hasMounted = useRef(false);

  useEffect(() => {
    // Set mounted flag after initial render to prevent animation replay
    hasMounted.current = true;
  }, []);

  // =========================================================================
  // Drug State (Phase 3A) - Updated for AI Validation Pipeline
  // =========================================================================
  const [drugs, setDrugs] = useState<ValidatedDrugResult[]>([]);
  const [drugsLoading, setDrugsLoading] = useState(false);
  const [drugsError, setDrugsError] = useState<string | null>(null);
  const [drugsExpanded, setDrugsExpanded] = useState(false);
  const [hasFetchedDrugs, setHasFetchedDrugs] = useState(false);
  
  // =========================================================================
  // Trial State (Phase 3B)
  // =========================================================================
  const [trials, setTrials] = useState<ClinicalTrialResult[]>([]);
  const [trialsLoading, setTrialsLoading] = useState(false);
  const [trialsError, setTrialsError] = useState<string | null>(null);
  const [trialsExpanded, setTrialsExpanded] = useState(false);
  const [hasFetchedTrials, setHasFetchedTrials] = useState(false);
  
  // =========================================================================
  // Trial Filter State (Phase 9: Enhanced Trial Filtering)
  // =========================================================================
  
  /**
   * Default status filters - show the most useful statuses by default.
   * Users can toggle to include TERMINATED and WITHDRAWN.
   * OTHER is included to handle any unexpected API statuses.
   */
  const DEFAULT_STATUS_FILTERS: Set<TrialStatus> = new Set([
    'RECRUITING',
    'ACTIVE_NOT_RECRUITING', 
    'COMPLETED',
    'OTHER'  // Include OTHER to show trials with unexpected statuses
  ]);
  
  /**
   * Set of currently active status filters.
   * Trials are only shown if their status is in this Set.
   */
  const [statusFilters, setStatusFilters] = useState<Set<TrialStatus>>(
    new Set(DEFAULT_STATUS_FILTERS)
  );
  
  /**
   * Toggles a status filter on/off.
   * If status is currently active, removes it. Otherwise, adds it.
   */
  const toggleStatusFilter = (status: TrialStatus) => {
    setStatusFilters(prev => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };
  
  /**
   * Filtered trials based on active status filters.
   * Memoized to avoid re-filtering on every render.
   */
  const filteredTrials = useMemo(
    () => trials.filter(trial => statusFilters.has(trial.status)),
    [trials, statusFilters]
  );
  
  /**
   * Reset filters to defaults when the trial section is collapsed.
   * This ensures each expansion starts with smart defaults.
   */
  useEffect(() => {
    if (!trialsExpanded) {
      setStatusFilters(new Set(DEFAULT_STATUS_FILTERS));
    }
  }, [trialsExpanded]);

  // =========================================================================
  // Drug Form Filter State (Phase 10: Dosage Form Filtering)
  // =========================================================================

  /**
   * Selected dosage forms for filtering drugs.
   * When empty, all drugs are shown (no filtering).
   * When populated, drugs matching ANY selected form are shown (OR logic).
   */
  const [selectedDrugForms, setSelectedDrugForms] = useState<string[]>([]);

  /**
   * Available dosage forms extracted from loaded drugs.
   * Memoized to avoid recalculating on every render.
   */
  const availableDrugForms = useMemo(() => {
    const forms = new Set<string>();
    for (const drug of drugs) {
      if (drug.dosageForm) {
        forms.add(drug.dosageForm);
      }
    }
    return Array.from(forms).sort();
  }, [drugs]);

  /**
   * Toggle a dosage form filter on/off.
   */
  const toggleDrugForm = useCallback((form: string) => {
    setSelectedDrugForms(prev => {
      if (prev.includes(form)) {
        return prev.filter(f => f !== form);
      }
      return [...prev, form];
    });
  }, []);

  /**
   * Clear all dosage form filters.
   */
  const clearDrugFormFilters = useCallback(() => {
    setSelectedDrugForms([]);
  }, []);

  /**
   * Filter drugs by selected dosage forms (OR logic).
   * When no filters selected, returns all drugs.
   */
  const filterDrugsByForm = useCallback((drugList: ValidatedDrugResult[]) => {
    if (selectedDrugForms.length === 0) {
      return drugList; // No filter, show all
    }
    return drugList.filter(drug =>
      drug.dosageForm && selectedDrugForms.includes(drug.dosageForm)
    );
  }, [selectedDrugForms]);

  /**
   * Reset drug form filters when drug section is collapsed.
   */
  useEffect(() => {
    if (!drugsExpanded) {
      setSelectedDrugForms([]);
    }
  }, [drugsExpanded]);

  // =========================================================================
  // Memoized Drug Filters (calculate once, not multiple times in render)
  // =========================================================================

  /**
   * FDA-approved drugs (score >= 7), filtered by dosage form.
   * These are drugs specifically approved for this indication.
   */
  const fdaApprovedDrugs = useMemo(
    () => filterDrugsByForm(
      drugs.filter(d => d.relevanceScore >= DRUG_SCORE_THRESHOLDS.FDA_APPROVED)
    ),
    [drugs, filterDrugsByForm]
  );

  /**
   * Off-label drugs (score 4-6), filtered by dosage form.
   * Commonly prescribed for this condition but not FDA-approved for it.
   */
  const offLabelDrugs = useMemo(
    () => filterDrugsByForm(
      drugs.filter(
        d => d.relevanceScore >= DRUG_SCORE_THRESHOLDS.OFF_LABEL &&
             d.relevanceScore < DRUG_SCORE_THRESHOLDS.FDA_APPROVED
      )
    ),
    [drugs, filterDrugsByForm]
  );
  
  // =========================================================================
  // Drug Handlers
  // =========================================================================
  
  /**
   * Handles loading drugs for this condition with AI validation.
   * - First click: Calls server-side API for AI-powered drug validation
   * - Subsequent clicks: Just toggles expand/collapse (uses local cache)
   * 
   * Note: We call /api/validate-drugs instead of importing validateDrugs directly
   * because the ANTHROPIC_API_KEY is only available server-side.
   */
  const handleToggleDrugs = async () => {
    // Prevent multiple simultaneous requests
    if (drugsLoading) return;
    
    // If already fetched, just toggle visibility
    if (hasFetchedDrugs) {
      setDrugsExpanded(!drugsExpanded);
      return;
    }
    
    // First time: fetch and validate via server-side API
    setDrugsLoading(true);
    setDrugsError(null);
    setDrugsExpanded(true);
    
    try {
      // Call server-side API for AI validation (has access to ANTHROPIC_API_KEY)
      const response = await fetch('/api/validate-drugs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conditionName: name,
          icdCode: code,
        }),
      });

      // Handle HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      // Parse response
      const data = await response.json();
      const validatedResults: ValidatedDrugResult[] = data.drugs || [];
      
      setDrugs(validatedResults);
      setHasFetchedDrugs(true);
      
      // Phase 3C: Notify parent for Mind Map sync
      if (onDrugsLoaded) {
        onDrugsLoaded(code, validatedResults);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to validate drugs';
      setDrugsError(message);
    } finally {
      setDrugsLoading(false);
    }
  };
  
  // =========================================================================
  // Trial Handlers
  // =========================================================================
  
  /**
   * Handles loading clinical trials for this condition.
   * - First click: Fetches from API and expands
   * - Subsequent clicks: Just toggles expand/collapse (uses cache)
   */
  const handleToggleTrials = async () => {
    // Prevent multiple simultaneous requests
    if (trialsLoading) return;
    
    // If already fetched, just toggle visibility
    if (hasFetchedTrials) {
      setTrialsExpanded(!trialsExpanded);
      return;
    }
    
    // First time: fetch from API
    setTrialsLoading(true);
    setTrialsError(null);
    setTrialsExpanded(true);
    
    try {
      const results = await searchTrialsByCondition(name);
      setTrials(results);
      setHasFetchedTrials(true);
      
      // Phase 3C: Notify parent for Mind Map sync
      if (onTrialsLoaded) {
        onTrialsLoaded(code, results);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load trials';
      setTrialsError(message);
    } finally {
      setTrialsLoading(false);
    }
  };
  
  // =========================================================================
  // Render
  // =========================================================================
  
  return (
    <div
      className="
        group
        relative
        bg-white
        dark:bg-gray-800
        rounded-2xl
        border
        border-gray-200/60
        dark:border-gray-700/50
        shadow-sm
        hover:shadow-xl
        hover:shadow-[#1976D2]/10
        dark:hover:shadow-[#1976D2]/5
        hover:border-[#1976D2]/40
        dark:hover:border-[#1976D2]/50
        hover:-translate-y-1
        transition-[transform,box-shadow,border-color]
        duration-300
        ease-out
        overflow-hidden
        will-change-transform
      "
    >
      {/* Main Card Content */}
      <div 
        className="
          p-5
          cursor-pointer
          hover:-translate-y-0.5
          active:scale-[0.99]
          transition-transform
          duration-200
        "
      >
        {/* Card Content */}
        <div className="flex items-start justify-between gap-4">
          {/* Left Side: Code Badge + Name */}
          <div className="flex-1 min-w-0">
            {/* ICD-10 Code Badge + Relevance Badge */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {/* ICD-10 Code Badge - Enhanced */}
              <div
                className="
                  inline-flex
                  items-center
                  px-3
                  py-1.5
                  rounded-lg
                  bg-gradient-to-r
                  from-[#1976D2]/15
                  to-[#0D47A1]/10
                  border
                  border-[#1976D2]/20
                  shadow-sm
                  shadow-[#1976D2]/10
                "
              >
                <span
                  style={{ fontFamily: 'var(--font-mono)' }}
                  className="
                    text-[#0D47A1]
                    dark:text-[#42A5F5]
                    font-bold
                    text-sm
                    tracking-wider
                  "
                >
                  {code}
                </span>
              </div>
              
              {/* Phase 4C: Relevance Badge - Show for top 3 or high scores */}
              {rank && rank <= 3 && (
                <div
                  className="
                    inline-flex
                    items-center
                    gap-1.5
                    px-2.5
                    py-1
                    rounded-full
                    bg-gradient-to-r
                    from-amber-50
                    to-orange-50
                    dark:from-amber-900/30
                    dark:to-orange-900/20
                    border
                    border-amber-200/80
                    dark:border-amber-700/50
                    shadow-sm
                    shadow-amber-200/50
                  "
                  title={score ? `Relevance score: ${score}/100` : undefined}
                >
                  <span className="text-amber-500 text-xs">🔥</span>
                  <span className="text-amber-700 dark:text-amber-400 text-xs font-bold tracking-wide">
                    Top Match
                  </span>
                </div>
              )}
              
              {/* Show score badge for positions 4-10 with high scores */}
              {rank && rank > 3 && rank <= 10 && score && score >= 70 && (
                <div 
                  className="
                    inline-flex
                    items-center
                    gap-1
                    px-2
                    py-1
                    rounded-full
                    bg-blue-50
                    dark:bg-blue-900/20
                    border
                    border-blue-200
                    dark:border-blue-700/50
                  "
                  title={`Relevance score: ${score}/100`}
                >
                  <span className="text-blue-500 text-xs">✓</span>
                  <span className="text-blue-700 dark:text-blue-400 text-xs font-medium">
                    Relevant
                  </span>
                </div>
              )}
            </div>
            
            {/* Condition Name */}
            <h3
              style={{ fontFamily: 'var(--font-body)' }}
              className="
                text-gray-800
                dark:text-gray-200
                font-semibold
                text-base
                leading-snug
                group-hover:text-[#0D47A1]
                dark:group-hover:text-[#42A5F5]
                transition-colors
                duration-200
              "
            >
              {name}
            </h3>
          </div>
          
          {/* Right Side: Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Phase 6: Star/Favorite Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation(); // Prevent card click
                onToggleFavorite?.();
              }}
              className={`
                w-8
                h-8
                rounded-full
                flex
                items-center
                justify-center
                transition-all
                duration-200
                ${isFavorite 
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-500 scale-110' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 opacity-0 group-hover:opacity-100'
                }
              `}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star 
                className={`w-4 h-4 transition-all duration-200 ${isFavorite ? 'fill-current' : ''}`} 
              />
            </button>
            
            {/* Chevron Icon (appears on hover) */}
            <div 
              className="
                w-8
                h-8
                rounded-full
                bg-gray-100
                dark:bg-gray-700
                flex
                items-center
                justify-center
                opacity-0
                group-hover:opacity-100
                translate-x-2
                group-hover:translate-x-0
                transition-all
                duration-300
              "
            >
              <ChevronRight 
                className="
                  w-4
                  h-4
                  text-[#1976D2]
                " 
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Action Buttons Section */}
      <div 
        className="
          px-5
          pb-4
          pt-0
          flex
          flex-wrap
          items-center
          gap-2
          border-t
          border-gray-50
          dark:border-gray-700/50
        "
      >
        {/* View Drugs Button (Blue) */}
        <button
          type="button"
          onClick={handleToggleDrugs}
          disabled={drugsLoading}
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
            ${drugsExpanded 
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50'
            }
            disabled:opacity-50
            disabled:cursor-not-allowed
          `}
        >
          {drugsLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Pill className="w-3.5 h-3.5" />
          )}
          <span>
            {drugsLoading 
              ? 'Loading...' 
              : drugsExpanded 
                ? 'Hide Drugs' 
                : 'View Drugs'
            }
          </span>
          {!drugsLoading && hasFetchedDrugs && drugs.length > 0 && (
            <span 
              className={`
                ml-1
                px-1.5
                py-0.5
                rounded-full
                text-[10px]
                font-bold
                ${drugsExpanded 
                  ? 'bg-white/20 text-white' 
                  : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                }
              `}
            >
              {drugs.length}
            </span>
          )}
          {!drugsLoading && (
            drugsExpanded 
              ? <ChevronUp className="w-3 h-3 ml-0.5" />
              : <ChevronDown className="w-3 h-3 ml-0.5" />
          )}
        </button>
        
        {/* View Trials Button (Purple) */}
        <button
          type="button"
          onClick={handleToggleTrials}
          disabled={trialsLoading}
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
            ${trialsExpanded 
              ? 'bg-purple-500 text-white hover:bg-purple-600' 
              : 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50'
            }
            disabled:opacity-50
            disabled:cursor-not-allowed
          `}
        >
          {trialsLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <FlaskConical className="w-3.5 h-3.5" />
          )}
          <span>
            {trialsLoading 
              ? 'Loading...' 
              : trialsExpanded 
                ? 'Hide Trials' 
                : 'View Trials'
            }
          </span>
          {!trialsLoading && hasFetchedTrials && filteredTrials.length > 0 && (
            <span 
              className={`
                ml-1
                px-1.5
                py-0.5
                rounded-full
                text-[10px]
                font-bold
                ${trialsExpanded 
                  ? 'bg-white/20 text-white' 
                  : 'bg-purple-500/20 text-purple-600 dark:text-purple-400'
                }
              `}
            >
              {filteredTrials.length}
            </span>
          )}
          {!trialsLoading && (
            trialsExpanded 
              ? <ChevronUp className="w-3 h-3 ml-0.5" />
              : <ChevronDown className="w-3 h-3 ml-0.5" />
          )}
        </button>
      </div>
      
      {/* Expandable Drugs Section (Blue Theme) */}
      {drugsExpanded && (
        <div 
          className="
            border-t
            border-blue-100
            dark:border-blue-900/30
            bg-blue-50/50
            dark:bg-blue-900/10
            animate-in
            slide-in-from-top-2
            duration-200
          "
        >
          <div className="p-4">
            {/* Loading State */}
            {drugsLoading && (
              <div className="flex items-center justify-center py-6">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Validating drug relevance...
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Finding clinically relevant treatments
                  </p>
                </div>
              </div>
            )}
            
            {/* Error State */}
            {drugsError && !drugsLoading && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">
                    Failed to load drugs
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-300">
                    {drugsError}
                  </p>
                </div>
              </div>
            )}
            
            {/* No Results State */}
            {!drugsLoading && !drugsError && hasFetchedDrugs && drugs.length === 0 && (
              <div className="text-center py-4">
                <Pill className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No high-confidence drug matches found
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  This may mean no FDA-approved treatments exist, or this condition is typically managed non-pharmacologically
                </p>
              </div>
            )}
            
            {/* Drugs List - Categorized by FDA Approval Status */}
            {!drugsLoading && !drugsError && drugs.length > 0 && (
              <div className="space-y-4">
                {/* Show notice if AI was unavailable */}
                {drugs.some(d => d.relevanceScore === -1) && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <span className="text-xs text-amber-700 dark:text-amber-300">
                      AI validation unavailable - showing unfiltered results
                    </span>
                  </div>
                )}

                {/* Dosage Form Filter Chips */}
                <DrugFilterChips
                  availableForms={availableDrugForms}
                  selectedForms={selectedDrugForms}
                  onToggleForm={toggleDrugForm}
                  onClearFilters={clearDrugFormFilters}
                />

                {/* Empty State when filter matches nothing */}
                {selectedDrugForms.length > 0 && fdaApprovedDrugs.length === 0 && offLabelDrugs.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No drugs match the selected dosage form(s)
                    </p>
                    <button
                      type="button"
                      onClick={clearDrugFormFilters}
                      className="mt-2 text-xs text-blue-500 hover:text-blue-600 font-medium"
                    >
                      Clear filters to see all drugs
                    </button>
                  </div>
                )}

                {/* FDA-Approved Treatments Section */}
                {fdaApprovedDrugs.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        FDA-Approved Treatments
                      </h4>
                      <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                        {fdaApprovedDrugs.length}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 ml-6">
                      Drugs approved by the FDA for this specific condition
                    </p>
                    <div className="grid gap-2 sm:grid-cols-1">
                      {fdaApprovedDrugs.map((drug, index) => (
                        <DrugCard 
                          key={`fda-${drug.brandName}-${index}`} 
                          drug={drug} 
                          badgeType="fda-approved"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Off-Label Options Section */}
                {offLabelDrugs.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Off-Label Options
                      </h4>
                      <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                        {offLabelDrugs.length}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 ml-6">
                      Commonly prescribed for this condition but not FDA-approved for this specific use
                    </p>
                    <div className="grid gap-2 sm:grid-cols-1">
                      {offLabelDrugs.map((drug, index) => (
                        <DrugCard 
                          key={`offlabel-${drug.brandName}-${index}`} 
                          drug={drug} 
                          badgeType="off-label"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Fallback for unscored drugs (AI unavailable) */}
                {drugs.every(d => d.relevanceScore === -1) && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5 mb-3">
                      <Pill className="w-3 h-3" />
                      Related Drugs ({filterDrugsByForm(drugs).length})
                    </p>
                    <div className="grid gap-2 sm:grid-cols-1">
                      {filterDrugsByForm(drugs).map((drug, index) => (
                        <DrugCard key={`unscored-${drug.brandName}-${index}`} drug={drug} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Expandable Trials Section (Purple Theme) */}
      {trialsExpanded && (
        <div 
          className="
            border-t
            border-purple-100
            dark:border-purple-900/30
            bg-purple-50/50
            dark:bg-purple-900/10
            animate-in
            slide-in-from-top-2
            duration-200
          "
        >
          <div className="p-4">
            {/* Loading State */}
            {trialsLoading && (
              <div className="flex items-center justify-center py-6">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Searching clinical trials...
                  </p>
                </div>
              </div>
            )}
            
            {/* Error State */}
            {trialsError && !trialsLoading && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">
                    Failed to load trials
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-300">
                    {trialsError}
                  </p>
                </div>
              </div>
            )}
            
            {/* No Results State - No trials found from API */}
            {!trialsLoading && !trialsError && hasFetchedTrials && trials.length === 0 && (
              <div className="text-center py-4">
                <FlaskConical className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No trials found
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  There may be no clinical trials for this condition
                </p>
              </div>
            )}
            
            {/* Filter Pills - Show when trials exist */}
            {!trialsLoading && !trialsError && hasFetchedTrials && trials.length > 0 && (
              <div className="mb-4">
                {/* Section Header */}
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5 mb-3">
                  <FlaskConical className="w-3 h-3" />
                  Clinical Trials ({filteredTrials.length}{filteredTrials.length !== trials.length ? ` of ${trials.length}` : ''})
                </p>
                
                {/* Filter Pills */}
                <div className="flex flex-wrap gap-2" role="group" aria-label="Filter trials by status">
                  {/* Main status pills */}
                  {(['RECRUITING', 'ACTIVE_NOT_RECRUITING', 'COMPLETED', 'TERMINATED', 'WITHDRAWN'] as TrialStatus[]).map((status) => {
                    const isSelected = statusFilters.has(status);
                    const count = trials.filter(t => t.status === status).length;
                    // Format label: ACTIVE_NOT_RECRUITING → "Active"
                    const label = status === 'ACTIVE_NOT_RECRUITING' 
                      ? 'Active' 
                      : status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, ' ');
                    
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => toggleStatusFilter(status)}
                        aria-pressed={isSelected}
                        aria-label={`${label} trials: ${count}. ${isSelected ? 'Currently shown' : 'Currently hidden'}`}
                        className={`
                          px-3
                          py-1.5
                          min-h-[32px]
                          rounded-full
                          text-xs
                          font-medium
                          cursor-pointer
                          transition-all
                          duration-150
                          select-none
                          ${isSelected
                            ? 'bg-purple-500 text-white hover:bg-purple-600 focus:ring-2 focus:ring-purple-300 focus:ring-offset-1'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 focus:ring-2 focus:ring-gray-300 focus:ring-offset-1'
                          }
                        `}
                      >
                        {label}
                        <span className={`ml-1 ${isSelected ? 'opacity-80' : 'opacity-60'}`}>
                          ({count})
                        </span>
                      </button>
                    );
                  })}
                  
                  {/* OTHER status pill - only show if there are trials with OTHER status */}
                  {trials.some(t => t.status === 'OTHER') && (() => {
                    const isSelected = statusFilters.has('OTHER');
                    const count = trials.filter(t => t.status === 'OTHER').length;
                    
                    return (
                      <button
                        type="button"
                        onClick={() => toggleStatusFilter('OTHER')}
                        aria-pressed={isSelected}
                        aria-label={`Other trials: ${count}. ${isSelected ? 'Currently shown' : 'Currently hidden'}`}
                        className={`
                          px-3
                          py-1.5
                          min-h-[32px]
                          rounded-full
                          text-xs
                          font-medium
                          cursor-pointer
                          transition-all
                          duration-150
                          select-none
                          ${isSelected
                            ? 'bg-purple-500 text-white hover:bg-purple-600 focus:ring-2 focus:ring-purple-300 focus:ring-offset-1'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 focus:ring-2 focus:ring-gray-300 focus:ring-offset-1'
                          }
                        `}
                      >
                        Other
                        <span className={`ml-1 ${isSelected ? 'opacity-80' : 'opacity-60'}`}>
                          ({count})
                        </span>
                      </button>
                    );
                  })()}
                </div>
              </div>
            )}
            
            {/* No Filtered Results State - Trials exist but all filtered out */}
            {!trialsLoading && !trialsError && hasFetchedTrials && trials.length > 0 && filteredTrials.length === 0 && (
              <div className="text-center py-4">
                <FlaskConical className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No trials match current filters
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Select at least one status filter above
                </p>
              </div>
            )}
            
            {/* Trials List */}
            {!trialsLoading && !trialsError && filteredTrials.length > 0 && (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-1">
                  {filteredTrials.map((trial) => (
                    <TrialCard key={trial.nctId} trial={trial} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Subtle Bottom Accent Line (appears on hover) - Enhanced */}
      <div
        className="
          absolute
          bottom-0
          left-0
          right-0
          h-1
          bg-gradient-to-r
          from-transparent
          via-[#1976D2]
          to-transparent
          opacity-0
          group-hover:opacity-100
          transition-all
          duration-500
          transform
          scale-x-0
          group-hover:scale-x-100
        "
      />
    </div>
  );
}

export default memo(ResultCard);
