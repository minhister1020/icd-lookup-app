# Scroll Flashing Bug Prevention Guide

Based on the fix for result card flashing during scroll on large lists (87+ cards), this document provides prevention strategies, code review checklists, and testing recommendations.

---

## 1. Prevention Strategies

### 1.1 When to Use React.memo

React.memo prevents unnecessary re-renders by doing a shallow comparison of props. Use it when:

**DO use React.memo when:**

| Scenario | Example |
|----------|---------|
| Component renders in a list of 20+ items | `ResultCard` in search results grid |
| Component has expensive render logic | Cards with multiple nested sections, calculations |
| Parent re-renders frequently but child props are stable | List items when sibling state changes |
| Component receives callbacks wrapped in useCallback | `onToggleFavorite`, `onDrugsLoaded` |
| Component receives primitive props or memoized objects | `code`, `name`, `score`, `rank` |

**DO NOT use React.memo when:**

| Scenario | Reason |
|----------|--------|
| Component always receives new props | Memo comparison overhead with no benefit |
| Component is rendered only once | No re-render to prevent |
| Component is very simple (< 10 lines JSX) | Render cost is negligible |
| Props include non-memoized inline objects/functions | Shallow comparison will always fail |

**Implementation Pattern:**

```tsx
// Before - function declaration
export default function ResultCard({ code, name, ...props }: ResultCardProps) {
  return <div>...</div>;
}

// After - memo with named function expression
import { memo } from 'react';

const ResultCard = memo(function ResultCard({ code, name, ...props }: ResultCardProps) {
  return <div>...</div>;
});

export default ResultCard;
```

**Why named function expression?**
- Preserves component name in React DevTools
- Enables function hoisting awareness
- Clearer stack traces during debugging

---

### 1.2 Animation Best Practices for Lists

#### Problem: Animations Replay on Re-render

CSS animations (like `animate-in fade-in slide-in-from-bottom-2`) replay every time a component re-renders, causing visual flashing.

#### Solution 1: Track Mounted State with useRef

```tsx
const hasMounted = useRef(false);

useEffect(() => {
  hasMounted.current = true;
}, []);

// Only apply animation classes on initial mount
<div className={`card ${!hasMounted.current ? 'animate-in fade-in' : ''}`}>
```

#### Solution 2: Track Animated Items in Parent (for lists)

```tsx
// In parent component (e.g., SearchResults)
const animatedResultsRef = useRef<Set<string>>(new Set());

useEffect(() => {
  // Mark all current results as animated after first render
  results.forEach(r => animatedResultsRef.current.add(r.code));
}, [results]);

const shouldAnimate = useCallback((code: string): boolean => {
  return !animatedResultsRef.current.has(code);
}, []);

// In render
{results.map((result) => {
  const animate = shouldAnimate(result.code);
  return (
    <div
      key={result.code}
      className={animate ? "animate-in fade-in" : ""}
    >
      <ResultCard {...result} />
    </div>
  );
})}
```

#### Animation Guidelines Table

| Scenario | Strategy | Implementation |
|----------|----------|----------------|
| Initial page load | Staggered animation | `animationDelay: ${index * 50}ms` |
| Load More adds items | Animate only new items | Track animated IDs in Set |
| Scroll causes re-render | No animation | Check `hasMounted.current` |
| View mode toggle | Optional animation | Acceptable to re-animate on view change |
| Filter/sort results | No animation | Items are repositioned, not new |

---

### 1.3 CSS Transition Optimization Guidelines

#### Problem: `transition-all` is Expensive

`transition-all` forces the browser to check and potentially animate every CSS property, including:
- Properties that never change
- Properties with expensive repaints (width, height, top, left)
- Properties that trigger layout recalculation

#### Solution: Specify Exact Properties

```css
/* Before - expensive */
.card {
  @apply transition-all duration-300;
}

/* After - optimized */
.card {
  @apply transition-[transform,box-shadow,border-color] duration-300;
}
```

#### CSS Transition Performance Tiers

| Tier | Properties | Performance |
|------|------------|-------------|
| Best (compositor only) | `transform`, `opacity` | No repaint, GPU-accelerated |
| Good (repaint only) | `background-color`, `box-shadow`, `border-color`, `color` | Repaint, no layout |
| Avoid (layout) | `width`, `height`, `padding`, `margin`, `top`, `left` | Layout + repaint |
| Never | `all` | Checks every property |

#### Recommended Transition Combinations

```css
/* Hover effects (cards, buttons) */
.interactive-card {
  @apply transition-[transform,box-shadow,border-color] duration-300 ease-out;
}

/* Expand/collapse */
.collapsible {
  @apply transition-[max-height,opacity] duration-200 ease-in-out;
}

/* Color state changes */
.status-indicator {
  @apply transition-colors duration-150;
}

/* Visibility toggles */
.fade-element {
  @apply transition-opacity duration-200;
}
```

---

## 2. Code Review Checklist

### 2.1 Memoization Requirements

When reviewing list components, check:

- [ ] **Card components are wrapped with `React.memo`**
  ```tsx
  // Look for this pattern
  const Card = memo(function Card(props) { ... });
  export default Card;
  ```

- [ ] **Parent callbacks are wrapped with `useCallback`**
  ```tsx
  // In SearchResults or parent
  const handleToggleFavorite = useCallback((result) => {
    // handler logic
  }, [dependencies]);
  ```

- [ ] **Computed values use `useMemo`**
  ```tsx
  // For expensive computations
  const favoritesMap = useMemo(() =>
    new Map(favorites.map(f => [f.code, f])),
    [favorites]
  );
  ```

- [ ] **No inline objects in props**
  ```tsx
  // BAD - creates new object every render
  <Card style={{ margin: 10 }} />

  // GOOD - stable reference
  const cardStyle = useMemo(() => ({ margin: 10 }), []);
  <Card style={cardStyle} />
  ```

- [ ] **No inline arrow functions for frequently-updating callbacks**
  ```tsx
  // Acceptable for rarely-called callbacks
  onToggleFavorite={() => onToggleFavorite(result)}

  // For high-frequency callbacks, use stable reference
  const handleToggle = useCallback(() => onToggleFavorite(result), [result, onToggleFavorite]);
  ```

---

### 2.2 Key Prop Stability

- [ ] **Keys are unique and stable**
  ```tsx
  // GOOD - unique identifier from data
  key={result.code}
  key={trial.nctId}

  // BAD - array index (causes issues with reordering)
  key={index}

  // ACCEPTABLE - index with stable prefix when order doesn't change
  key={`${brandName}-${index}`}
  ```

- [ ] **Composite keys for nested items without unique IDs**
  ```tsx
  // BAD
  {locations.map((loc, index) => (
    <li key={index}>...</li>
  ))}

  // GOOD - composite key from unique fields
  {locations.map((loc) => (
    <li key={`${loc.facility}-${loc.city}-${loc.state}`}>...</li>
  ))}
  ```

- [ ] **Keys are not generated during render**
  ```tsx
  // BAD - new key every render
  key={Math.random()}
  key={Date.now()}
  key={crypto.randomUUID()}
  ```

---

### 2.3 Animation Handling

- [ ] **Animations only play on mount, not re-render**
  ```tsx
  // Check for hasMounted pattern
  const hasMounted = useRef(false);
  useEffect(() => { hasMounted.current = true; }, []);
  className={!hasMounted.current ? 'animate-in' : ''}
  ```

- [ ] **List animations track animated items**
  ```tsx
  // Check for Set tracking pattern
  const animatedResultsRef = useRef<Set<string>>(new Set());
  ```

- [ ] **No `transition-all` on list items**
  ```tsx
  // Search for this antipattern
  className="transition-all"

  // Should be specific properties
  className="transition-[transform,box-shadow]"
  ```

- [ ] **Animation delays are capped**
  ```tsx
  // GOOD - caps delay to prevent excessive stagger
  animationDelay: `${Math.min(index, 10) * 50}ms`

  // BAD - unbounded delay
  animationDelay: `${index * 50}ms`  // 100 items = 5 second delay!
  ```

---

## 3. Testing Recommendations

### 3.1 Manual Testing Steps

#### Primary Scroll Test
1. Navigate to search page
2. Search for a term that returns 80+ results (e.g., "musculoskeletal", "chapter")
3. Wait for all cards to load
4. Scroll rapidly up and down for 10 seconds
5. **Expected:** No white flashing, cards remain stable
6. **Failure indicator:** Cards disappear/reappear, white flash between cards

#### State Preservation During Scroll
1. Load 100+ results
2. Expand the drug section on card #30
3. Scroll to card #80
4. Toggle favorite on card #80
5. Scroll back to card #30
6. **Expected:** Card #30's drug section is still expanded
7. **Failure indicator:** Drug section collapsed, requires re-expansion

#### Load More Animation Test
1. Load initial 25 results
2. Expand trials on card #10
3. Click "Load More"
4. **Expected:**
   - Existing 25 cards do NOT re-animate
   - New cards DO animate (fade in from bottom)
   - Card #10's trials remain expanded
5. **Failure indicator:** All cards re-animate, expanded state lost

#### View Mode Persistence
1. Load results in Flat view
2. Expand drugs on several cards
3. Note which cards are expanded
4. Switch to Grouped view, then back to Flat view
5. **Expected:** View toggles work, functionality intact
6. **Note:** Expansion state resetting is acceptable on view switch

---

### 3.2 React DevTools Profiler Usage

#### Setup
1. Install React DevTools browser extension
2. Open DevTools > Profiler tab
3. Enable "Record why each component rendered" in settings

#### Recording a Scroll Session
1. Click "Start profiling" (blue circle)
2. Scroll through the result list for 5-10 seconds
3. Click "Stop profiling"

#### Analyzing Results

**Check render counts:**
1. Select the recorded session
2. Switch to "Ranked" view
3. Look for `ResultCard` components

**Expected behavior:**
| Action | ResultCard Renders |
|--------|-------------------|
| Initial load | Once per card |
| Scroll (no state change) | 0 renders |
| Toggle favorite on card A | Only card A re-renders |
| Load More | Only new cards render |

**Warning signs:**
- All cards re-render when toggling one favorite
- Cards re-render on scroll without prop changes
- Same card renders 3+ times in quick succession

#### Identifying Render Causes
1. Click on a component that rendered unexpectedly
2. Check "Why did this render?" panel
3. Common causes to fix:
   - "Props changed: (onSomeCallback)" - Need useCallback
   - "Props changed: (style)" - Need useMemo for style object
   - "Parent component rendered" - Need React.memo on child

---

### 3.3 What Metrics to Look For

#### Performance Metrics Table

| Metric | Good | Warning | Critical |
|--------|------|---------|----------|
| Scroll FPS | 60 fps | 30-59 fps | < 30 fps |
| Render time per card | < 5ms | 5-16ms | > 16ms |
| Total renders on scroll | 0 | 1-5 | > 5 |
| Time to interactive | < 100ms | 100-300ms | > 300ms |

#### How to Measure

**Scroll FPS:**
1. Open Chrome DevTools > Performance
2. Check "Screenshots" and enable FPS meter
3. Record while scrolling
4. Check FPS graph - should stay near 60

**Render Time:**
1. React DevTools Profiler
2. Hover over component bars
3. Check "Render duration"

**Total Renders:**
1. Add temporary logging:
   ```tsx
   const renderCount = useRef(0);
   console.log(`ResultCard ${code} render #${++renderCount.current}`);
   ```
2. Scroll and check console
3. Remove logging after testing

#### Browser Testing Matrix

| Browser | Priority | Notes |
|---------|----------|-------|
| Chrome | Primary | Most common, best DevTools |
| Firefox | High | Different rendering engine |
| Edge | Medium | Chromium-based, usually matches Chrome |
| Safari | Low | Test if Mac users are significant |

---

## Quick Reference Card

### Memoization Decision Tree

```
Is component rendered in a list?
├── Yes (20+ items) → USE React.memo
└── No
    ├── Does parent re-render frequently? → USE React.memo
    └── Is render expensive (> 5ms)? → USE React.memo
        └── Otherwise → SKIP (not worth overhead)
```

### Animation Checklist

```
□ hasMounted ref pattern for mount-only animations
□ Set<string> tracking for list item animations
□ Animation delays capped (Math.min(index, 10))
□ No transition-all on list items
□ Specific transition properties only
```

### Code Smells to Watch

```
❌ transition-all on list items
❌ key={index} on dynamic lists
❌ Inline () => handler(item) without useCallback
❌ Animation classes without mount check
❌ style={{ ... }} inline objects
```

---

## Related Documentation

- [React.memo documentation](https://react.dev/reference/react/memo)
- [useCallback documentation](https://react.dev/reference/react/useCallback)
- [Optimizing Performance](https://react.dev/learn/render-and-commit)
- [CSS Triggers (what causes layout/paint)](https://csstriggers.com/)

## Implementation Reference

The original fix was implemented in commit `0780146`:
- `app/components/ResultCard.tsx` - React.memo + hasMounted ref + transition optimization
- `app/components/DrugCard.tsx` - React.memo wrapper
- `app/components/TrialCard.tsx` - React.memo wrapper + composite key fix
- `app/components/CategorySection.tsx` - React.memo wrapper
- `app/components/SearchResults.tsx` - Animation tracking with Set + shouldAnimate callback
