# Phase 5: Common Terms Translation

## Overview
Add a "common terms mapper" that translates everyday language into medical terminology, dramatically improving search success for non-medical users.

**Problem Solved:**
- "heart attack" → 0 results ❌ → Now shows myocardial infarction codes ✅
- "stroke" → 0 results ❌ → Now shows cerebrovascular codes ✅
- "broken bone" → 0 results ❌ → Now shows fracture codes ✅

---

## Progress: 0% Complete

| Phase | Steps | Status |
|-------|-------|--------|
| 5A: Core Infrastructure | 1-3 | 🟥 To Do |
| 5B: API Integration | 4-5 | 🟥 To Do |
| 5C: UI Enhancement | 6-8 | 🟥 To Do |
| 5D: Testing & Docs | 9-10 | 🟥 To Do |

---

## Phase 5A: Core Infrastructure (Steps 1-3)

### Step 1: Create Term Mappings Data
🟥 **To Do**

**File:** `app/lib/termMappings.ts`

Create curated mappings of 80+ common lay terms to medical terminology:

```typescript
// Structure of each mapping
interface TermMapping {
  medical: string;           // Primary medical term to search
  alternatives?: string[];   // Other valid medical terms
  icdHint?: string;         // ICD code family hint (for scoring boost)
  bidirectional?: boolean;  // Also map medical → lay term in UI?
}

// Example mappings by category:
// CARDIOVASCULAR (15+ terms)
// - "heart attack" → "myocardial infarction"
// - "stroke" → "cerebral infarction" 
// - "high blood pressure" → "hypertension"
// - "irregular heartbeat" → "atrial fibrillation"
// - "chest pain" → "angina pectoris"

// RESPIRATORY (12+ terms)
// - "flu" → "influenza"
// - "common cold" → "nasopharyngitis"
// - "bronchitis" → "acute bronchitis"

// GASTROINTESTINAL (10+ terms)
// - "heartburn" → "gastroesophageal reflux"
// - "stomach ulcer" → "peptic ulcer"

// MENTAL HEALTH (8+ terms)
// - "depression" (already works, but add synonyms)
// - "anxiety attack" → "panic disorder"

// MUSCULOSKELETAL (12+ terms)
// - "broken bone" → "fracture"
// - "slipped disc" → "intervertebral disc disorder"

// ... 80+ total mappings
```

**Substeps:**
- [ ] Create file with TypeScript interface
- [ ] Add 15+ cardiovascular term mappings
- [ ] Add 12+ respiratory term mappings
- [ ] Add 10+ gastrointestinal term mappings
- [ ] Add 8+ mental health term mappings
- [ ] Add 12+ musculoskeletal term mappings
- [ ] Add 10+ neurological term mappings
- [ ] Add 8+ skin/infection term mappings
- [ ] Add 5+ other common term mappings
- [ ] Export Map for O(1) lookup performance
- [ ] Add helpful comments explaining data sources

---

### Step 2: Create Term Mapper Logic
🟥 **To Do**

**File:** `app/lib/termMapper.ts`

Implement translation function with smart matching:

```typescript
/**
 * Translates user's search query to medical terminology.
 * 
 * Features:
 * - Exact match lookup (O(1) with Map)
 * - Case-insensitive matching
 * - Returns both original and translated terms
 * - Handles edge cases (already medical, no match)
 * 
 * @example
 * translateQuery("heart attack")
 * // Returns: {
 * //   searchTerms: ["myocardial infarction", "heart attack"],
 * //   wasTranslated: true,
 * //   medicalTerm: "myocardial infarction",
 * //   originalTerm: "heart attack"
 * // }
 */
export function translateQuery(query: string): TranslationResult
```

**Substeps:**
- [ ] Import TERM_MAPPINGS from termMappings.ts
- [ ] Implement translateQuery() function
- [ ] Add exact match lookup (case-insensitive)
- [ ] Add partial match for multi-word queries
- [ ] Handle edge case: query is already a medical term
- [ ] Handle edge case: no mapping found
- [ ] Return both terms for combined search
- [ ] Add detailed JSDoc comments
- [ ] Export utility functions

---

### Step 3: Add TypeScript Types
🟥 **To Do**

**File:** `app/types/icd.ts` (modify existing)

Add new interfaces for term translation:

```typescript
// =============================================================================
// Phase 5: Common Terms Translation Types
// =============================================================================

/**
 * Single term mapping entry.
 */
interface TermMapping {
  /** Primary medical term to search */
  medical: string;
  /** Alternative medical terms (searched if primary fails) */
  alternatives?: string[];
  /** ICD code family hint for scoring boost */
  icdHint?: string;
}

/**
 * Result of translating a user's search query.
 */
interface TranslationResult {
  /** Terms to actually search (may include both original and medical) */
  searchTerms: string[];
  /** Whether translation occurred */
  wasTranslated: boolean;
  /** Original user input */
  originalTerm: string;
  /** Medical term (if translated) */
  medicalTerm?: string;
  /** User-friendly message for UI */
  message?: string;
}

/**
 * Enhanced search results with translation metadata.
 */
interface SearchResultsWithTranslation extends SearchResultsWithMeta {
  /** Translation info (if query was translated) */
  translation?: TranslationResult;
}
```

**Substeps:**
- [ ] Add TermMapping interface
- [ ] Add TranslationResult interface
- [ ] Add SearchResultsWithTranslation interface
- [ ] Add helpful JSDoc comments
- [ ] Verify TypeScript compiles

---

## Phase 5B: API Integration (Steps 4-5)

### Step 4: Update API to Use Term Mapper
🟥 **To Do**

**File:** `app/lib/api.ts` (modify existing)

Integrate translation before API search:

```typescript
// Before:
export async function searchICD10(query: string): Promise<SearchResultsWithMeta>

// After:
export async function searchICD10(query: string): Promise<SearchResultsWithTranslation>

// Inside searchICD10:
// 1. Call translateQuery(query)
// 2. If wasTranslated, search the medical term
// 3. Return results with translation metadata
```

**Substeps:**
- [ ] Import translateQuery from termMapper
- [ ] Import TranslationResult type
- [ ] Call translateQuery at start of searchICD10
- [ ] Use translated term for API search
- [ ] Include translation info in return value
- [ ] Update return type to SearchResultsWithTranslation
- [ ] Maintain backwards compatibility

---

### Step 5: Handle Combined Searches
🟥 **To Do**

**File:** `app/lib/api.ts` (modify existing)

Search BOTH original and translated terms for best coverage:

```typescript
// Strategy: Search medical term primary, original as supplement
// Example: "heart attack" → Search "myocardial infarction" first
//          Then search "heart attack" for any additional matches
//          Deduplicate by code, prefer higher-scored results

async function searchWithTranslation(query: string): Promise<SearchResultsWithTranslation> {
  const translation = translateQuery(query);
  
  if (translation.wasTranslated) {
    // Search medical term (primary)
    const medicalResults = await searchICD10Raw(translation.medicalTerm);
    
    // Optionally search original term (supplement)
    const originalResults = await searchICD10Raw(translation.originalTerm);
    
    // Merge and deduplicate
    const combined = mergeResults(medicalResults, originalResults);
    
    return { ...combined, translation };
  }
  
  // No translation - normal search
  return { ...(await searchICD10Raw(query)), translation };
}
```

**Substeps:**
- [ ] Implement searchICD10Raw (internal function)
- [ ] Add parallel/sequential search logic
- [ ] Implement mergeResults for deduplication
- [ ] Deduplicate by ICD code
- [ ] Keep higher-scored result when duplicate
- [ ] Maintain proper scoring after merge
- [ ] Test performance (should be < 500ms total)

---

## Phase 5C: UI Enhancement (Steps 6-8)

### Step 6: Add Translation Badge to SearchResults
🟥 **To Do**

**File:** `app/components/SearchResults.tsx` (modify existing)

Show transparent message when query was translated:

```jsx
{/* Translation Notice - Shows when query was translated */}
{translation?.wasTranslated && (
  <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 
                  border border-blue-200 dark:border-blue-800/50">
    <p className="text-sm text-blue-700 dark:text-blue-300">
      💡 <strong>Showing results for:</strong> "{translation.medicalTerm}"
      <span className="text-blue-500 dark:text-blue-400 ml-2">
        (You searched: "{translation.originalTerm}")
      </span>
    </p>
  </div>
)}
```

**Substeps:**
- [ ] Accept translation prop in SearchResultsProps
- [ ] Add conditional translation notice above results
- [ ] Style with blue theme (informational)
- [ ] Show both medical term and original term
- [ ] Add dismiss button (optional)
- [ ] Make it accessible (aria-live)

---

### Step 7: Update SearchBar with Examples
🟥 **To Do**

**File:** `app/components/SearchBar.tsx` (modify existing)

Add examples that showcase the translation feature:

```jsx
// Update placeholder
placeholder="Search conditions (e.g., heart attack, diabetes, back pain)"

// Update "Try:" suggestions to include lay terms
<span className="text-gray-500">Try:</span>
<button onClick={() => handleSearch("heart attack")}>heart attack</button>
<button onClick={() => handleSearch("diabetes")}>diabetes</button>
<button onClick={() => handleSearch("back pain")}>back pain</button>
```

**Substeps:**
- [ ] Update placeholder text with lay term examples
- [ ] Update "Try:" suggestions with common terms
- [ ] Include mix of lay terms and medical terms
- [ ] Ensure suggestions trigger actual searches

---

### Step 8: Add Feature Tooltip
🟥 **To Do**

**File:** `app/components/SearchBar.tsx` (modify existing)

Add help icon with tooltip explaining the feature:

```jsx
{/* Help icon with tooltip */}
<div className="relative group">
  <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
  <div className="absolute hidden group-hover:block ...">
    <p className="font-medium">Smart Search</p>
    <p className="text-xs mt-1">
      Search using everyday language! We automatically translate 
      common terms like "heart attack" to medical terminology.
    </p>
  </div>
</div>
```

**Substeps:**
- [ ] Import HelpCircle icon from lucide-react
- [ ] Add help icon next to search input
- [ ] Create tooltip with explanation
- [ ] Style tooltip appropriately
- [ ] Test hover/focus behavior

---

## Phase 5D: Testing & Documentation (Steps 9-10)

### Step 9: Test Common Terms
🟥 **To Do**

Test all key common terms and verify results:

| Search Term | Expected Medical Term | Expected Top Code | Status |
|-------------|----------------------|-------------------|--------|
| heart attack | myocardial infarction | I21.9 | 🟥 |
| stroke | cerebral infarction | I63.9 | 🟥 |
| high blood pressure | hypertension | I10 | 🟥 |
| flu | influenza | J11.1 | 🟥 |
| heartburn | gastroesophageal reflux | K21.9 | 🟥 |
| broken bone | fracture | S42.*, etc | 🟥 |
| anxiety attack | panic disorder | F41.0 | 🟥 |
| slipped disc | intervertebral disc disorder | M51.* | 🟥 |
| chest pain | angina pectoris | I20.9 | 🟥 |
| diabetes | (no translation needed) | E11.9 | 🟥 |

**Substeps:**
- [ ] Test all 10 key terms above
- [ ] Verify translation message appears
- [ ] Verify correct codes in top results
- [ ] Test edge cases (typos, partial matches)
- [ ] Test performance (< 500ms)
- [ ] Document any issues found

---

### Step 10: Update README
🟥 **To Do**

**File:** `README.md` (modify existing)

Add documentation for the common terms feature:

```markdown
## 🗣️ Smart Search with Common Terms (Phase 5)

Search using everyday language! The ICD Mind Map automatically translates 
common terms into medical terminology for better results.

### How It Works

| You Search | We Search | Why |
|------------|-----------|-----|
| "heart attack" | "myocardial infarction" | Medical term for heart attack |
| "stroke" | "cerebral infarction" | Medical term for stroke |
| "flu" | "influenza" | Medical term for flu |
| "heartburn" | "gastroesophageal reflux" | Medical term for acid reflux |

### Supported Terms

80+ common terms are supported, including:
- Cardiovascular: heart attack, stroke, high blood pressure, chest pain
- Respiratory: flu, common cold, bronchitis, pneumonia
- Gastrointestinal: heartburn, stomach ulcer, IBS
- Mental Health: anxiety, depression, panic attack
- Musculoskeletal: back pain, broken bone, slipped disc
- And many more!

### Transparent Translation

When your search is translated, you'll see a notice:
> 💡 **Showing results for:** "myocardial infarction" (You searched: "heart attack")
```

**Substeps:**
- [ ] Add "Smart Search" section to README
- [ ] Include translation examples table
- [ ] List supported term categories
- [ ] Explain the transparent UI
- [ ] Add to features list

---

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `app/lib/termMappings.ts` | CREATE | 80+ term mappings |
| `app/lib/termMapper.ts` | CREATE | Translation logic |
| `app/types/icd.ts` | MODIFY | Add translation types |
| `app/lib/api.ts` | MODIFY | Integrate translation |
| `app/components/SearchResults.tsx` | MODIFY | Translation badge |
| `app/components/SearchBar.tsx` | MODIFY | Examples + tooltip |
| `README.md` | MODIFY | Documentation |

---

## Success Criteria Checklist

- [ ] Search "heart attack" shows myocardial infarction results
- [ ] Search "stroke" shows cerebrovascular results  
- [ ] Translation badge appears with medical term
- [ ] Original term still shown in badge
- [ ] Medical term searches work normally (no translation)
- [ ] 80+ terms mapped with high accuracy
- [ ] Performance < 500ms for translated searches
- [ ] No TypeScript errors
- [ ] All tests pass
- [ ] README updated

---

## Notes

**Data Quality Priority:**
- Prioritize accuracy over quantity
- Each mapping should be clinically accurate
- Use authoritative sources (CDC, NIH, etc.)
- Include only high-confidence mappings

**Performance Considerations:**
- Map lookup is O(1) - very fast
- Single API call when possible
- Parallel requests if searching both terms
- Total time target: < 500ms

**Edge Cases:**
- User searches medical term directly → No translation, normal search
- User searches unknown term → No translation, normal search
- User searches partial term → No translation (might be typing)
- Mapped term returns 0 results → Consider falling back to original

---

## Commands

```bash
# Start dev server
npm run dev

# Type check
npx tsc --noEmit

# Build
npm run build
```

---

*Last Updated: Phase 5 Plan Created*
*Next Action: Execute Step 1 - Create termMappings.ts*
