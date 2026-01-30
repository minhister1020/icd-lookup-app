/**
 * ICD-10 Search Results Grouping
 * ==============================
 * 
 * This file provides functions to group search results by ICD-10 chapter
 * (body system / disease category). This makes it easier for users to
 * navigate large result sets.
 * 
 * Key concepts:
 * - Results are grouped by chapter (determined from code's first letter)
 * - Categories are sorted by highest relevance score (most relevant first)
 * - Expansion state tracks which categories are open in the UI
 * 
 * @example Basic usage:
 * ```typescript
 * import { groupByChapter } from './grouping';
 * 
 * const results = [
 *   { code: 'E11.9', name: 'Type 2 diabetes...', score: 95, ... },
 *   { code: 'I10', name: 'Hypertension', score: 72, ... },
 *   { code: 'E10.9', name: 'Type 1 diabetes...', score: 82, ... },
 * ];
 * 
 * const grouped = groupByChapter(results);
 * // Returns:
 * // {
 * //   categories: [
 * //     { chapter: { shortName: 'Endocrine' }, results: [E11.9, E10.9], topScore: 95 },
 * //     { chapter: { shortName: 'Circulatory' }, results: [I10], topScore: 72 }
 * //   ],
 * //   totalResults: 3,
 * //   totalCategories: 2
 * // }
 * ```
 */

import { 
  ScoredICD10Result, 
  CategoryGroup, 
  GroupedSearchResults,
  ChapterInfo 
} from '../types/icd';
import { getChapter } from './chapterMapping';

// =============================================================================
// Main Grouping Function
// =============================================================================

/**
 * Groups scored search results by ICD-10 chapter.
 * 
 * This is the main function for organizing search results. It:
 * 1. Groups results by chapter (using getChapter for each code)
 * 2. Calculates the top score for each category
 * 3. Sorts categories by top score (most relevant first)
 * 4. Sets default expansion states
 * 
 * @param results - Array of scored ICD-10 results (already sorted by relevance)
 * @returns Grouped results ready for UI rendering
 * 
 * @example
 * const grouped = groupByChapter(scoredResults);
 * grouped.categories.forEach(cat => {
 *   console.log(`${cat.chapter.shortName}: ${cat.results.length} results`);
 * });
 */
export function groupByChapter(results: ScoredICD10Result[]): GroupedSearchResults {
  // Handle empty results
  if (!results || results.length === 0) {
    return {
      categories: [],
      totalResults: 0,
      totalCategories: 0
    };
  }
  
  // Step 1: Group results by chapter ID using a Map
  // Map<chapterId, { chapter: ChapterInfo, results: ScoredICD10Result[] }>
  const chapterMap = new Map<number, { chapter: ChapterInfo; results: ScoredICD10Result[] }>();
  
  for (const result of results) {
    const chapter = getChapter(result.code);
    const chapterId = chapter.id;
    
    if (!chapterMap.has(chapterId)) {
      // First result for this chapter - initialize the group
      chapterMap.set(chapterId, {
        chapter,
        results: [result]
      });
    } else {
      // Add to existing group
      chapterMap.get(chapterId)!.results.push(result);
    }
  }
  
  // Step 2: Convert Map to CategoryGroup array with topScore calculated
  const unsortedCategories: CategoryGroup[] = [];
  
  chapterMap.forEach(({ chapter, results: groupResults }) => {
    // Find the highest score in this group
    // Since results are already sorted by score, first result has highest score
    // But we calculate explicitly for safety
    const topScore = Math.max(...groupResults.map(r => r.score));
    
    unsortedCategories.push({
      chapter,
      results: groupResults,
      topScore,
      isExpanded: false // Will be set in step 4
    });
  });
  
  // Step 3: Sort categories by top score (most relevant category first)
  const sortedCategories = sortCategoriesByRelevance(unsortedCategories);
  
  // Step 4: Set default expansion states
  const categoriesWithExpansion = sortedCategories.map((category, index) => ({
    ...category,
    isExpanded: getDefaultExpandedState(category, index)
  }));
  
  return {
    categories: categoriesWithExpansion,
    totalResults: results.length,
    totalCategories: categoriesWithExpansion.length
  };
}

// =============================================================================
// Sorting Helper
// =============================================================================

/**
 * Sorts categories by relevance (highest topScore first).
 * 
 * This ensures that the category containing the most relevant result
 * appears at the top of the grouped results.
 * 
 * Tie-breaker: If two categories have the same top score,
 * the one with more results comes first.
 * 
 * @param categories - Unsorted array of category groups
 * @returns New array sorted by topScore descending
 * 
 * @example
 * const sorted = sortCategoriesByRelevance([
 *   { chapter: { shortName: 'Circulatory' }, topScore: 72, ... },
 *   { chapter: { shortName: 'Endocrine' }, topScore: 95, ... }
 * ]);
 * // Returns: [Endocrine (95), Circulatory (72)]
 */
export function sortCategoriesByRelevance(categories: CategoryGroup[]): CategoryGroup[] {
  // Create a copy to avoid mutating the original array
  return [...categories].sort((a, b) => {
    // Primary sort: Higher topScore first
    const scoreDiff = b.topScore - a.topScore;
    if (scoreDiff !== 0) return scoreDiff;
    
    // Tie-breaker: More results first
    return b.results.length - a.results.length;
  });
}

// =============================================================================
// Expansion State Helper
// =============================================================================

/**
 * Determines the default expansion state for a category.
 * 
 * Rules (in order of priority):
 * 1. First category (index 0) → Always expanded (contains top match)
 * 2. Categories with ≤3 results → Expanded (small, easy to scan)
 * 3. All other categories → Collapsed (prevent overwhelming the user)
 * 
 * @param category - The category to check
 * @param index - Position in the sorted category list (0 = first/most relevant)
 * @returns true if the category should start expanded
 * 
 * @example
 * getDefaultExpandedState(endocrineCategory, 0) // true (first category)
 * getDefaultExpandedState(tinyCategory, 3)      // true (only 2 results)
 * getDefaultExpandedState(bigCategory, 2)       // false (not first, many results)
 */
export function getDefaultExpandedState(category: CategoryGroup, index: number): boolean {
  // Rule 1: First category is always expanded (contains the top match)
  if (index === 0) {
    return true;
  }
  
  // Rule 2: Small categories (≤3 results) are expanded for easy scanning
  if (category.results.length <= 3) {
    return true;
  }
  
  // Rule 3: Everything else starts collapsed
  return false;
}

// =============================================================================
// Re-grouping Helper (for Load More)
// =============================================================================

/**
 * Re-groups results after loading more, preserving expansion states.
 * 
 * When the user clicks "Load More", we receive additional results.
 * This function:
 * 1. Combines existing results with new results
 * 2. Re-groups everything by chapter
 * 3. Preserves the user's expand/collapse preferences
 * 
 * @param existing - Current grouped results (with user's expansion states)
 * @param newResults - Additional results from "Load More"
 * @returns New grouped results with expansion states preserved
 * 
 * @example
 * // User has expanded Endocrine and collapsed Circulatory
 * // After loading more, preserve those preferences
 * const updated = regroupWithNewResults(currentGrouped, moreResults);
 */
export function regroupWithNewResults(
  existing: GroupedSearchResults,
  newResults: ScoredICD10Result[]
): GroupedSearchResults {
  // Handle edge case: No existing results
  if (existing.totalResults === 0) {
    return groupByChapter(newResults);
  }
  
  // Handle edge case: No new results
  if (!newResults || newResults.length === 0) {
    return existing;
  }
  
  // Step 1: Extract all existing results from categories
  const allExistingResults: ScoredICD10Result[] = existing.categories.flatMap(
    category => category.results
  );
  
  // Step 2: Combine with new results (avoid duplicates by code)
  const seenCodes = new Set(allExistingResults.map(r => r.code));
  const uniqueNewResults = newResults.filter(r => !seenCodes.has(r.code));
  const combinedResults = [...allExistingResults, ...uniqueNewResults];
  
  // Step 3: Re-sort combined results by score (highest first)
  combinedResults.sort((a, b) => b.score - a.score);
  
  // Step 4: Re-group by chapter
  const regrouped = groupByChapter(combinedResults);
  
  // Step 5: Preserve expansion states from existing categories
  // Build a map of chapter ID → was it expanded?
  const expansionStates = new Map<number, boolean>();
  existing.categories.forEach(cat => {
    expansionStates.set(cat.chapter.id, cat.isExpanded);
  });
  
  // Apply preserved expansion states (or use default for new categories)
  regrouped.categories = regrouped.categories.map((category, index) => {
    const chapterId = category.chapter.id;
    
    // If this chapter existed before, use its expansion state
    if (expansionStates.has(chapterId)) {
      return {
        ...category,
        isExpanded: expansionStates.get(chapterId)!
      };
    }
    
    // New chapter (from new results) - use default expansion
    return {
      ...category,
      isExpanded: getDefaultExpandedState(category, index)
    };
  });
  
  return regrouped;
}

// =============================================================================
// Expansion State Updater
// =============================================================================

/**
 * Toggles the expansion state of a specific category.
 * 
 * Returns a new GroupedSearchResults with the specified category's
 * expansion state flipped. Does not mutate the original.
 * 
 * @param grouped - Current grouped results
 * @param chapterId - ID of the chapter to toggle
 * @returns New grouped results with toggled expansion
 * 
 * @example
 * // User clicks to expand/collapse Circulatory (chapter 9)
 * const updated = toggleCategoryExpansion(currentGrouped, 9);
 */
export function toggleCategoryExpansion(
  grouped: GroupedSearchResults,
  chapterId: number
): GroupedSearchResults {
  return {
    ...grouped,
    categories: grouped.categories.map(category => {
      if (category.chapter.id === chapterId) {
        return {
          ...category,
          isExpanded: !category.isExpanded
        };
      }
      return category;
    })
  };
}

/**
 * Expands all categories.
 * 
 * @param grouped - Current grouped results
 * @returns New grouped results with all categories expanded
 */
export function expandAllCategories(grouped: GroupedSearchResults): GroupedSearchResults {
  return {
    ...grouped,
    categories: grouped.categories.map(category => ({
      ...category,
      isExpanded: true
    }))
  };
}

/**
 * Collapses all categories.
 * 
 * @param grouped - Current grouped results
 * @returns New grouped results with all categories collapsed
 */
export function collapseAllCategories(grouped: GroupedSearchResults): GroupedSearchResults {
  return {
    ...grouped,
    categories: grouped.categories.map(category => ({
      ...category,
      isExpanded: false
    }))
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Checks if there's only one category in the results.
 * 
 * Useful for UI decisions - when there's only one category,
 * we might want to hide the category header or always show expanded.
 * 
 * @param grouped - Grouped results
 * @returns true if there's exactly one category
 */
export function isSingleCategory(grouped: GroupedSearchResults): boolean {
  return grouped.totalCategories === 1;
}

/**
 * Gets the category containing a specific code.
 * 
 * @param grouped - Grouped results
 * @param code - ICD-10 code to find
 * @returns The CategoryGroup containing this code, or undefined
 */
export function findCategoryByCode(
  grouped: GroupedSearchResults,
  code: string
): CategoryGroup | undefined {
  const chapter = getChapter(code);
  return grouped.categories.find(cat => cat.chapter.id === chapter.id);
}

/**
 * Gets summary statistics for the grouped results.
 * 
 * @param grouped - Grouped results
 * @returns Object with summary statistics
 */
export function getGroupingSummary(grouped: GroupedSearchResults): {
  totalResults: number;
  totalCategories: number;
  expandedCount: number;
  collapsedCount: number;
  largestCategory: string;
  largestCategoryCount: number;
} {
  const expandedCount = grouped.categories.filter(c => c.isExpanded).length;
  
  // Find largest category
  let largestCategory = '';
  let largestCategoryCount = 0;
  
  grouped.categories.forEach(cat => {
    if (cat.results.length > largestCategoryCount) {
      largestCategoryCount = cat.results.length;
      largestCategory = cat.chapter.shortName;
    }
  });
  
  return {
    totalResults: grouped.totalResults,
    totalCategories: grouped.totalCategories,
    expandedCount,
    collapsedCount: grouped.totalCategories - expandedCount,
    largestCategory,
    largestCategoryCount
  };
}
