/**
 * Favorites & History Storage Utilities
 * =====================================
 * 
 * This module handles localStorage operations for favorites and search history.
 * 
 * Key features:
 * - Persistent storage across browser sessions
 * - O(1) lookup with Map data structure
 * - Graceful error handling (localStorage can fail)
 * - Size limits to prevent storage bloat
 * 
 * Storage keys:
 * - 'icd-favorites': Array of FavoriteICD objects
 * - 'icd-search-history': Array of SearchHistoryEntry objects
 * - 'icd-recent-searches': Legacy string[] (kept for backward compatibility)
 */

import { FavoriteICD, SearchHistoryEntry } from '../types/icd';

// =============================================================================
// Constants
// =============================================================================

/** localStorage key for favorites */
export const FAVORITES_KEY = 'icd-favorites';

/** localStorage key for enhanced search history */
export const HISTORY_KEY = 'icd-search-history';

/** Maximum number of favorites to store */
export const MAX_FAVORITES = 500;

/** Maximum number of history entries to store */
export const MAX_HISTORY = 50;

// =============================================================================
// Favorites Functions
// =============================================================================

/**
 * Retrieves all favorites from localStorage.
 * 
 * Handles cases where:
 * - localStorage is empty
 * - Data is corrupted/invalid
 * - localStorage is not available
 * 
 * @returns Array of FavoriteICD objects, or empty array if none
 */
export function getFavorites(): FavoriteICD[] {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    
    // Validate each item has required fields
    return parsed.filter((item: unknown): item is FavoriteICD => 
      typeof item === 'object' &&
      item !== null &&
      'code' in item &&
      'name' in item &&
      'favoritedAt' in item
    );
  } catch (error) {
    // localStorage might not be available (SSR, private browsing, etc.)
    console.warn('Failed to load favorites:', error);
    return [];
  }
}

/**
 * Saves favorites to localStorage.
 * 
 * Automatically limits to MAX_FAVORITES items (removes oldest).
 * 
 * @param favorites - Array of favorites to save
 */
export function saveFavorites(favorites: FavoriteICD[]): void {
  try {
    // Limit to MAX_FAVORITES (keep most recent)
    const limited = favorites.slice(0, MAX_FAVORITES);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(limited));
  } catch (error) {
    // Might fail if storage is full
    console.warn('Failed to save favorites:', error);
  }
}

/**
 * Adds a favorite to storage.
 * 
 * If the code already exists, it won't be duplicated.
 * New favorites are added at the beginning (most recent first).
 * 
 * @param favorite - The favorite to add
 * @returns Updated favorites array
 */
export function addFavorite(favorite: FavoriteICD): FavoriteICD[] {
  const current = getFavorites();
  
  // Check if already exists (by code)
  const exists = current.some(f => f.code === favorite.code);
  if (exists) return current;
  
  // Add to beginning
  const updated = [favorite, ...current];
  saveFavorites(updated);
  return updated;
}

/**
 * Removes a favorite from storage by code.
 * 
 * @param code - The ICD-10 code to remove
 * @returns Updated favorites array
 */
export function removeFavorite(code: string): FavoriteICD[] {
  const current = getFavorites();
  const updated = current.filter(f => f.code !== code);
  saveFavorites(updated);
  return updated;
}

/**
 * Checks if a code is favorited.
 * 
 * Note: For O(1) lookup in components, use a Map instead of this function.
 * 
 * @param code - The ICD-10 code to check
 * @returns True if favorited, false otherwise
 */
export function isFavorite(code: string): boolean {
  const favorites = getFavorites();
  return favorites.some(f => f.code === code);
}

/**
 * Clears all favorites from storage.
 */
export function clearAllFavorites(): void {
  try {
    localStorage.removeItem(FAVORITES_KEY);
  } catch (error) {
    console.warn('Failed to clear favorites:', error);
  }
}

/**
 * Creates a Map from favorites array for O(1) lookup.
 * 
 * Use this in components to check if codes are favorited efficiently.
 * 
 * @param favorites - Array of favorites
 * @returns Map where key is code and value is the favorite
 */
export function createFavoritesMap(favorites: FavoriteICD[]): Map<string, FavoriteICD> {
  return new Map(favorites.map(f => [f.code, f]));
}

// =============================================================================
// Search History Functions
// =============================================================================

/**
 * Retrieves search history from localStorage.
 * 
 * @returns Array of SearchHistoryEntry objects
 */
export function getSearchHistory(): SearchHistoryEntry[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    
    // Validate each item has required fields
    return parsed.filter((item: unknown): item is SearchHistoryEntry =>
      typeof item === 'object' &&
      item !== null &&
      'query' in item &&
      'searchedAt' in item
    );
  } catch (error) {
    console.warn('Failed to load search history:', error);
    return [];
  }
}

/**
 * Saves search history to localStorage.
 * 
 * @param history - Array of history entries to save
 */
export function saveSearchHistory(history: SearchHistoryEntry[]): void {
  try {
    // Limit to MAX_HISTORY
    const limited = history.slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(limited));
  } catch (error) {
    console.warn('Failed to save search history:', error);
  }
}

/**
 * Adds a search to history.
 * 
 * If the same query exists, it's moved to the top with updated timestamp.
 * 
 * @param entry - The history entry to add
 * @returns Updated history array
 */
export function addToHistory(entry: SearchHistoryEntry): SearchHistoryEntry[] {
  const current = getSearchHistory();
  
  // Remove duplicate (same query, case-insensitive)
  const filtered = current.filter(
    h => h.query.toLowerCase() !== entry.query.toLowerCase()
  );
  
  // Add to beginning
  const updated = [entry, ...filtered];
  saveSearchHistory(updated);
  return updated;
}

/**
 * Removes a specific history entry.
 * 
 * @param query - The query to remove
 * @returns Updated history array
 */
export function removeFromHistory(query: string): SearchHistoryEntry[] {
  const current = getSearchHistory();
  const updated = current.filter(
    h => h.query.toLowerCase() !== query.toLowerCase()
  );
  saveSearchHistory(updated);
  return updated;
}

/**
 * Clears all search history.
 */
export function clearSearchHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.warn('Failed to clear search history:', error);
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Formats a timestamp into a relative time string.
 * 
 * @param isoString - ISO timestamp string
 * @returns Relative time like "2 hours ago", "Yesterday", "Jan 15"
 */
export function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    // For older dates, show the date
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  } catch {
    return 'Unknown';
  }
}

/**
 * Extracts the category (first letter) from an ICD code.
 * 
 * @param code - The ICD-10 code
 * @returns The category letter (uppercase)
 */
export function getCodeCategory(code: string): string {
  return code.charAt(0).toUpperCase();
}
