---
title: "Feature: Enhanced Drug Lookup with UMLS RxNorm API"
type: feat
date: 2026-02-04
---

# Feature: Enhanced Drug Lookup with UMLS RxNorm API

## Overview

Enhance MedCodeMap's existing 3-tier drug lookup system with UMLS RxNorm API features: drug class badges, ingredient breakdowns, related drug suggestions, and UI filtering. Also fix the NASH bug by adding Rezdiffra to curated mappings.

## Problem Statement

**Current limitations:**
1. **No drug classification** - Users can't see drug classes (e.g., "GLP-1 Agonist", "SSRI")
2. **No ingredient breakdown** - Combination drugs (Qsymia, Contrave) don't show components
3. **No related drugs** - Users can't discover different strengths/forms of same drug
4. **NASH bug** - Returns outdated Ocaliva/Iqirvo instead of Rezdiffra (FDA-approved March 2024)
5. **No filtering** - Can't filter by dosage form (tablet vs injection)

**What we're keeping:**
- Existing 3-tier architecture (curated → AI cache → live generation)
- AI validation with Claude (scoring 0-10)
- 24-hour caching strategy
- Current RxNorm REST API integration (`/drugs.json`)

## Proposed Solution

### Phase 1: Fix NASH Bug (Quick Win)

Update `conditionDrugMappings.ts` to add NASH/NAFLD entries with Rezdiffra.

**File: `app/lib/conditionDrugMappings.ts`**

```typescript
// Add to CONDITION_DRUG_MAPPINGS
'nonalcoholic steatohepatitis': [
  'Rezdiffra',      // resmetirom - FDA-approved March 2024
],
'nash': [
  'Rezdiffra',
],
'nafld': [
  'Rezdiffra',
],
'fatty liver disease': [
  'Rezdiffra',
],
'metabolic dysfunction-associated steatohepatitis': [
  'Rezdiffra',
],
```

### Phase 2: Create UMLS RxClass API Integration

Create new file for UMLS-authenticated API calls.

**File: `app/lib/umlsRxClassApi.ts` (NEW)**

```typescript
/**
 * UMLS RxClass API Integration
 *
 * Provides drug class/category information using RxClass API.
 * Requires UTS_API_KEY environment variable.
 *
 * API Docs: https://lhncbc.nlm.nih.gov/RxNav/APIs/RxClassAPIs.html
 */

const RXCLASS_BASE_URL = 'https://rxnav.nlm.nih.gov/REST/rxclass';

interface RxClassResult {
  classId: string;
  className: string;
  classType: string; // 'ATC', 'EPC', 'MOA', 'PE', etc.
}

export async function getDrugClasses(rxcui: string): Promise<RxClassResult[]>;
export async function getDrugIngredients(rxcui: string): Promise<string[]>;
export async function getRelatedDrugs(rxcui: string): Promise<RelatedDrug[]>;
```

**Key endpoints:**
- `/rxclass/class/byRxcui.json?rxcui={rxcui}` - Get drug classes
- RxNorm `/rxcui/{rxcui}/related.json?tty=IN` - Get ingredients
- RxNorm `/rxcui/{rxcui}/related.json?tty=SBD+SCD` - Get related forms

### Phase 3: Extend Data Types

**File: `app/types/icd.ts`**

```typescript
export interface DrugResult {
  brandName: string;
  genericName: string;
  manufacturer: string;
  indication: string;
  warnings?: string;

  // NEW fields
  rxcui?: string;                    // RxNorm Concept ID
  drugClasses?: DrugClass[];         // From RxClass API
  ingredients?: string[];            // For combination drugs
  relatedDrugs?: RelatedDrug[];      // Different strengths/forms
  dosageForm?: string;               // Tablet, Injection, etc.
  strength?: string;                 // 10mg, 0.5mg/mL, etc.
}

export interface DrugClass {
  classId: string;
  className: string;
  classType: 'ATC' | 'EPC' | 'MOA' | 'PE' | 'DISEASE';
}

export interface RelatedDrug {
  rxcui: string;
  name: string;
  dosageForm: string;
  strength: string;
}
```

### Phase 4: Integrate into Validation Pipeline

**File: `app/lib/drugValidationPipeline.ts`**

```typescript
// After RxNorm lookup, enrich with UMLS data
async function enrichDrugWithUMLS(drug: DrugResult): Promise<DrugResult> {
  // Only if UTS_API_KEY is configured
  if (!process.env.UTS_API_KEY) {
    return drug; // Graceful degradation
  }

  const [classes, ingredients, related] = await Promise.all([
    getDrugClasses(drug.rxcui),
    getDrugIngredients(drug.rxcui),
    getRelatedDrugs(drug.rxcui),
  ]);

  return {
    ...drug,
    drugClasses: classes,
    ingredients,
    relatedDrugs: related,
  };
}
```

### Phase 5: Update DrugCard UI

**File: `app/components/DrugCard.tsx`**

Add new UI elements:
1. **Drug class badges** - Small gray pills below drug name
2. **Ingredient breakdown** - Expandable section for combo drugs
3. **Related drugs** - Collapsible list of strength/form variants

```tsx
// Drug class badges
{drug.drugClasses?.map(cls => (
  <span key={cls.classId} className="px-2 py-0.5 text-xs bg-gray-100 rounded-full">
    {cls.className}
  </span>
))}

// Ingredient breakdown (for combo drugs)
{drug.ingredients && drug.ingredients.length > 1 && (
  <div className="mt-2 text-xs text-gray-500">
    <span className="font-medium">Active ingredients:</span>
    <ul className="ml-4 list-disc">
      {drug.ingredients.map(ing => <li key={ing}>{ing}</li>)}
    </ul>
  </div>
)}
```

### Phase 6: Add Dosage Form Filtering

**File: `app/components/DrugFilterChips.tsx` (NEW)**

```tsx
interface DrugFilterChipsProps {
  availableForms: string[];          // ['Tablet', 'Injection', 'Capsule']
  selectedForms: string[];           // Currently selected filters
  onToggleForm: (form: string) => void;
  onClearFilters: () => void;
}

// Filter logic: OR (show drugs matching ANY selected form)
// When no filters selected: show all drugs
```

## Technical Considerations

### API Authentication

UMLS requires UTS (UMLS Terminology Services) API key:
- Obtain from: https://uts.nlm.nih.gov/uts/
- Store in `.env.local` as `UTS_API_KEY`
- **Graceful degradation**: If key missing, skip UMLS enrichment silently

### Caching Strategy

Follow existing patterns from `rxNormApi.ts`:
- 24-hour TTL for all UMLS data
- Cache drug classes separately (more stable, could extend to 7 days)
- Cache key format: `rxclass:${rxcui}` and `ingredients:${rxcui}`
- Cache failures to avoid retry storms

### Error Handling

```typescript
// Never throw to UI - graceful degradation
try {
  const classes = await getDrugClasses(rxcui);
  return classes;
} catch (error) {
  console.warn('[RxClass] Failed to fetch drug classes:', error);
  return []; // Empty array, not error
}
```

### Performance

- **Parallel API calls**: Use `Promise.all()` for RxClass, ingredients, related drugs
- **Progressive loading**: Show basic drug info immediately, add enrichments as they load
- **Expected latency**: +500-1000ms for UMLS enrichment (acceptable)

## Acceptance Criteria

### NASH Bug Fix
- [ ] Search "NASH" returns Rezdiffra with FDA-approved badge
- [ ] Search "fatty liver" returns Rezdiffra
- [ ] Search "steatohepatitis" returns Rezdiffra
- [ ] AI validation scores Rezdiffra correctly (7+ for NASH)

### Drug Classes
- [ ] DrugCard displays drug class badges (e.g., "GLP-1 Agonist")
- [ ] Multiple classes shown when drug has multiple classifications
- [ ] No badge shown gracefully when class not found
- [ ] Works without UTS_API_KEY (graceful degradation)

### Ingredient Breakdown
- [ ] Combination drugs show "Active ingredients" section
- [ ] Single-ingredient drugs don't show breakdown section
- [ ] Ingredients fetched from RxNorm Relations API

### Related Drugs
- [ ] DrugCard shows expandable "Related" section
- [ ] Different strengths of same drug listed
- [ ] Different forms of same drug listed
- [ ] No circular references (Drug A → Drug B → Drug A)

### Dosage Form Filtering
- [ ] Filter chips appear when multiple forms available
- [ ] Clicking chip filters drug list (OR logic)
- [ ] Multiple chips can be selected
- [ ] "Clear filters" resets to show all
- [ ] Empty state shown when filter matches nothing

### No Regressions
- [ ] Existing drug lookup still works
- [ ] 3-tier cache still functions
- [ ] AI validation still scores correctly
- [ ] DrugCard FDA-approved/off-label badges unchanged

## Test Plan

### Manual Testing

1. **NASH fix verification:**
   - Search "NASH" → Rezdiffra appears
   - Search "nonalcoholic steatohepatitis" → Rezdiffra appears
   - Verify FDA-approved badge on Rezdiffra

2. **Drug class badges:**
   - Search "diabetes" → Metformin shows "Biguanide" class
   - Search "obesity" → Wegovy shows "GLP-1 Agonist" class
   - Verify graceful degradation without UTS_API_KEY

3. **Ingredient breakdown:**
   - Search "obesity" → Qsymia shows "phentermine + topiramate"
   - Search "addiction" → Contrave shows "naltrexone + bupropion"

4. **Dosage form filtering:**
   - Search "diabetes" → See filter chips (Tablet, Injection)
   - Select "Injection" → Only injectable drugs shown
   - Clear filter → All drugs return

### API Testing

```bash
# Test RxClass endpoint
curl "https://rxnav.nlm.nih.gov/REST/rxclass/class/byRxcui.json?rxcui=1649574"

# Test RxNorm Relations (ingredients)
curl "https://rxnav.nlm.nih.gov/REST/rxcui/1649574/related.json?tty=IN"

# Test RxNorm Relations (related forms)
curl "https://rxnav.nlm.nih.gov/REST/rxcui/1649574/related.json?tty=SBD+SCD"
```

## Files to Modify/Create

| File | Action | Description |
|------|--------|-------------|
| `app/lib/conditionDrugMappings.ts` | Modify | Add NASH/Rezdiffra entries |
| `app/lib/umlsRxClassApi.ts` | **Create** | UMLS RxClass API integration |
| `app/lib/rxNormApi.ts` | Modify | Add ingredients/related endpoints |
| `app/lib/drugValidationPipeline.ts` | Modify | Integrate UMLS enrichment |
| `app/types/icd.ts` | Modify | Extend DrugResult interface |
| `app/components/DrugCard.tsx` | Modify | Add class badges, ingredients UI |
| `app/components/DrugFilterChips.tsx` | **Create** | Dosage form filter component |
| `.env.example` | Modify | Add UTS_API_KEY placeholder |

## Implementation Order

1. **Phase 1: NASH Bug Fix** (30 min)
   - Update conditionDrugMappings.ts
   - Test NASH search returns Rezdiffra
   - Commit: `fix(drugs): add Rezdiffra for NASH/NAFLD conditions`

2. **Phase 2: UMLS API Integration** (2 hrs)
   - Create umlsRxClassApi.ts
   - Add getDrugClasses, getDrugIngredients, getRelatedDrugs
   - Add caching with 24hr TTL
   - Commit: `feat(drugs): add UMLS RxClass API integration`

3. **Phase 3: Type Extensions** (30 min)
   - Update DrugResult interface
   - Add DrugClass, RelatedDrug types
   - Commit: `feat(types): extend DrugResult with UMLS fields`

4. **Phase 4: Pipeline Integration** (1 hr)
   - Add enrichDrugWithUMLS to pipeline
   - Implement graceful degradation
   - Parallel API calls with Promise.all
   - Commit: `feat(drugs): integrate UMLS enrichment into validation pipeline`

5. **Phase 5: DrugCard UI** (2 hrs)
   - Add drug class badges
   - Add ingredient breakdown section
   - Add related drugs section
   - Commit: `feat(ui): display drug classes, ingredients, and related drugs`

6. **Phase 6: Filtering UI** (1.5 hrs)
   - Create DrugFilterChips component
   - Add filter state management
   - Implement filter logic
   - Commit: `feat(ui): add dosage form filtering for drugs`

## Dependencies

- **UTS_API_KEY**: Required for full UMLS features (graceful degradation if missing)
- **No new npm packages**: Uses existing fetch patterns
- **RxNorm REST API**: Free, no key required (already integrated)
- **RxClass API**: Free, no key required

## Future Considerations

- **NDC codes**: Could add National Drug Code lookup for pharmacy integration
- **Drug interactions**: Could integrate with RxNorm interactions API
- **Price data**: Would require separate data source (not in RxNorm/UMLS)
- **Mapping freshness**: Consider automated checks for new FDA approvals

## References

### Internal
- Discovery doc: `docs/discovery/drug-lookup-current-state.md`
- Current RxNorm: `app/lib/rxNormApi.ts`
- Validation pipeline: `app/lib/drugValidationPipeline.ts`
- Drug mappings: `app/lib/conditionDrugMappings.ts`

### External
- [RxClass API Documentation](https://lhncbc.nlm.nih.gov/RxNav/APIs/RxClassAPIs.html)
- [RxNorm REST API](https://lhncbc.nlm.nih.gov/RxNav/APIs/RxNormAPIs.html)
- [UMLS Terminology Services](https://uts.nlm.nih.gov/uts/)
- [Rezdiffra FDA Approval](https://www.fda.gov/drugs/news-events-human-drugs/fda-approves-first-treatment-patients-liver-scarring-due-fatty-liver-disease)
