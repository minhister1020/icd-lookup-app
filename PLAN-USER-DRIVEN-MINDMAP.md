# User-Driven Mind Map - Execution Plan

## Overview

Transform the mind map from auto-populated (all search results) to user-driven (manually add specific ICD codes).

**Goal**: Give users control over what appears in the mind map, reducing clutter and enabling focused analysis across multiple searches.

---

## Progress Tracker

| Phase | Description | Status | Progress |
|-------|-------------|--------|----------|
| Phase A | State Management Setup | 🟩 Complete | 100% |
| Phase B | List View UI (Add Button) | 🟩 Complete | 100% |
| Phase C | Mind Map UI (Empty State + Remove) | 🟥 Not Started | 0% |
| Phase D | Drug Integration | 🟥 Not Started | 0% |
| Phase E | Polish & Edge Cases | 🟥 Not Started | 0% |

**Overall Progress: 40%** 🟩🟩🟩🟩░░░░░░

---

## Phase A: State Management Setup 🟩 COMPLETE

**Goal**: Add new state and handlers in `page.tsx` for tracking user-selected mind map codes.

### Tasks

| # | Task | File | Status |
|---|------|------|--------|
| A1 | Create `MindMapCode` interface | `app/types/icd.ts` | 🟩 |
| A2 | Add `mindMapCodes` state (Map<string, MindMapCode>) | `app/page.tsx` | 🟩 |
| A3 | Create `addToMindMap(code, name)` handler | `app/page.tsx` | 🟩 |
| A4 | Create `removeFromMindMap(code)` handler | `app/page.tsx` | 🟩 |
| A5 | Create `isInMindMap(code)` helper | `app/page.tsx` | 🟩 |
| A6 | Add `MIND_MAP_LIMIT = 25` constant | `app/page.tsx` | 🟩 |

### Implementation Details

**A1: MindMapCode Interface** (`app/types/icd.ts`)
```typescript
export interface MindMapCode {
  code: string;
  name: string;
  addedAt: string;  // ISO timestamp for ordering
}
```

**A2-A6: State in page.tsx**
```typescript
// Constants
const MIND_MAP_LIMIT = 25;

// State
const [mindMapCodes, setMindMapCodes] = useState<Map<string, MindMapCode>>(new Map());

// Handlers
const addToMindMap = useCallback((code: string, name: string) => {
  if (mindMapCodes.size >= MIND_MAP_LIMIT) {
    // Show limit message (Phase E)
    return false;
  }
  if (mindMapCodes.has(code)) {
    // Already exists - will handle highlight in Phase C
    return 'exists';
  }
  setMindMapCodes(prev => {
    const next = new Map(prev);
    next.set(code, { code, name, addedAt: new Date().toISOString() });
    return next;
  });
  return true;
}, [mindMapCodes]);

const removeFromMindMap = useCallback((code: string) => {
  setMindMapCodes(prev => {
    const next = new Map(prev);
    next.delete(code);
    return next;
  });
  // Also clean up drugsMap entry for this code
  setDrugsMap(prev => {
    const next = new Map(prev);
    next.delete(code);
    return next;
  });
}, []);

const isInMindMap = useCallback((code: string): boolean => {
  return mindMapCodes.has(code);
}, [mindMapCodes]);
```

### Acceptance Criteria
- [ ] `mindMapCodes` state exists and is a Map
- [ ] `addToMindMap` respects 25 code limit
- [ ] `addToMindMap` returns status ('exists' | true | false)
- [ ] `removeFromMindMap` also cleans up drugsMap
- [ ] No TypeScript errors

---

## Phase B: List View UI (Add Button) 🟩 COMPLETE

**Goal**: Add "+" button to ResultCard, show badge in view toggle area.

### Tasks

| # | Task | File | Status |
|---|------|------|--------|
| B1 | Add `isInMindMap` and `onAddToMindMap` props to ResultCard | `app/components/ResultCard.tsx` | 🟩 |
| B2 | Add "+" button UI to ResultCard | `app/components/ResultCard.tsx` | 🟩 |
| B3 | Style button: green when available, gray when in map | `app/components/ResultCard.tsx` | 🟩 |
| B4 | Pass new props through SearchResults | `app/components/SearchResults.tsx` | 🟩 |
| B5 | Add "X codes in map" badge near ViewToggle | `app/components/SearchResults.tsx` | 🟩 |
| B6 | Wire up handlers from page.tsx | `app/page.tsx` | 🟩 |

### Implementation Details

**B1-B3: ResultCard Changes**

New props:
```typescript
interface ResultCardProps {
  // ... existing props
  isInMindMap: boolean;
  onAddToMindMap: (code: string, name: string) => void;
}
```

Button UI (add near the top-right of card):
```tsx
<button
  onClick={() => onAddToMindMap(code, name)}
  disabled={isInMindMap}
  className={`
    p-2 rounded-lg transition-all
    ${isInMindMap 
      ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
      : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 hover:bg-emerald-200'
    }
  `}
  title={isInMindMap ? 'Already in mind map' : 'Add to mind map'}
>
  {isInMindMap ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
</button>
```

**B5: Badge in SearchResults**

Near the ViewToggle:
```tsx
{mindMapCount > 0 && (
  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
    <Network className="w-4 h-4" />
    <span>{mindMapCount} in map</span>
  </div>
)}
```

### Acceptance Criteria
- [ ] "+" button visible on each ResultCard
- [ ] Button shows checkmark when code is in map
- [ ] Button is disabled/grayed when code is in map
- [ ] Badge shows count when > 0 codes in map
- [ ] Clicking "+" does NOT switch to mind map view
- [ ] No UI flicker on state updates

---

## Phase C: Mind Map UI (Empty State + Remove) 🟥

**Goal**: Mind map renders only user-selected codes, shows empty state, has remove buttons.

### Tasks

| # | Task | File | Status |
|---|------|------|--------|
| C1 | Change MindMapView to receive `mindMapCodes` instead of `results` | `app/components/MindMapView.tsx` | 🟥 |
| C2 | Create empty state component | `app/components/MindMapView.tsx` | 🟥 |
| C3 | Update node generation to use mindMapCodes | `app/components/MindMapView.tsx` | 🟥 |
| C4 | Add `onRemove` prop to IcdNode | `app/components/IcdNode.tsx` | 🟥 |
| C5 | Add "X" button UI to IcdNode | `app/components/IcdNode.tsx` | 🟥 |
| C6 | Wire up removal handler | `app/components/MindMapView.tsx` | 🟥 |
| C7 | Update SearchResults to pass mindMapCodes | `app/components/SearchResults.tsx` | 🟥 |

### Implementation Details

**C1: MindMapView Props Change**

Before:
```typescript
interface MindMapViewProps {
  results: ScoredICD10Result[];
  // ...
}
```

After:
```typescript
interface MindMapViewProps {
  mindMapCodes: Map<string, MindMapCode>;
  onRemoveCode: (code: string) => void;
  // ...
}
```

**C2: Empty State Component**
```tsx
function EmptyMindMap() {
  return (
    <div className="flex flex-col items-center justify-center h-[600px] text-center">
      <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <Network className="w-10 h-10 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Your Mind Map is Empty
      </h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mb-4">
        Search for ICD codes and click the <Plus className="inline w-4 h-4" /> button 
        to add them to your mind map for visual exploration.
      </p>
      <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
        <ArrowLeft className="w-4 h-4" />
        <span>Switch to List view to add codes</span>
      </div>
    </div>
  );
}
```

**C3: Update Node Generation**

Change from iterating `results` to iterating `mindMapCodes`:
```typescript
// Convert mindMapCodes to array for layout
const icdCodes = Array.from(mindMapCodes.values());

// Create ICD nodes
icdCodes.forEach((item, index) => {
  nodes.push({
    id: item.code,
    type: 'icdNode',
    position: calculatePosition(index, icdCodes.length),
    data: {
      code: item.code,
      name: item.name,
      onRemove: () => onRemoveCode(item.code),
      // ... other data
    }
  });
});
```

**C4-C5: IcdNode X Button**
```tsx
// In IcdNode.tsx
<button
  onClick={(e) => {
    e.stopPropagation();
    data.onRemove?.();
  }}
  className="absolute -top-2 -right-2 p-1 rounded-full bg-red-100 dark:bg-red-900/50 text-red-500 hover:bg-red-200 opacity-0 group-hover:opacity-100 transition-opacity"
  title="Remove from mind map"
>
  <X className="w-3 h-3" />
</button>
```

### Acceptance Criteria
- [ ] Empty state shows when no codes in map
- [ ] Only mindMapCodes appear as nodes (not all search results)
- [ ] X button appears on hover over ICD nodes
- [ ] Clicking X removes the node and its drug children
- [ ] Removal is smooth (no jarring re-layout)

---

## Phase D: Drug Integration 🟥

**Goal**: When ICD code is added to map, fetch drugs if not cached. Show drugs as collapsed by default.

### Tasks

| # | Task | File | Status |
|---|------|------|--------|
| D1 | Auto-fetch drugs when code added (if not in drugsMap) | `app/page.tsx` | 🟥 |
| D2 | Ensure drugsMap is shared between list and map views | `app/page.tsx` | 🟥 |
| D3 | Drugs appear collapsed by default in mind map | `app/components/MindMapView.tsx` | 🟥 |
| D4 | Preserve expand/collapse state per code | `app/components/MindMapView.tsx` | 🟥 |

### Implementation Details

**D1: Auto-fetch on Add**

Modify `addToMindMap`:
```typescript
const addToMindMap = useCallback(async (code: string, name: string) => {
  // ... existing limit/duplicate checks
  
  // Add to map
  setMindMapCodes(prev => {
    const next = new Map(prev);
    next.set(code, { code, name, addedAt: new Date().toISOString() });
    return next;
  });
  
  // Fetch drugs if not already cached
  if (!drugsMap.has(code)) {
    try {
      const drugs = await searchDrugsByCondition(name);
      setDrugsMap(prev => {
        const next = new Map(prev);
        next.set(code, drugs);
        return next;
      });
    } catch (err) {
      console.error('Failed to fetch drugs for', code, err);
      // Non-blocking - code is still added to map
    }
  }
  
  return true;
}, [mindMapCodes, drugsMap]);
```

**D3-D4: Collapsed by Default**

In MindMapView, change `expandedNodes` initial behavior:
```typescript
// Nodes start collapsed
// User must explicitly expand to see drugs
const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

// Don't auto-expand when new codes added
// Keep expansion state stable across re-renders
```

### Acceptance Criteria
- [ ] Drugs auto-fetch when code added to map
- [ ] If drugs already fetched (from list view), reuse cached data
- [ ] Drugs appear collapsed by default
- [ ] User can expand to see drugs
- [ ] Expand state persists while navigating views

---

## Phase E: Polish & Edge Cases 🟥

**Goal**: Handle edge cases, add visual feedback, ensure smooth UX.

### Tasks

| # | Task | File | Status |
|---|------|------|--------|
| E1 | Show toast when limit (25) reached | `app/page.tsx` | 🟥 |
| E2 | Highlight existing node when duplicate add attempted | `app/components/MindMapView.tsx` | 🟥 |
| E3 | Add loading indicator during drug fetch | `app/components/IcdNode.tsx` | 🟥 |
| E4 | Smooth animation when nodes added/removed | `app/components/MindMapView.tsx` | 🟥 |
| E5 | Clear map button (optional) | `app/components/MindMapView.tsx` | 🟥 |
| E6 | Test all edge cases | - | 🟥 |

### Implementation Details

**E1: Limit Toast**
```tsx
// Simple inline message (no external toast library needed)
const [limitMessage, setLimitMessage] = useState<string | null>(null);

const addToMindMap = useCallback((code: string, name: string) => {
  if (mindMapCodes.size >= MIND_MAP_LIMIT) {
    setLimitMessage(`Mind map limit reached (${MIND_MAP_LIMIT} codes max)`);
    setTimeout(() => setLimitMessage(null), 3000);
    return false;
  }
  // ...
}, []);
```

**E2: Highlight Existing Node**
```typescript
// In MindMapView
const [highlightedCode, setHighlightedCode] = useState<string | null>(null);

// When duplicate detected, set highlightedCode
// Use CSS animation to pulse the node
// Clear after 2 seconds
```

**E5: Clear Map Button**
```tsx
<button
  onClick={onClearMap}
  className="text-red-500 hover:text-red-600 text-sm"
>
  Clear all ({mindMapCodes.size})
</button>
```

### Edge Cases to Test
- [ ] Add code from search A, then search B, then add from B
- [ ] Remove code, then re-add it
- [ ] Expand drugs, switch views, switch back
- [ ] Rapid clicking add/remove
- [ ] Add 25th code, try to add 26th
- [ ] Add duplicate (should highlight, not add)

### Acceptance Criteria
- [ ] Friendly message when limit reached
- [ ] Existing nodes highlight on duplicate attempt
- [ ] Loading state while fetching drugs
- [ ] Clear map button works (if implemented)
- [ ] All edge cases handled gracefully

---

## File Change Summary

| File | Changes |
|------|---------|
| `app/types/icd.ts` | Add `MindMapCode` interface |
| `app/page.tsx` | Add state, handlers, wire props |
| `app/components/ResultCard.tsx` | Add "+" button, props |
| `app/components/SearchResults.tsx` | Pass props, add badge |
| `app/components/MindMapView.tsx` | Major refactor: use mindMapCodes, empty state |
| `app/components/IcdNode.tsx` | Add "X" button, onRemove prop |

---

## Execution Order

```
Phase A (State Setup)
    │
    ▼
Phase B (List View "+" Button)
    │
    ▼
Phase C (Mind Map Empty State + "X" Button)
    │
    ▼
Phase D (Drug Integration)
    │
    ▼
Phase E (Polish)
```

Each phase should be independently testable. Complete one before starting the next.

---

## Commands

| Command | Action |
|---------|--------|
| `/execute Phase A` | Start state management setup |
| `/execute Phase B` | Start list view UI |
| `/execute Phase C` | Start mind map UI |
| `/execute Phase D` | Start drug integration |
| `/execute Phase E` | Start polish |
| `/review` | Review current implementation |

---

*Last Updated: January 2026*
*Status: Planning Complete, Ready for Execution*
