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
