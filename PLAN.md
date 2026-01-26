# ICD-10 Search Feature - Implementation Plan

## Overall Progress: 100% (8/8 steps completed) ✅

---

## Phase 1: ICD Mind Map Lookup Tool - Search Interface

**Goal:** Build a search component that connects to ClinicalTables API to fetch real ICD-10 medical condition data.

---

### Step 1: Create TypeScript Types 🟩
**Purpose:** Define the shape of ICD-10 data for type safety and autocomplete.

- 🟩 1.1 Create `app/types/` directory
- 🟩 1.2 Create `app/types/icd.ts` with:
  - `ICD10Result` interface (code, name)
  - `SearchResponse` type (raw API format)
  - `SearchState` interface (loading, error, results)

---

### Step 2: Create API Helper Function 🟩
**Purpose:** Handle ClinicalTables API calls and parse the response format.

- 🟩 2.1 Create `app/lib/` directory
- 🟩 2.2 Create `app/lib/api.ts` with:
  - `searchICD10()` function
  - API URL: `https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search`
  - Parameters: `?sf=code,name&terms=[query]`
  - Parse response format: `[count, codes[], null, names[][]]`
  - Error handling for network failures

---

### Step 3: Add HealthVerity Colors to Tailwind 🟩
**Purpose:** Configure brand colors for consistent styling.

- 🟩 3.1 Update `app/globals.css` with CSS variables:
  - Primary green: `#00D084`
  - Secondary green: `#00A66C`
  - Light green: `#E6FBF3` (backgrounds)
  - Dark green: `#007A4D` (text)
- 🟩 3.2 Add Tailwind theme extension for these colors
- 🟩 3.3 Add dark mode color adjustments

---

### Step 4: Create ResultCard Component 🟩
**Purpose:** Display a single ICD-10 result (code + condition name).

- 🟩 4.1 Create `app/components/` directory
- 🟩 4.2 Create `app/components/ResultCard.tsx` with:
  - Props: `code`, `name`
  - Display ICD code prominently (green, monospace font)
  - Display condition name
  - Clean card styling with hover effects

---

### Step 5: Create SearchResults Component 🟩
**Purpose:** Container that handles all result states (loading, error, empty, results).

- 🟩 5.1 Create `app/components/SearchResults.tsx` with:
  - Loading state (animated spinner)
  - Error state (red error message)
  - Empty state ("No results found" with tips)
  - Initial state (welcome message)
  - Results state (responsive grid of ResultCards)
- 🟩 5.2 Import and use ResultCard component

---

### Step 6: Create SearchBar Component 🟩
**Purpose:** Search input field and button for user interaction.

- 🟩 6.1 Create `app/components/SearchBar.tsx` with:
  - Text input field with focus states
  - Placeholder: "Search for conditions (e.g., diabetes, E11.9)"
  - Search button with HealthVerity green styling
  - Props: `onSearch` callback, `isLoading` state
- 🟩 6.2 Handle Enter key to submit search (via form)
- 🟩 6.3 Disable button while loading (with spinner)
- 🟩 6.4 Helper tip text below input

---

### Step 7: Update Home Page 🟩
**Purpose:** Integrate all components and manage search state.

- 🟩 7.1 Update `app/page.tsx`:
  - Add `"use client"` directive (needed for hooks)
  - Import all components (SearchBar, SearchResults)
  - Import API helper (searchICD10) and types (ICD10Result)
  - Add `useState` for results, isLoading, error, hasSearched
  - Create async `handleSearch()` function with try/catch/finally
  - Render SearchBar and SearchResults components
- 🟩 7.2 Clean up template content (removed Next.js boilerplate)
- 🟩 7.3 Keep "Bobby's ICD Mind Map Tool" title
- 🟩 7.4 Add header, footer, and professional layout

---

### Step 8: Update Layout Metadata 🟩
**Purpose:** Set proper page title and description.

- 🟩 8.1 Update `app/layout.tsx` metadata:
  - Title: "Bobby's ICD Mind Map Tool"
  - Description: "Search and explore ICD-10 medical condition codes..."
- 🟩 8.2 Added comments explaining metadata usage

---

## Files to Create

| File | Status |
|------|--------|
| `app/types/icd.ts` | 🟩 |
| `app/lib/api.ts` | 🟩 |
| `app/components/ResultCard.tsx` | 🟩 |
| `app/components/SearchResults.tsx` | 🟩 |
| `app/components/SearchBar.tsx` | 🟩 |

## Files to Modify

| File | Status |
|------|--------|
| `app/globals.css` | 🟩 |
| `app/page.tsx` | 🟩 |
| `app/layout.tsx` | 🟩 |

---

## Dependencies Required

✅ None - all dependencies already installed:
- Next.js 16 with App Router
- React 19 (useState, useEffect)
- TypeScript 5
- Tailwind CSS v4
- Built-in fetch API

---

## API Reference

**Endpoint:** `https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search`

**Parameters:**
- `sf=code,name` (fields to return)
- `terms=[query]` (search term)

**Example Request:**
```
https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search?sf=code,name&terms=diabetes
```

**Response Format:**
```json
[
  14,                           // total count
  ["E10", "E10.1", ...],       // ICD codes array
  null,                         // (unused)
  [["Diabetes 1"], ["Diabetes 2"], ...]  // names array
]
```

---

## Notes

- All components will use TypeScript for type safety
- Client-side rendering (React hooks) for interactive search
- Responsive design using Tailwind CSS
- Error handling for network failures
- No external state management (React hooks only)

---
---

# Phase 2: Mind Map Visualization

## Overall Progress: 100% (12/12 steps completed) ✅

---

## Goal

Transform the search results from a card grid into an interactive mind map visualization using React Flow. Users can toggle between "List View" (current cards) and "Mind Map View" (interactive nodes).

---

## Phase 2A: Install and Setup 🟩

### Step 1: Install React Flow 🟩
**Purpose:** Add the React Flow library for node-based graph visualization.

- 🟩 1.1 Run `npm install @xyflow/react` (installed v12.10.0)
- 🟩 1.2 Verify installation in `package.json`
- 🟩 1.3 Import React Flow CSS in `globals.css`

---

### Step 2: Add View Mode Types 🟩
**Purpose:** Define TypeScript types for the view toggle feature.

- 🟩 2.1 Update `app/types/icd.ts` with:
  - `ViewMode` type: `'list' | 'mindmap'`
  - `IcdNodeData` interface for React Flow node data
  - `NodePosition` interface for node positioning

---

## Phase 2B: Create Components 🟩

### Step 3: Create ViewToggle Component 🟩
**Purpose:** Toggle button to switch between List and Mind Map views.

- 🟩 3.1 Create `app/components/ViewToggle.tsx`
- 🟩 3.2 Props: `currentView`, `onViewChange`, `disabled`
- 🟩 3.3 Two buttons with icons (LayoutGrid, Network from lucide-react)
- 🟩 3.4 Active state styling with HealthVerity green
- 🟩 3.5 Smooth transition animation between states
- 🟩 3.6 ARIA attributes for accessibility

---

### Step 4: Create Custom IcdNode Component 🟩
**Purpose:** Custom-styled node for displaying ICD codes in the mind map.

- 🟩 4.1 Create `app/components/IcdNode.tsx`
- 🟩 4.2 Design matches ResultCard styling:
  - Code badge (green background)
  - Condition name below
  - Rounded corners, shadows
- 🟩 4.3 Handle props from React Flow (`data` object with IcdNodeData)
- 🟩 4.4 Add hover effects and selected state styling
- 🟩 4.5 Support dark mode styling
- 🟩 4.6 Add Handle components for future edge connections
- 🟩 4.7 Memoized with memo() for performance

---

### Step 5: Create MindMapView Component 🟩
**Purpose:** Main React Flow canvas that displays ICD codes as nodes.

- 🟩 5.1 Create `app/components/MindMapView.tsx`
- 🟩 5.2 Accept `results: ICD10Result[]` as prop
- 🟩 5.3 Convert results to React Flow nodes:
  - Each result → one node
  - Calculate positions (3-column grid layout)
  - Apply custom `icdNode` type
  - Extract category from code
- 🟩 5.4 Configure React Flow:
  - Enable zoom and pan
  - Add dot background pattern
  - Add MiniMap for navigation
  - Add Controls (zoom buttons)
  - FitView on load
- 🟩 5.5 Handle empty state (no results message)
- 🟩 5.6 Wrap in 600px height container with styling

---

## Phase 2C: Wire Everything Together 🟩

### Step 6: Add View Mode State to Page 🟩
**Purpose:** Manage which view is currently active.

- 🟩 6.1 Update `app/page.tsx`:
  - Add `viewMode` state: `useState<ViewMode>('list')`
  - Add `handleViewModeChange` handler
- 🟩 6.2 Load view preference from localStorage on mount
- 🟩 6.3 Save view preference to localStorage on change
- 🟩 6.4 Updated status badge to "Phase 2 - Mind Map"

---

### Step 7: Update SearchResults Component 🟩
**Purpose:** Conditionally render List or Mind Map view.

- 🟩 7.1 Update `app/components/SearchResults.tsx`:
  - Accept new prop: `viewMode`
  - Accept new prop: `onViewModeChange`
- 🟩 7.2 Add ViewToggle to results header (next to count badge)
- 🟩 7.3 Conditional rendering:
  - `viewMode === 'list'` → Show card grid
  - `viewMode === 'mindmap'` → Show MindMapView
- 🟩 7.4 Responsive header layout (stacks on mobile)

---

### Step 8: Connect Components in Page 🟩
**Purpose:** Pass all props and wire up the view toggle.

- 🟩 8.1 Import ViewMode type from types/icd.ts
- 🟩 8.2 Pass `viewMode` to SearchResults
- 🟩 8.3 Pass `onViewModeChange` to SearchResults
- 🟩 8.4 View toggle now functional!

---

## Phase 2D: Polish and Test 🟩

### Step 9: Improve Node Styling 🟩
**Purpose:** Make nodes more compact and mind-map-like.

- 🟩 9.1 Reduced node size (180px width, p-3 padding)
- 🟩 9.2 Inline code badge with gradient background
- 🟩 9.3 2-line text truncation with title tooltip
- 🟩 9.4 Subtle glow effect on hover
- 🟩 9.5 Hidden handles that appear on hover
- 🟩 9.6 Added left/right handles for horizontal connections

---

### Step 10: Add Better Layout Algorithm 🟩
**Purpose:** Position nodes in organized clusters.

- 🟩 10.1 Radial/clustered layout algorithm
- 🟩 10.2 Group nodes by ICD category (E codes, F codes, etc.)
- 🟩 10.3 Categories positioned in circle around center
- 🟩 10.4 Nodes within category form smaller clusters
- 🟩 10.5 Automatic repositioning on new search

---

### Step 11: Add Edges Between Related Nodes 🟩
**Purpose:** Show relationships between ICD codes.

- 🟩 11.1 Edges connecting nodes in same category
- 🟩 11.2 Smooth step (curved) edge type
- 🟩 11.3 HealthVerity green color with low opacity
- 🟩 11.4 Arrow markers on edges
- 🟩 11.5 Circular connections for category loops

---

### Step 12: Visual Polish 🟩
**Purpose:** Professional, polished appearance.

- 🟩 12.1 Zoom level indicator (top-right panel)
- 🟩 12.2 Category legend with color coding
- 🟩 12.3 MiniMap with category-based coloring
- 🟩 12.4 Help text at bottom ("Drag to rearrange...")
- 🟩 12.5 Gradient background on canvas
- 🟩 12.6 Improved empty state design
- 🟩 12.7 Backdrop blur on all panels

---

## Files to Create (Phase 2)

| File | Purpose | Status |
|------|---------|--------|
| `app/components/ViewToggle.tsx` | Toggle between List/Mind Map | 🟩 |
| `app/components/IcdNode.tsx` | Custom node for React Flow | 🟩 |
| `app/components/MindMapView.tsx` | React Flow canvas component | 🟩 |
| `app/lib/layout.ts` | Node positioning helper | ⏭️ Integrated into MindMapView |

## Files to Modify (Phase 2)

| File | Changes | Status |
|------|---------|--------|
| `package.json` | Add @xyflow/react dependency | 🟩 |
| `app/globals.css` | Import React Flow styles | 🟩 |
| `app/types/icd.ts` | Add ViewMode and node types | 🟩 |
| `app/page.tsx` | Add viewMode state | 🟩 |
| `app/components/SearchResults.tsx` | Add view toggle + conditional render | 🟩 |

---

## New Dependency

| Package | Version | Purpose | Status |
|---------|---------|---------|--------|
| `@xyflow/react` | 12.10.0 | Node-based graph visualization | 🟩 Installed |

---

## React Flow Concepts Reference

### Node Structure
```typescript
{
  id: 'E11.9',                    // Unique identifier
  type: 'icdNode',                // Custom node type
  position: { x: 100, y: 200 },   // Canvas position
  data: {                         // Custom data
    code: 'E11.9',
    name: 'Type 2 diabetes...'
  }
}
```

### Edge Structure (for future)
```typescript
{
  id: 'e1-2',        // Unique identifier
  source: 'E11',     // Start node ID
  target: 'E11.9',   // End node ID
  animated: true     // Optional animation
}
```

---

## Success Criteria

- [x] User can toggle between List and Mind Map views
- [x] Mind Map displays all search results as draggable nodes
- [x] Zoom and pan work smoothly
- [x] View preference persists across page refreshes
- [x] Dark mode works correctly
- [x] Mobile-responsive design
- [x] No console errors or warnings

---
---

# Phase 3: Multi-API Integration

## Overall Progress: 33% (4/12 steps completed) 🟨

---

## Goal

Expand the ICD Mind Map tool into a comprehensive medical reference by integrating OpenFDA (drug information) and ClinicalTrials.gov (clinical studies) APIs. Users can click on any ICD code to discover related drugs and active clinical trials.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Flow                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Search "diabetes"                                           │
│           ↓                                                      │
│  2. ICD-10 Results displayed (existing)                         │
│           ↓                                                      │
│  3. User clicks [💊 Drugs] or [🔬 Trials] button                │
│           ↓                                                      │
│  4. On-demand API call with condition name                      │
│           ↓                                                      │
│  5. Expanded section shows drugs/trials                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Reference

### OpenFDA Drug Labels API
- **Endpoint:** `https://api.fda.gov/drug/label.json`
- **Search field:** `indications_and_usage:[condition]`
- **Rate limit:** 240/min, 1,000/day (without key)
- **Auth:** None required (API key optional for higher limits)

### ClinicalTrials.gov API v2
- **Endpoint:** `https://clinicaltrials.gov/api/v2/studies`
- **Search param:** `query.cond=[condition]`
- **Filter:** `filter.overallStatus=RECRUITING`
- **Rate limit:** ~3 requests/second
- **Auth:** None required

---

## Phase 3A: OpenFDA Drug Integration 🟩 COMPLETE

### Step 1: Add Drug Types 🟩
**Purpose:** Define TypeScript interfaces for drug data.

- 🟩 1.1 Update `app/types/icd.ts` with:
  - `DrugResult` interface:
    - `brandName: string`
    - `genericName: string`
    - `manufacturer: string`
    - `indication: string` (truncated usage description)
    - `warnings?: string` (optional safety info)
  - `DrugLoadingState` interface for loading/error states
  - `extractSearchTerms()` helper function

---

### Step 2: Create OpenFDA API Helper 🟩
**Purpose:** Function to search drugs by condition name.

- 🟩 2.1 Create `app/lib/openFdaApi.ts`
- 🟩 2.2 Implement `searchDrugsByCondition()` function:
  - Accept condition name and optional limit (default 5)
  - Build URL: `https://api.fda.gov/drug/label.json?search=indications_and_usage:[term]&limit=[n]`
  - Parse response and extract:
    - `openfda.brand_name[0]`
    - `openfda.generic_name[0]`
    - `openfda.manufacturer_name[0]`
    - `indications_and_usage[0]` (first 200 chars)
  - Handle 404 (no results) gracefully
  - Handle rate limit errors (429) with user-friendly message
- 🟩 2.3 `extractSearchTerms()` helper in types/icd.ts:
  - Remove stop words from condition name
  - Extract 2-4 key medical terms
  - Example: "Type 2 diabetes mellitus without complications" → "diabetes"
- 🟩 2.4 Helper functions: `formatDrugName()`, `formatManufacturer()`, `truncateText()`

---

### Step 3: Create DrugCard Component 🟩
**Purpose:** Display a single drug result with key information.

- 🟩 3.1 Create `app/components/DrugCard.tsx`
- 🟩 3.2 Props: `drug: DrugResult`
- 🟩 3.3 Design:
  - Blue color scheme (#3B82F6 - distinct from ICD green)
  - 💊 Pill icon indicator
  - Brand name (bold, hover effect)
  - Generic name (smaller, gray)
  - Manufacturer with building icon
  - Expandable indication with "Read more" button
- 🟩 3.4 Hover effects matching ResultCard style
- 🟩 3.5 Dark mode support
- 🟩 3.6 Optional warnings section (shows when expanded)

---

### Step 4: Add Drug Expansion to ResultCard 🟩
**Purpose:** Allow users to load drugs for any ICD code.

- 🟩 4.1 Update `app/components/ResultCard.tsx`:
  - Local state management: `drugs`, `drugsLoading`, `drugsError`
  - `hasFetchedDrugs` for caching
  - `drugsExpanded` for toggle
- 🟩 4.2 Add [💊 View Drugs] button:
  - Blue styling to differentiate from ICD
  - Loading spinner while fetching
  - Count badge showing number of drugs found
  - Toggle between "View Drugs" / "Hide Drugs"
- 🟩 4.3 Create expandable section below card:
  - Slides open with animation
  - Grid of DrugCards
  - Error message if API fails (red theme)
  - "No drugs found" with helpful message
- 🟩 4.4 State management:
  - Track expanded/collapsed per card
  - Cache loaded drugs locally (don't re-fetch)
- 🟩 4.5 Rate limit handling:
  - Button disabled during loading
  - Show warning if rate limited

---

## Phase 3B: ClinicalTrials.gov Integration 🟥

### Step 5: Add Trial Types 🟥
**Purpose:** Define TypeScript interfaces for clinical trial data.

- 🟥 5.1 Update `app/types/icd.ts` with:
  - `TrialLocation` interface:
    - `facility: string`
    - `city: string`
    - `state: string`
    - `country: string`
  - `ClinicalTrialResult` interface:
    - `nctId: string` (unique trial ID like "NCT05642013")
    - `title: string`
    - `status: 'RECRUITING' | 'ACTIVE' | 'COMPLETED' | 'TERMINATED' | 'OTHER'`
    - `summary: string`
    - `sponsor: string`
    - `eligibility?: string`
    - `locations?: TrialLocation[]`
    - `startDate?: string`
  - `TrialSearchState` interface

---

### Step 6: Create ClinicalTrials API Helper 🟥
**Purpose:** Function to search trials by condition name.

- 🟥 6.1 Create `app/lib/clinicalTrialsApi.ts`
- 🟥 6.2 Implement `searchTrialsByCondition()` function:
  - Accept condition name and options (status filter, limit)
  - Build URL: `https://clinicaltrials.gov/api/v2/studies?query.cond=[term]&filter.overallStatus=RECRUITING&pageSize=[n]`
  - Parse nested response structure:
    - `protocolSection.identificationModule.nctId`
    - `protocolSection.identificationModule.briefTitle`
    - `protocolSection.statusModule.overallStatus`
    - `protocolSection.descriptionModule.briefSummary`
    - `protocolSection.contactsLocationsModule.locations`
  - Handle empty results
  - Add retry logic for transient failures
- 🟥 6.3 Implement `getTrialStatusColor()` helper:
  - RECRUITING → green
  - ACTIVE → blue
  - COMPLETED → gray
  - TERMINATED → red
- 🟥 6.4 Export types and functions

---

### Step 7: Create TrialCard Component 🟥
**Purpose:** Display a single clinical trial result.

- 🟥 7.1 Create `app/components/TrialCard.tsx`
- 🟥 7.2 Props: `trial: ClinicalTrialResult`
- 🟥 7.3 Design:
  - Purple color scheme (distinct from ICD green and drug blue)
  - 🔬 Icon indicator
  - NCT ID badge (clickable link to ClinicalTrials.gov)
  - Trial title
  - Status badge with color coding
  - Sponsor name
  - Location count ("3 locations")
- 🟥 7.4 Expandable details:
  - Full summary
  - Eligibility criteria
  - Location list
- 🟥 7.5 Link to full trial: `https://clinicaltrials.gov/study/[nctId]`
- 🟥 7.6 Dark mode support

---

### Step 8: Add Trial Expansion to ResultCard 🟥
**Purpose:** Allow users to load trials for any ICD code.

- 🟥 8.1 Update `app/components/ResultCard.tsx`:
  - Add `onLoadTrials?: () => void` prop
  - Add `trials?: ClinicalTrialResult[]` prop
  - Add `trialsLoading?: boolean` prop
  - Add `trialsError?: string` prop
- 🟥 8.2 Add [🔬 View Trials] button:
  - Purple styling
  - Next to drugs button
  - Loading state
- 🟥 8.3 Create expandable section:
  - Below drugs section (or tabbed interface)
  - Grid of TrialCards
  - Filter by status (show RECRUITING first)
- 🟥 8.4 Combine with drugs in unified expansion UI:
  - Tabs: [Drugs] [Clinical Trials]
  - OR: Stacked sections with headers
- 🟥 8.5 Empty state: "No active trials found for this condition"

---

## Phase 3C: Mind Map Multi-Node Visualization 🟥

### Step 9: Create DrugNode Component 🟥
**Purpose:** Custom React Flow node for drugs.

- 🟥 9.1 Create `app/components/DrugNode.tsx`
- 🟥 9.2 Design: Blue bubble style (matches DrugCard theme)
  - 💊 Icon in node
  - Brand name displayed
  - Generic name on hover
- 🟥 9.3 Smaller than ICD nodes (secondary information)
- 🟥 9.4 Connection handles for edges
- 🟥 9.5 Memoized with memo()

---

### Step 10: Create TrialNode Component 🟥
**Purpose:** Custom React Flow node for clinical trials.

- 🟥 10.1 Create `app/components/TrialNode.tsx`
- 🟥 10.2 Design: Purple bubble style
  - 🔬 Icon in node
  - NCT ID displayed
  - Trial title on hover
- 🟥 10.3 Status indicator (colored dot)
- 🟥 10.4 Clickable to open trial page
- 🟥 10.5 Memoized with memo()

---

### Step 11: Update MindMapView for Multi-Node Types 🟥
**Purpose:** Support ICD, Drug, and Trial nodes in the same canvas.

- 🟥 11.1 Update `app/components/MindMapView.tsx`:
  - Register new node types: `drugNode`, `trialNode`
  - Accept optional `drugs` and `trials` props
- 🟥 11.2 Layout algorithm for multiple node types:
  - ICD nodes in center (green, largest)
  - Drug nodes in ring around relevant ICD (blue)
  - Trial nodes in outer ring (purple)
- 🟥 11.3 Edges:
  - ICD → Drug edges (blue, dashed)
  - ICD → Trial edges (purple, dashed)
  - Same-category ICD edges (green, solid) - existing
- 🟥 11.4 Legend update:
  - 🟢 ICD Codes
  - 🔵 Drugs
  - 🟣 Clinical Trials
- 🟥 11.5 Load drugs/trials on-demand:
  - Click ICD node → show "Load related data" option
  - Fetch APIs → add new nodes dynamically
  - Animate node additions

---

### Step 12: State Management for Multi-API Data 🟥
**Purpose:** Track drugs and trials data per ICD code.

- 🟥 12.1 Update `app/page.tsx`:
  - Add `drugsMap: Map<string, DrugResult[]>` state
  - Add `trialsMap: Map<string, ClinicalTrialResult[]>` state
  - Add `loadingMap: Map<string, { drugs: boolean; trials: boolean }>` state
- 🟥 12.2 Implement `handleLoadDrugs(icdCode, conditionName)`:
  - Check cache first
  - Call OpenFDA API
  - Update drugsMap
  - Handle errors per-code
- 🟥 12.3 Implement `handleLoadTrials(icdCode, conditionName)`:
  - Check cache first
  - Call ClinicalTrials API
  - Update trialsMap
  - Handle errors per-code
- 🟥 12.4 Pass handlers and data to SearchResults
- 🟥 12.5 Performance: Debounce rapid clicks

---

## Files to Create (Phase 3)

| File | Purpose | Phase | Status |
|------|---------|-------|--------|
| `app/lib/openFdaApi.ts` | OpenFDA API functions | 3A | 🟩 |
| `app/lib/clinicalTrialsApi.ts` | ClinicalTrials API functions | 3B | 🟥 |
| `app/components/DrugCard.tsx` | Drug result card | 3A | 🟩 |
| `app/components/TrialCard.tsx` | Clinical trial card | 3B | 🟥 |
| `app/components/DrugNode.tsx` | Drug node for mind map | 3C | 🟥 |
| `app/components/TrialNode.tsx` | Trial node for mind map | 3C | 🟥 |

## Files to Modify (Phase 3)

| File | Changes | Phase | Status |
|------|---------|-------|--------|
| `app/types/icd.ts` | Added DrugResult, DrugLoadingState, extractSearchTerms() | 3A | 🟩 |
| `app/components/ResultCard.tsx` | Added drug expansion with View Drugs button | 3A | 🟩 |
| `app/types/icd.ts` | Add Drug/Trial types | 3A/3B | 🟥 |
| `app/components/ResultCard.tsx` | Add expansion buttons | 3A/3B | 🟥 |
| `app/components/SearchResults.tsx` | Pass drug/trial data | 3A/3B | 🟥 |
| `app/components/MindMapView.tsx` | Multi-node support | 3C | 🟥 |
| `app/page.tsx` | State management | 3C | 🟥 |

---

## Dependencies Required

| Package | Version | Purpose | Status |
|---------|---------|---------|--------|
| (none) | - | All features use built-in fetch API | ✅ |

---

## API Integration Notes

### Data Connection Strategy

```javascript
// ICD Result example:
{ code: "E11.9", name: "Type 2 diabetes mellitus without complications" }

// Extract search term:
"Type 2 diabetes mellitus without complications"
  → remove: "without", "complications", "mellitus"
  → result: "type 2 diabetes"

// Use for OpenFDA:
`search=indications_and_usage:type+2+diabetes`

// Use for ClinicalTrials:
`query.cond=type+2+diabetes`
```

### Error Handling Strategy

```javascript
// Each API call is independent - failures don't block others
try {
  const drugs = await searchDrugsByCondition(term);
  setDrugsMap(prev => new Map(prev).set(icdCode, drugs));
} catch (error) {
  // Show error ONLY for drugs section, trials still work
  setErrorsMap(prev => new Map(prev).set(`${icdCode}-drugs`, error.message));
}
```

### Rate Limit Prevention

1. **On-demand loading** - Only fetch when user clicks
2. **Caching** - Store results in Map, don't re-fetch
3. **Debouncing** - 500ms delay between requests
4. **Graceful degradation** - Show cached data if rate limited

---

## Success Criteria

- [ ] User can click any ICD result to load related drugs
- [ ] User can click any ICD result to load clinical trials
- [ ] Drug results show brand name, generic name, indication
- [ ] Trial results show NCT ID, status, sponsor
- [ ] Clicking NCT ID opens trial on ClinicalTrials.gov
- [ ] Mind map shows drugs as blue nodes
- [ ] Mind map shows trials as purple nodes
- [ ] Edges connect ICD codes to their drugs/trials
- [ ] Loading states for each expansion
- [ ] Error states don't break other functionality
- [ ] Cached results don't re-fetch
- [ ] Works in both light and dark mode
- [ ] Mobile-responsive expansion UI
