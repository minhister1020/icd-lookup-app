# Phase 7A: Click-to-Expand Mind Map Nodes

## Overview

Transform the mind map from showing all nodes at once to a **progressive disclosure** model where users click ICD nodes to reveal their connected drugs and trials.

## Progress: 100% 🟩🟩🟩🟩 (4/4 steps)

---

## Current State

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CURRENT: All nodes visible at once                   │
│                                                                         │
│    [ICD-1]────[ICD-2]────[ICD-3]────[ICD-4]────[ICD-5]                  │
│       │          │          │          │          │                     │
│    [Drug1]    [Drug2]    [Drug3]    [Drug4]    [Drug5]                  │
│    [Drug2]    [Trial1]   [Trial2]   [Trial3]   [Trial4]                 │
│    [Trial1]                                                             │
│                                                                         │
│    Problem: Too many nodes, overwhelming, hard to focus                 │
└─────────────────────────────────────────────────────────────────────────┘
```

## Target State

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    TARGET: Progressive disclosure                       │
│                                                                         │
│    [ICD-1]    [ICD-2]    [ICD-3 ⊖]    [ICD-4]    [ICD-5]               │
│     +5 ▾       +3 ▾          │         +2 ▾       +4 ▾                  │
│                              │                                          │
│                    ┌─────────┴─────────┐                                │
│                    │                   │                                │
│                [Drug1]             [Trial1]                             │
│                [Drug2]             [Trial2]                             │
│                                                                         │
│    Benefit: Clean view, user controls what they see                     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Add Expansion State to MindMapView 🟩

**Status:** COMPLETE

**File:** `app/components/MindMapView.tsx`

**Tasks:**
1. Add `expandedNodes` state using `useState<Set<string>>`
2. Create `toggleExpand(code: string)` callback function
3. Create `expandAll()` and `collapseAll()` helper functions
4. Pass expansion state to `convertToNodesAndEdges()` function
5. Update node data to include expansion info

**Code Changes:**

```typescript
// Add to MindMapView component
const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

// Toggle single node
const toggleExpand = useCallback((code: string) => {
  setExpandedNodes(prev => {
    const next = new Set(prev);
    if (next.has(code)) {
      next.delete(code);
    } else {
      next.add(code);
    }
    return next;
  });
}, []);

// Expand all ICD codes
const expandAll = useCallback(() => {
  const allCodes = results.map(r => r.code);
  setExpandedNodes(new Set(allCodes));
}, [results]);

// Collapse all
const collapseAll = useCallback(() => {
  setExpandedNodes(new Set());
}, []);
```

**New Interface for IcdNodeData:**

```typescript
// Update in types/icd.ts
interface IcdNodeData {
  code: string;
  name: string;
  category?: string;
  // NEW: Expansion state
  isExpanded: boolean;
  childrenCount: {
    drugs: number;
    trials: number;
    loaded: boolean; // Whether drugs/trials have been fetched
  };
  onToggleExpand: (code: string) => void;
}
```

**Success Criteria:**
- [ ] `expandedNodes` state tracks which codes are expanded
- [ ] `toggleExpand` adds/removes codes from set
- [ ] `expandAll` expands all current ICD codes
- [ ] `collapseAll` clears all expansions
- [ ] State persists during search

---

### Step 2: Update IcdNode with Expand Button 🟩

**Status:** COMPLETE

**File:** `app/components/IcdNode.tsx`

**Tasks:**
1. Add expand/collapse button below the node
2. Show children count badge when collapsed
3. Change button icon based on state (⊕ collapsed, ⊖ expanded)
4. Add click handler to call `onToggleExpand`
5. Style button with animations

**Visual Design:**

```
┌───────────────────────┐
│        E11.9          │  ← Main node (unchanged)
│   Type 2 diabetes     │
└───────────────────────┘
          │
     ┌────┴────┐
     │   ⊕    │  ← Expand button (when collapsed)
     │ +3 💊  │     Shows: "+3 drugs, +2 trials"
     │ +2 🧪  │
     └────────┘
     
     OR when expanded:
     
     ┌────┴────┐
     │   ⊖    │  ← Collapse button (when expanded)
     └────────┘
          │
     ┌────┴────┐
   [Drug1]  [Trial1]
```

**Code Changes:**

```typescript
// IcdNode.tsx - Add expand button below node
function IcdNode({ data, selected }: NodeProps<IcdNodeData>) {
  const { isExpanded, childrenCount, onToggleExpand, code } = data;
  const totalChildren = childrenCount.drugs + childrenCount.trials;
  
  return (
    <div className="relative">
      {/* Existing node content */}
      <div className="...">
        {/* ... existing code ... */}
      </div>
      
      {/* Expand/Collapse Button */}
      {totalChildren > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand(code);
          }}
          className={`
            absolute -bottom-8 left-1/2 -translate-x-1/2
            px-2 py-1 rounded-lg
            ${isExpanded 
              ? 'bg-gray-200 dark:bg-gray-700' 
              : 'bg-blue-100 dark:bg-blue-900/30'
            }
            text-xs font-medium
            transition-all duration-200
            hover:scale-105
          `}
        >
          {isExpanded ? (
            <span className="flex items-center gap-1">
              <span>⊖</span>
              <span className="text-gray-500">Collapse</span>
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <span>⊕</span>
              <span>+{childrenCount.drugs}💊</span>
              <span>+{childrenCount.trials}🧪</span>
            </span>
          )}
        </button>
      )}
      
      {/* No children message */}
      {totalChildren === 0 && !childrenCount.loaded && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-gray-400">
          Click "View Drugs" in list
        </div>
      )}
      
      {/* Bottom handle for edges */}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
```

**Success Criteria:**
- [ ] Expand button appears below ICD nodes
- [ ] Shows ⊕ and count when collapsed
- [ ] Shows ⊖ when expanded
- [ ] Clicking button triggers expansion
- [ ] Smooth hover animations
- [ ] Shows "Load data first" if no drugs/trials loaded

---

### Step 3: Filter Nodes Based on Expansion 🟩

**Status:** COMPLETE

**File:** `app/components/MindMapView.tsx`

**Tasks:**
1. Update `convertToNodesAndEdges()` to accept `expandedNodes` Set
2. Only create drug/trial nodes when parent ICD is expanded
3. Only create edges to children when parent is expanded
4. Update stats to show potential vs visible counts
5. Add smooth animation for appearing/disappearing nodes

**Code Changes:**

```typescript
// Update function signature
function convertToNodesAndEdges(
  results: ICD10Result[],
  drugsMap: Map<string, DrugResult[]>,
  trialsMap: Map<string, ClinicalTrialResult[]>,
  expandedNodes: Set<string>,  // NEW parameter
  toggleExpand: (code: string) => void  // NEW: callback for button
): { nodes, edges, stats } {
  
  results.forEach((result, index) => {
    const drugs = drugsMap.get(result.code) || [];
    const trials = trialsMap.get(result.code) || [];
    const isExpanded = expandedNodes.has(result.code);
    
    // Always add ICD node with expansion data
    nodes.push({
      id: result.code,
      type: 'icdNode',
      position: { x, y },
      data: {
        code: result.code,
        name: result.name,
        category,
        // NEW expansion data
        isExpanded,
        childrenCount: {
          drugs: drugs.length,
          trials: trials.length,
          loaded: drugsMap.has(result.code) || trialsMap.has(result.code),
        },
        onToggleExpand: toggleExpand,
      },
    });
    
    // Only add children if this node is expanded
    if (isExpanded) {
      // Add drug nodes
      drugs.forEach((drug, drugIndex) => {
        nodes.push({ ... });
        edges.push({ ... });
      });
      
      // Add trial nodes
      trials.forEach((trial, trialIndex) => {
        nodes.push({ ... });
        edges.push({ ... });
      });
    }
  });
}
```

**Animation Considerations:**

```typescript
// Nodes that appear/disappear should animate
// React Flow handles this with key-based rendering
// But we can add CSS classes:

// In IcdNode, DrugNode, TrialNode:
className="animate-in fade-in zoom-in-50 duration-300"

// For disappearing, React Flow removes the node
// which triggers its exit animation
```

**Success Criteria:**
- [ ] Drug/trial nodes only appear for expanded ICD codes
- [ ] Edges only exist for expanded parents
- [ ] Stats show "5 visible / 25 total" counts
- [ ] Nodes animate in when expanding
- [ ] Nodes animate out when collapsing
- [ ] No orphan edges or nodes

---

### Step 4: Add Expand All / Collapse All Controls 🟩

**Status:** COMPLETE

**File:** `app/components/MindMapView.tsx`

**Tasks:**
1. Add control buttons to the Panel component
2. "Expand All" button expands all ICD codes
3. "Collapse All" button collapses all
4. Show current state indicator (e.g., "3/5 expanded")
5. Style buttons to match existing controls

**UI Design:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │  [⊕ Expand All]  [⊖ Collapse All]  │  3/5 expanded             │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│                        (Mind Map Content)                               │
│                                                                         │
│   ┌──────┐                                                              │
│   │ Mini │                                                              │
│   │ Map  │                                                              │
│   └──────┘  [+] [-] [⟲]                                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

**Code Changes:**

```typescript
// In MindMapView component, update the Panel
<Panel 
  position="top-left" 
  className="bg-white/90 dark:bg-gray-800/90 rounded-xl px-4 py-2 shadow-lg border border-gray-200 dark:border-gray-700"
>
  <div className="flex items-center gap-3">
    {/* Expand All Button */}
    <button
      onClick={expandAll}
      disabled={expandedNodes.size === results.length}
      className="
        flex items-center gap-1.5 px-3 py-1.5
        rounded-lg text-sm font-medium
        bg-blue-50 hover:bg-blue-100
        dark:bg-blue-900/30 dark:hover:bg-blue-900/50
        text-blue-600 dark:text-blue-400
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors
      "
    >
      <span>⊕</span>
      <span>Expand All</span>
    </button>
    
    {/* Collapse All Button */}
    <button
      onClick={collapseAll}
      disabled={expandedNodes.size === 0}
      className="
        flex items-center gap-1.5 px-3 py-1.5
        rounded-lg text-sm font-medium
        bg-gray-100 hover:bg-gray-200
        dark:bg-gray-700 dark:hover:bg-gray-600
        text-gray-600 dark:text-gray-400
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors
      "
    >
      <span>⊖</span>
      <span>Collapse All</span>
    </button>
    
    {/* Status Indicator */}
    <div className="text-xs text-gray-500 dark:text-gray-400 border-l pl-3 ml-1">
      {expandedNodes.size}/{results.length} expanded
    </div>
  </div>
</Panel>
```

**Updated Stats Panel:**

```typescript
// Update the bottom stats panel
<Panel position="bottom-left" className="...">
  <div className="space-y-1">
    <div className="text-xs text-gray-500">
      {stats.icdCount} ICD codes • {expandedNodes.size} expanded
    </div>
    <div className="text-xs text-gray-400">
      Visible: {visibleDrugCount} drugs, {visibleTrialCount} trials
    </div>
    <div className="text-xs text-gray-400">
      Total loaded: {stats.drugCount} drugs, {stats.trialCount} trials
    </div>
  </div>
</Panel>
```

**Success Criteria:**
- [ ] "Expand All" button expands all ICD codes
- [ ] "Collapse All" button collapses all
- [ ] Buttons are disabled when already at that state
- [ ] Status shows "X/Y expanded"
- [ ] Stats show visible vs total counts
- [ ] Buttons match existing UI style

---

## Edge Cases & Handling

| Edge Case | Handling |
|-----------|----------|
| ICD with no drugs/trials | Hide expand button, show "No data" hint |
| Drugs not loaded yet | Show "Load drugs first" hint |
| Expand when zoomed out | Auto-zoom to fit new nodes? |
| 25+ nodes all expanded | Performance may degrade → show warning |
| Collapse while dragging | Cancel drag, then collapse |
| Switch to list view | Preserve expansion state |
| New search | Reset all expansions |

---

## Type Updates Required

**File:** `app/types/icd.ts`

```typescript
// Update IcdNodeData interface
export interface IcdNodeData {
  /** The ICD-10 code (e.g., "E11.9") */
  code: string;
  
  /** The condition name */
  name: string;
  
  /** Code category for coloring */
  category?: string;
  
  /** Phase 7A: Whether this node's children are visible */
  isExpanded: boolean;
  
  /** Phase 7A: Count of children (even if not visible) */
  childrenCount: {
    drugs: number;
    trials: number;
    loaded: boolean; // Whether data has been fetched
  };
  
  /** Phase 7A: Callback to toggle expansion */
  onToggleExpand: (code: string) => void;
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `app/types/icd.ts` | Update `IcdNodeData` interface |
| `app/components/MindMapView.tsx` | Add expansion state, update layout function |
| `app/components/IcdNode.tsx` | Add expand button and children count badge |
| `app/components/DrugNode.tsx` | Add animation classes (optional) |
| `app/components/TrialNode.tsx` | Add animation classes (optional) |

---

## Testing Checklist

After implementation:

- [ ] Click ICD expand button → shows drugs/trials
- [ ] Click again → hides drugs/trials
- [ ] Badge shows correct count when collapsed
- [ ] "Expand All" → all ICD nodes expand
- [ ] "Collapse All" → all ICD nodes collapse
- [ ] Status shows "X/Y expanded"
- [ ] Smooth animations during expand/collapse
- [ ] No orphan nodes or edges
- [ ] Performance OK with 25 nodes
- [ ] List view still works
- [ ] New search resets expansion state
- [ ] Drugs/trials still load when clicking in list view

---

## Command to Start

Say `/execute` to begin Phase 7A implementation (Steps 1-4).

---

## Estimated Effort

| Step | Complexity | Est. Time |
|------|------------|-----------|
| Step 1: State management | Medium | 15 min |
| Step 2: IcdNode button | Medium | 20 min |
| Step 3: Filter logic | Medium | 15 min |
| Step 4: Control buttons | Low | 10 min |
| **Total** | **Medium** | **~1 hour** |

---

## Future Enhancements (Phase 7B+)

After completing 7A:
- Hover highlighting (dim unrelated nodes)
- Focus mode (click to spotlight)
- Multiple layout algorithms
- Animated layout transitions
- Performance optimizations for large graphs
