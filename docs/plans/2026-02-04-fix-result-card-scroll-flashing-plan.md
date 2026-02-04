---
title: "Fix: Result Card Scroll Flashing"
type: fix
date: 2026-02-04
---

# Fix: Result Card Scroll Flashing on Large Result Sets

## Overview

ICD-10 result cards flash white and disappear/reappear when scrolling through large result sets (87+ cards like Musculoskeletal chapter). This is a React re-rendering performance issue caused by missing memoization on card components and animations that replay on every render.

## Problem Statement

**Symptoms:**
- Cards flash white then reappear during scroll
- Only occurs on large result sets (87+ cards)
- Reproducible in all browsers (Chrome, Firefox, Edge)
- Random occurrence during scroll interactions

**Root Cause Analysis:**
1. **No React.memo on card components** - ResultCard (986 lines), DrugCard (231 lines), TrialCard (323 lines) are not memoized
2. **CSS animations replay on re-render** - Classes like `animate-in slide-in-from-bottom-2` run on every render, not just initial mount
3. **Some callbacks create new references** - Inline arrow functions in props break shallow equality checks
4. **Heavy components** - ResultCard alone has 14 internal state variables for drugs, trials, loading states

## Proposed Solution

### Phase 1: Add React.memo to Card Components

Wrap the following components with `React.memo()`:

| Component | File | Priority |
|-----------|------|----------|
| ResultCard | `app/components/ResultCard.tsx:72` | High |
| DrugCard | `app/components/DrugCard.tsx:48` | High |
| TrialCard | `app/components/TrialCard.tsx:51` | High |
| CategorySection | `app/components/CategorySection.tsx:286` | Medium |

**Implementation pattern:**
```tsx
// Before
export function ResultCard({ ... }: ResultCardProps) {
  // component body
}

// After
export const ResultCard = memo(function ResultCard({ ... }: ResultCardProps) {
  // component body
});
```

### Phase 2: Fix Animation Replay Issue

Prevent animations from replaying on re-renders using a `mounted` ref pattern:

**File: `app/components/ResultCard.tsx`**

```tsx
const mounted = useRef(false);

useEffect(() => {
  mounted.current = true;
}, []);

// In JSX - only apply animation classes on initial mount
className={`... ${!mounted.current ? 'animate-in fade-in slide-in-from-bottom-2' : ''}`}
```

Apply this pattern to animations at:
- `SearchResults.tsx:829` - Card wrapper animation
- `SearchResults.tsx:805` - Category view card animation
- `ResultCard.tsx:653` - Drug section expand animation
- `ResultCard.tsx:798` - Trial section expand animation

### Phase 3: Stabilize Callback References

Fix inline callbacks that create new references on each render:

**SearchResults.tsx:757, 841** - Inline `onToggleFavorite` wrapper:
```tsx
// Before
onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(exactMatch) : undefined}

// After - use useCallback in parent or pass stable reference
onToggleFavorite={handleToggleFavoriteForResult}
```

### Phase 4: CSS Performance Optimization

Replace `transition-all` with specific properties:

**File: `app/components/ResultCard.tsx:313-315`**
```css
/* Before */
transition-all duration-300

/* After */
transition-[transform,box-shadow,border-color] duration-300
```

## Technical Considerations

### Memoization Strategy

- Use shallow comparison (default) for React.memo
- All parent callbacks are already wrapped in `useCallback` (verified in SearchResults.tsx lines 343-414)
- The `checkIsFavorite` callback depends on `favoritesMap` which uses `useMemo` for O(1) lookup

### State Preservation

React.memo prevents unmounting, so:
- Expanded drug/trial sections remain expanded during scroll
- Fetched drug/trial data is preserved
- Internal loading states are maintained

### Key Props Validation

Current key implementations:
- ResultCard: Uses `result.code` - stable and unique
- DrugCard: Uses `brandName-index` - acceptable since drug order is stable within session
- TrialCard: Uses `trial.nctId` - stable and unique (NCT IDs are unique identifiers)
- Trial locations: Uses `index` - should change to composite key

## Acceptance Criteria

### Functional
- [ ] Scrolling through 100+ result cards causes no visual flashing
- [ ] Cards animate only when first appearing, not on re-renders
- [ ] Expanded drug/trial sections remain expanded during:
  - Scrolling
  - Toggling favorites on other cards
  - Load More adding new cards

### Performance
- [ ] Maintain smooth 60fps scrolling with 100 cards on mid-tier hardware
- [ ] Toggling a favorite causes only that card to re-render (verify with React DevTools)

### No Regressions
- [ ] Drug expansion still fetches and displays correctly
- [ ] Trial expansion still fetches and displays correctly
- [ ] Favorites persist to localStorage
- [ ] Load More appends (not replaces) results
- [ ] Category grouping works correctly
- [ ] View mode toggle (Flat/Grouped) works

## Test Plan

### Manual Testing Scenarios

1. **Primary bug reproduction test:**
   - Search "musculoskeletal" to get 87+ results
   - Scroll rapidly up and down
   - Verify no white flashing occurs

2. **Favorite toggle during scroll:**
   - Load 100+ results
   - Expand drugs on card #30
   - Scroll to card #80
   - Toggle favorite on card #80
   - Scroll back - verify card #30 is still expanded

3. **Load More with expanded cards:**
   - Load initial 25 results
   - Expand trials on card #10
   - Click "Load More"
   - Verify card #10 trials are still expanded
   - Verify new cards animate in, existing cards don't

4. **View mode switch:**
   - Load results in Flat view
   - Expand drugs on a card
   - Switch to Grouped view
   - Verify functionality works (expansion state may reset - acceptable)

### Browser Testing
- [ ] Chrome (primary)
- [ ] Firefox
- [ ] Edge
- [ ] Safari (if available)

### React DevTools Profiling
Before/after comparison:
- Record profiler during scroll
- Compare component render counts
- Verify ResultCard only re-renders when its specific props change

## Files to Modify

| File | Changes | Status |
|------|---------|--------|
| `app/components/ResultCard.tsx` | Add React.memo wrapper, add mounted ref for animations, optimize transitions | ✅ Done |
| `app/components/DrugCard.tsx` | Add React.memo wrapper | ✅ Done |
| `app/components/TrialCard.tsx` | Add React.memo wrapper, change location key from index to composite | ✅ Done |
| `app/components/CategorySection.tsx` | Add React.memo wrapper | ✅ Done |
| `app/components/SearchResults.tsx` | Add mounted ref for card wrapper animations, stabilize inline callbacks | ✅ Done |

## Future Considerations

If performance issues persist with 200+ cards, consider:
- **Virtualization** with `@tanstack/react-virtual` or `react-window`
- This would require architectural changes since virtualization unmounts off-screen cards (losing internal state)
- Would need to lift drug/trial state to parent and restore on remount

## References

### Internal
- ResultCard component: `app/components/ResultCard.tsx:72-985`
- SearchResults mapping: `app/components/SearchResults.tsx:800-847`
- CategorySection mapping: `app/components/CategorySection.tsx:451-472`
- Existing useCallback patterns: `app/components/SearchResults.tsx:343-414`

### External
- [React.memo documentation](https://react.dev/reference/react/memo)
- [Optimizing performance in React](https://react.dev/learn/render-and-commit)
