# Phase 6: Favorites & History Implementation Plan

## Progress: 0% ░░░░░░░░░░░░░░░░░░░░ 0/12 steps

**Goal:** Add favorites system and enhanced search history so users can save frequently used ICD codes and track their searches.

**Success Criteria:**
- ⭐ Star button on every result card
- 💾 Click star → saves to favorites (localStorage)
- 🔢 "Favorites (5)" badge in header
- 📋 Click badge → opens favorites panel
- 🔍 Click favorite → searches that code
- 🔄 Persists across browser refresh
- 📅 History shows timestamps
- ✅ All features work without breaking existing functionality

---

## Phase 6A: Core Favorites (Steps 1-4)

### 🟥 Step 1: Create Favorites Types & Storage Utilities

**Files to create/modify:**
- `app/types/icd.ts` - Add FavoriteICD and SearchHistoryEntry interfaces
- `app/lib/favoritesStorage.ts` - Create localStorage utilities

**Types to add:**
```typescript
// FavoriteICD interface
interface FavoriteICD {
  code: string;           // "E11.9"
  name: string;           // "Type 2 diabetes mellitus..."
  favoritedAt: string;    // ISO timestamp
  searchQuery?: string;   // What search led to this
  score?: number;         // Relevance score
  category?: string;      // "E" for endocrine, etc.
}

// SearchHistoryEntry interface (enhanced)
interface SearchHistoryEntry {
  query: string;           // "diabetes"
  searchedAt: string;      // ISO timestamp
  resultCount: number;     // 847
  topResultCode?: string;  // "E11.9"
}
```

**Storage utilities:**
- `getFavorites(): FavoriteICD[]`
- `saveFavorites(favorites: FavoriteICD[]): void`
- `isFavorite(code: string): boolean`
- `FAVORITES_KEY`, `HISTORY_KEY` constants
- `MAX_FAVORITES = 500`, `MAX_HISTORY = 50`

---

### 🟥 Step 2: Add Favorites State to page.tsx

**File to modify:** `app/page.tsx`

**Changes:**
- Import favorites utilities from `./lib/favoritesStorage`
- Add `favorites` state: `useState<FavoriteICD[]>([])`
- Add `favoritesMap` for O(1) lookup: `Map<string, FavoriteICD>`
- Load favorites from localStorage on mount (useEffect)
- Create `toggleFavorite(result: ScoredICD10Result)` function
- Create `isFavorited(code: string): boolean` helper
- Pass favorites props to SearchResults component

**State shape:**
```typescript
const [favorites, setFavorites] = useState<FavoriteICD[]>([]);
const [showFavorites, setShowFavorites] = useState(false);
```

---

### 🟥 Step 3: Add Star Button to ResultCard

**File to modify:** `app/components/ResultCard.tsx`

**Changes:**
- Add new props: `isFavorite?: boolean`, `onToggleFavorite?: () => void`
- Import `Star` icon from lucide-react
- Add star button in card header (top-right corner)
- Style: outline when not favorited, filled yellow when favorited
- Hover effects matching existing design
- Prevent event propagation (don't trigger card click)

**Button design:**
```
┌──────────────────────────────────────────────┐
│  [E11.9] Type 2 diabetes mellitus...    [★] │
│  ...                                         │
└──────────────────────────────────────────────┘
```

---

### 🟥 Step 4: Create FavoritesPanel Component

**File to create:** `app/components/FavoritesPanel.tsx`

**Features:**
- Slide-in panel from right (or modal)
- Header: "Favorites (12)" with close button
- List of saved favorites
- Each item shows: code badge, name, date saved
- Click item → triggers search for that code
- Delete button (trash icon) to remove individual favorites
- "Clear All" button at bottom
- Empty state: "No favorites saved yet"
- Sorted by date (most recent first)

**Props:**
```typescript
interface FavoritesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: FavoriteICD[];
  onRemove: (code: string) => void;
  onSearch: (code: string) => void;
  onClearAll: () => void;
}
```

---

## Phase 6B: Favorites UI Integration (Steps 5-7)

### 🟥 Step 5: Add Favorites Button to Header

**File to modify:** `app/page.tsx`

**Changes:**
- Add "Favorites" button next to logo in header
- Show count badge: "Favorites (12)"
- Use Heart or Star icon
- Match existing header styling (green accent)
- Click → toggles FavoritesPanel visibility

**Button design:**
```
[🏥 ICD Mind Map Tool]    [⭐ Favorites (12)]    [Status]
```

---

### 🟥 Step 6: Enhance FavoritesPanel Display

**File to modify:** `app/components/FavoritesPanel.tsx`

**Enhancements:**
- Show category color indicator (E=green, F=blue, I=red, etc.)
- Show relative date: "2 days ago" instead of full timestamp
- Add search/filter within favorites
- Group by category option
- Show score badge if available
- Responsive design (full screen on mobile)

**Item design:**
```
┌─────────────────────────────────────────────────┐
│ 🟢 E11.9                              [🗑️] [🔍] │
│ Type 2 diabetes mellitus without complications  │
│ ⏱️ Saved 2 days ago • Score: 85                 │
└─────────────────────────────────────────────────┘
```

---

### 🟥 Step 7: Search from Favorites

**Files to modify:** `app/page.tsx`, `app/components/FavoritesPanel.tsx`

**Changes:**
- Add "Search" button/icon on each favorite item
- Click → closes panel and searches for that ICD code
- Or: click favorite item directly to search
- Update search bar value with the code
- Show results normally

---

## Phase 6C: Enhanced History (Steps 8-10)

### 🟥 Step 8: Enhance History with Timestamps

**Files to modify:** 
- `app/types/icd.ts` - Add SearchHistoryEntry type
- `app/page.tsx` - Update addToRecentSearches function
- `app/lib/favoritesStorage.ts` - Add history utilities

**Changes:**
- Replace `string[]` with `SearchHistoryEntry[]`
- Store: query, timestamp, resultCount, topResultCode
- Update localStorage save/load logic
- Maintain backward compatibility (migrate old format)

**New history format:**
```json
[
  {
    "query": "diabetes",
    "searchedAt": "2026-01-26T10:30:00.000Z",
    "resultCount": 847,
    "topResultCode": "E11.9"
  }
]
```

---

### 🟥 Step 9: Add Clear History Functionality

**Files to modify:** `app/components/SearchBar.tsx`, `app/page.tsx`

**Changes:**
- Add "Clear" button next to "Recent:" label
- Confirmation prompt before clearing
- Clear individual history items (X button on each)
- Update localStorage when cleared
- Pass `onClearHistory` prop from page.tsx

---

### 🟥 Step 10: Create History Panel

**File to create:** `app/components/HistoryPanel.tsx` (optional)

**Features:**
- Show full search history (up to 50 items)
- Display timestamp: "Jan 25, 2026 at 2:30 PM"
- Show result count: "Found 847 results"
- Show top result code for quick reference
- Click to re-search
- Delete individual items
- Clear all history button

**Alternative:** Enhance SearchBar to show expanded history on hover/click

---

## Phase 6D: Testing & Polish (Steps 11-12)

### 🟥 Step 11: Test All Features

**Test checklist:**
- [ ] Star button appears on all result cards
- [ ] Click star → toggles favorite (visual feedback)
- [ ] Favorite persists after page refresh
- [ ] Unfavorite removes from localStorage
- [ ] Header shows correct count
- [ ] Favorites panel opens/closes properly
- [ ] Click favorite → triggers search
- [ ] Remove favorite from panel works
- [ ] Clear all favorites works
- [ ] History shows timestamps
- [ ] Clear history works
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Performance is good (no lag)

**Edge cases:**
- [ ] Empty favorites state
- [ ] 500+ favorites (limit check)
- [ ] localStorage full
- [ ] Same code favorited twice (deduplicate)
- [ ] Very long condition names (truncate)

---

### 🟥 Step 12: Update Documentation

**File to modify:** `README.md`

**Add section:**
```markdown
## ⭐ Favorites & History (Phase 6)

Save frequently used ICD codes for quick access!

### Favorites
- Click the ⭐ star on any result to save it
- Access favorites from the header button
- Click a favorite to search for it
- Favorites persist across browser sessions

### Search History
- View your recent searches with timestamps
- See how many results each search found
- Click to re-run any previous search
- Clear individual items or all history
```

---

## Implementation Order

```
Step 1 → Step 2 → Step 3 → Step 4 → Step 5 → Step 6 → Step 7 → Step 8 → Step 9 → Step 10 → Step 11 → Step 12
  ↓
Types    State    Star     Panel    Header   Display  Search   History  Clear    Panel    Test     Docs
```

---

## Files Summary

| File | Action | Description |
|------|--------|-------------|
| `app/types/icd.ts` | Modify | Add FavoriteICD, SearchHistoryEntry |
| `app/lib/favoritesStorage.ts` | Create | localStorage utilities |
| `app/page.tsx` | Modify | Add favorites state, toggle function |
| `app/components/ResultCard.tsx` | Modify | Add star button |
| `app/components/FavoritesPanel.tsx` | Create | Favorites view panel |
| `app/components/SearchBar.tsx` | Modify | Enhanced history display |
| `app/components/HistoryPanel.tsx` | Create | (Optional) Full history view |
| `README.md` | Modify | Add Phase 6 documentation |

---

## Technical Notes

**Performance:**
- Use `Map<string, FavoriteICD>` for O(1) favorite lookup
- Debounce localStorage writes (optional)
- Memoize favorites list with useMemo

**localStorage Keys:**
- `icd-favorites` - Array of FavoriteICD
- `icd-search-history` - Array of SearchHistoryEntry (enhanced)
- Keep `icd-recent-searches` for backward compatibility

**Limits:**
- Max 500 favorites
- Max 50 history entries
- Truncate old items when limit reached

---

## Commands

- `/execute` - Begin implementation (specify steps)
- `/review` - Review completed work
- Progress updates after each phase

---

*Last Updated: January 26, 2026*
