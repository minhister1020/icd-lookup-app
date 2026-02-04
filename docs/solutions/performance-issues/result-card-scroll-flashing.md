---
title: Result Card Flashing and Disappearing During Scroll on Large Result Sets
category: performance-issues
tags:
  - react-performance
  - re-render-optimization
  - animation-flickering
  - memo-pattern
  - css-transitions
  - large-datasets
  - scroll-performance
  - ui-stability
module: components/SearchResults
components_affected:
  - ResultCard
  - DrugCard
  - TrialCard
  - CategorySection
  - SearchResults
severity: high
status: resolved
date_solved: 2026-02-04
commit: 0780146

symptoms:
  - Cards flash white and disappear when scrolling through large result sets
  - Issue prominent with 87+ cards (e.g., Musculoskeletal chapter)
  - Visual artifacts and flickering behavior
  - Cards briefly become invisible then reappear during scroll
  - Animation replayed on every re-render causing performance degradation
---

# Result Card Scroll Flashing Fix

## Problem

ICD-10 result cards flash white and disappear/reappear when scrolling through large result sets (87+ cards like Musculoskeletal chapter). This creates a jarring user experience with visual artifacts during normal scrolling.

## Symptoms

- Cards flash white then reappear during scroll
- Only occurs on large result sets (87+ cards)
- Reproducible in all browsers (Chrome, Firefox, Edge)
- Random occurrence during scroll interactions
- CSS animations replay on every re-render

## Root Cause

The issue stemmed from four compounding factors:

1. **No React.memo on card components** - ResultCard (986 lines), DrugCard (231 lines), TrialCard (323 lines), CategorySection were not memoized, causing full re-renders on parent updates

2. **CSS animations replay on re-render** - Classes like `animate-in fade-in slide-in-from-bottom-2` run on every render, not just initial mount

3. **Inline callbacks create new references** - Some inline arrow functions in props broke shallow equality checks

4. **Heavy components with internal state** - ResultCard alone has 14 internal state variables for drugs, trials, loading states

### The Render Cascade (Before Fix)

```
User scrolls → Browser scroll event
    ↓
SearchResults re-renders
    ↓
All CategorySections re-render (no memoization)
    ↓
All ResultCards re-render (no memoization)
    ↓
CSS transitions replay on all visible cards
    ↓
White flash visible as cards "re-enter" with animations
```

## Solution

### 1. Wrap Card Components with React.memo()

**Pattern used:**
```tsx
// Before
export default function ResultCard({...}: ResultCardProps) {
  // component code
}

// After
const ResultCard = memo(function ResultCard({...}: ResultCardProps) {
  // component code
});

export default ResultCard;
```

**Applied to:**
- `ResultCard.tsx` - Primary card component
- `DrugCard.tsx` - Nested drug display
- `TrialCard.tsx` - Nested trial display
- `CategorySection.tsx` - Category accordion wrapper

### 2. Prevent Animation Replay with hasMounted Ref

```tsx
// In ResultCard.tsx
const hasMounted = useRef(false);

useEffect(() => {
  // Set mounted flag after initial render to prevent animation replay
  hasMounted.current = true;
}, []);
```

### 3. Track Animated Results in SearchResults

```tsx
// Track result codes that have already been animated
const animatedResultsRef = useRef<Set<string>>(new Set());

useEffect(() => {
  if (hasMounted.current) {
    // Mark all current results as animated so they don't re-animate
    results.forEach(r => animatedResultsRef.current.add(r.code));
  } else {
    // First render - all results should animate initially
    animatedResultsRef.current = new Set(results.map(r => r.code));
  }
}, [results]);

// Determines if a result should animate (only if it hasn't been seen before)
const shouldAnimate = useCallback((code: string): boolean => {
  return !animatedResultsRef.current.has(code);
}, []);
```

### 4. Conditional Animation in Rendering

```tsx
{results.map((result, index) => {
  const animate = shouldAnimate(result.code);
  return (
    <div
      key={result.code}
      className={animate ? "animate-in fade-in slide-in-from-bottom-2" : ""}
      style={animate ? {
        animationDelay: `${Math.min(index, 10) * 50}ms`,
        animationFillMode: 'backwards'
      } : undefined}
    >
      <ResultCard ... />
    </div>
  );
})}
```

### 5. Optimize CSS Transitions

```tsx
// Before
transition-all duration-300

// After - only transition properties that actually change
transition-[transform,box-shadow,border-color] duration-300
```

### 6. Fix TrialCard Location Key

```tsx
// Before - unstable index key
{trial.locations.map((loc, index) => (
  <li key={index}>

// After - stable composite key
{trial.locations.map((loc) => (
  <li key={`${loc.facility}-${loc.city}-${loc.state}`}>
```

## Files Modified

| File | Changes |
|------|---------|
| `app/components/ResultCard.tsx` | Added React.memo, hasMounted ref, optimized transitions |
| `app/components/DrugCard.tsx` | Added React.memo |
| `app/components/TrialCard.tsx` | Added React.memo, fixed location key |
| `app/components/CategorySection.tsx` | Added React.memo |
| `app/components/SearchResults.tsx` | Added animation tracking with shouldAnimate |

## Prevention Strategies

### When to Use React.memo

**Use React.memo when:**
- Component renders in lists (20+ items)
- Component has expensive render logic
- Parent re-renders frequently but props are stable
- Component receives memoized callbacks (useCallback)

**Skip React.memo when:**
- Component is simple/cheap to render
- Props change on every render anyway
- Component renders only once or rarely

### Animation Best Practices for Lists

1. **Track mounted state** - Use `hasMounted` ref to distinguish initial render
2. **Track animated items** - Use `Set<string>` to track which items have animated
3. **Cap animation delays** - Use `Math.min(index, 10) * delay` to prevent long waits
4. **Apply animations conditionally** - Only animate new items

### CSS Transition Guidelines

```tsx
// Bad - transitions ALL properties (expensive)
transition-all duration-300

// Good - only transition what changes
transition-[transform,box-shadow,border-color] duration-300

// Best performance (compositor-only properties)
transition-[transform,opacity] duration-300
```

## Testing Checklist

- [ ] Search "musculoskeletal" to get 87+ results
- [ ] Scroll rapidly up and down - verify no white flashing
- [ ] Expand drugs on card #30, scroll away, scroll back - verify expansion preserved
- [ ] Click "Load More" - verify new cards animate, existing cards don't
- [ ] Toggle favorites - verify only affected card re-renders (use React DevTools Profiler)
- [ ] Switch between Flat and Grouped views - verify smooth transitions

## React DevTools Profiler Usage

1. Open React DevTools → Profiler tab
2. Click Record, perform scroll action, click Stop
3. Check "Highlight updates when components render"
4. Look for:
   - Render count per card (should be 1 after initial load)
   - Render duration (should be <5ms per card)
   - What triggered renders (should be props change, not parent)

## Related Documentation

- [React.memo documentation](https://react.dev/reference/react/memo)
- [Optimizing performance in React](https://react.dev/learn/render-and-commit)
- Plan: `docs/plans/2026-02-04-fix-result-card-scroll-flashing-plan.md`

## Future Considerations

If performance issues persist with 200+ cards, consider:
- **Virtualization** with `@tanstack/react-virtual` or `react-window`
- Note: Virtualization unmounts off-screen cards, losing internal state
- Would need to lift drug/trial state to parent and restore on remount
