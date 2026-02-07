# Changelog

All notable changes to MedCodeMap will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---


## [2026-02-06] - Medicare Coverage Integration

### Added
- Medicare Coverage button (amber theme) on ResultCard for ICD-10 search results
- CMS API integration searching National Coverage Determinations (NCDs) and Local Coverage Determinations (LCDs)
- Expandable coverage section with NCD/LCD results, clickable links to CMS website
- Server-side proxy at /api/cms-coverage with 24hr in-memory caching
- Client-side helper (cmsCoverageApi.ts) for future Coverage tab use
- CMS disclaimer on all coverage results

### Fixed
- Procedures button restyled to match Drugs/Trials button pattern (inline sizing, spinner, chevron, disabled state)

### Technical
- New app/api/cms-coverage/route.ts server-side proxy with client-side keyword filtering
- New app/lib/cmsCoverageApi.ts client helper with NCDSummary, LCDSummary, CoverageResults types
- Coverage state variables and handleToggleCoverage added to ResultCard.tsx
- Shield icon (lucide-react) for coverage UI elements


## [2026-02-04] - Enhanced Drug Lookup with UMLS

### Added
- Drug class badges showing therapeutic categories (Beta Blocker, NSAID, Biguanide, GLP-1 Agonist, etc.)
- Ingredient breakdown for combination drugs (Qsymia, Contrave, etc.)
- Related drug suggestions with alternative strengths and dosage forms
- Dosage form filtering with filter chips (Pills, Liquids, Injections, Topical)
- UMLS RxClass API integration with graceful degradation
- 24hr caching for drug classes and ingredients, 7-day caching for stable data

### Fixed
- NASH/NAFLD now correctly returns Rezdiffra (resmetirom) - FDA-approved March 2024
- Stale drug mappings for metabolic dysfunction-associated steatohepatitis (MASH)
- Missing entries for fatty liver disease and liver fibrosis

### Technical
- New umlsRxClassApi.ts module for RxClass API integration
- Extended DrugResult interface with rxcui, drugClasses, ingredients, relatedDrugs
- New DrugFilterChips component for dosage form filtering
- Enhanced drugValidationPipeline.ts with UMLS enrichment layer

---


## [2026-02-06] - Medicare Coverage Integration

### Added
- Medicare Coverage button (amber theme) on ResultCard for ICD-10 search results
- CMS API integration searching National Coverage Determinations (NCDs) and Local Coverage Determinations (LCDs)
- Expandable coverage section with NCD/LCD results, clickable links to CMS website
- Server-side proxy at /api/cms-coverage with 24hr in-memory caching
- Client-side helper (cmsCoverageApi.ts) for future Coverage tab use
- CMS disclaimer on all coverage results

### Fixed
- Procedures button restyled to match Drugs/Trials button pattern (inline sizing, spinner, chevron, disabled state)

### Technical
- New app/api/cms-coverage/route.ts server-side proxy with client-side keyword filtering
- New app/lib/cmsCoverageApi.ts client helper with NCDSummary, LCDSummary, CoverageResults types
- Coverage state variables and handleToggleCoverage added to ResultCard.tsx
- Shield icon (lucide-react) for coverage UI elements


## [Unreleased]

### Added
- Procedure codes feature: Related procedures displayed for ICD-10 conditions
- Two-tier procedure lookup: curated data (30 conditions, 224 codes) with SNOMED CT API fallback
- ProcedureCard component with category-based color theming (Diagnostic, Therapeutic, Monitoring, Equipment)
- ProcedureFilterChips component for filtering procedures by category
- Server-side SNOMED CT API route (`GET /api/snomed-procedures`) keeping UMLS API key secure
- Three procedure code API integrations: HCPCS Level II, ICD-10-PCS, SNOMED CT via UMLS

### Fixed
- Corrected SNOMED codes for BPH condition (PSA measurement, Urinalysis)
- Fixed content clipping on expanded procedure sections (overflow fixes in CategorySection, RelatedCodesSection)
- Fixed 405 error on SNOMED API route (POST→GET alignment)
- Added error state for Tier 2 SNOMED API failures instead of silent empty state

---


## [2026-02-06] - Medicare Coverage Integration

### Added
- Medicare Coverage button (amber theme) on ResultCard for ICD-10 search results
- CMS API integration searching National Coverage Determinations (NCDs) and Local Coverage Determinations (LCDs)
- Expandable coverage section with NCD/LCD results, clickable links to CMS website
- Server-side proxy at /api/cms-coverage with 24hr in-memory caching
- Client-side helper (cmsCoverageApi.ts) for future Coverage tab use
- CMS disclaimer on all coverage results

### Fixed
- Procedures button restyled to match Drugs/Trials button pattern (inline sizing, spinner, chevron, disabled state)

### Technical
- New app/api/cms-coverage/route.ts server-side proxy with client-side keyword filtering
- New app/lib/cmsCoverageApi.ts client helper with NCDSummary, LCDSummary, CoverageResults types
- Coverage state variables and handleToggleCoverage added to ResultCard.tsx
- Shield icon (lucide-react) for coverage UI elements


### Changed
- **Rebranding to MedCodeMap** - Complete brand refresh with new identity
  - Renamed application from "ICD Mind Map" to "MedCodeMap"
  - New logo and favicon with medical blue color scheme
  - Updated color palette: green (#00D084) → medical blue (#1976D2)
  - New accent colors: teal (#80DEEA) and light blue (#90CAF9)
  - Updated metadata, documentation, and UI components
- Updated production domain from icd-lookup-app.vercel.app to medcodemap.com
- Configured custom domain with Namecheap DNS and Vercel hosting
- Both www and non-www variants now redirect correctly to production application

### Added
- **Query Phrase Normalizer** - Intelligent pattern-based search transformation for cancer/tumor queries
  - New file: `app/lib/queryNormalizer.ts` with pattern matching engine
  - Supports 5 transformation patterns:
    - `[organ] cancer` → "malignant neoplasm of [organ]" (e.g., "pancreas cancer")
    - `cancer of [the] [organ]` → "malignant neoplasm of [organ]" (e.g., "cancer of the liver")
    - `[organ] tumor` → "neoplasm of [organ]" (e.g., "brain tumor")
    - `[organ] carcinoma` → "malignant neoplasm of [organ]" (e.g., "lung carcinoma")
    - `[adjective] [organ] cancer` → "malignant neoplasm of [organ]" (e.g., "metastatic liver cancer")
  - ~70 organ names across 10 body systems (digestive, respiratory, reproductive, urinary, nervous, etc.)
  - British spelling support ("tumour" alongside "tumor")
  - 16 medical adjectives recognized (metastatic, advanced, invasive, localized, etc.)
  - Organ validation prevents false positives (e.g., "car cancer" won't match)
  - Integrated into search flow: runs BEFORE termMapper translation
  - Original query always included as fallback for broader matching
  - Debug logging: `[Normalizer]` and `[Search]` prefixes for tracing

- **Related ICD-10 Codes Display** - When searching for a specific ICD-10 code, shows related codes in the same family
  - "Your Search" section displays the exact match prominently with "Exact Match" badge
  - Collapsible "Related Codes" section shows all sibling codes (e.g., searching I21.9 shows all I21.x codes)
  - Preview pills display first 6 related codes when collapsed for quick overview
  - Supports all ICD-10 formats: standard (I21.9), alpha-numeric (I21.A1), 7th character extensions (S72.001A), X placeholders (T36.0X1A)
  - "Standalone Code" message displays when a code has no related codes in its category
  - Related codes cached by parent category for 24 hours to improve performance
  - Helper functions: `extractParentCode()`, `isSpecificCode()`, `getRelatedCodes()`, `getRelatedCodesCacheStats()`
  - New component: `RelatedCodesSection.tsx` with collapsible UI, loading states, and accessibility support

- **NIH Medical Conditions API Integration** - Intelligent medical term translation
  - Tier 1: NIH Conditions API provides ICD codes for 2,400+ medical conditions
  - Tier 2: Curated termMapper synonyms (85+ manual mappings)
  - Tier 3: ICD-10 API full-text search
  - Common terms like "lung cancer", "heart attack", "high blood pressure" now return accurate ICD codes
  - Consumer-friendly names mapped to clinical terminology (e.g., "heart attack" → "Myocardial infarction")
  - Built-in synonym database maintained by NIH (reduces maintenance burden)
  - In-memory cache for Conditions API (24hr TTL, 500 entries max, LRU eviction)
  - Direct ICD code detection skips Conditions API (e.g., "E11.9" searches directly)
  - Translation source tracking for debugging (`source: 'conditions-api' | 'term-mapper'`)
  - Search telemetry logging for performance monitoring

- **AI-Powered Drug Fallback System** - 3-tier drug lookup for universal coverage
  - Tier 1: Curated mappings (fastest, most accurate)
  - Tier 2: Fallback cache (AI-generated lists cached for 24 hours)
  - Tier 3: AI generation via Claude Haiku for unmapped conditions
- Telemetry tracking for drug lookup hit rates (curated vs cached vs AI-generated)
- `FallbackStats` interface for monitoring cache performance
- Input validation for empty condition names in drug lookup functions

### Changed
- `SearchResults.tsx` now conditionally renders "Related Codes" view for specific ICD code searches
- View toggle (Flat/Grouped) hidden during specific code searches (not applicable to single-code lookup)
- Load More button hidden during specific code searches
- Header shows "Code Lookup" badge instead of "Ranked by relevance" for specific code searches

### Improved
- **Cancer Search Results** - Previously problematic searches now return results:
  - "pancreas cancer" → finds C25.x codes (was: 0 results)
  - "cancer of the liver" → finds C22.x codes (was: limited results)
  - "brain tumor" → finds D33.x/C71.x codes (was: inconsistent)
  - Pattern-based approach scales to all ~70 organs without manual mapping
- Search now handles 2,400+ medical conditions with built-in synonyms (previously 85 manual mappings)
- Better user experience: lay terms automatically translate to clinical terminology
- Reduced maintenance burden: NIH maintains the synonym database
- Medical coders can now quickly find related codes when searching for a specific ICD-10 code

### Fixed
- Drug search now works for ALL conditions, not just curated ones
- Model compatibility: using stable `claude-3-haiku-20240307` for drug generation
- Explicit TypeScript return types for `getFallbackStats()`
- Debug logging for JSON parse failures in drug list generation
- MAX_DRUGS limit enforcement after parsing AI responses

---


## [2026-02-06] - Medicare Coverage Integration

### Added
- Medicare Coverage button (amber theme) on ResultCard for ICD-10 search results
- CMS API integration searching National Coverage Determinations (NCDs) and Local Coverage Determinations (LCDs)
- Expandable coverage section with NCD/LCD results, clickable links to CMS website
- Server-side proxy at /api/cms-coverage with 24hr in-memory caching
- Client-side helper (cmsCoverageApi.ts) for future Coverage tab use
- CMS disclaimer on all coverage results

### Fixed
- Procedures button restyled to match Drugs/Trials button pattern (inline sizing, spinner, chevron, disabled state)

### Technical
- New app/api/cms-coverage/route.ts server-side proxy with client-side keyword filtering
- New app/lib/cmsCoverageApi.ts client helper with NCDSummary, LCDSummary, CoverageResults types
- Coverage state variables and handleToggleCoverage added to ResultCard.tsx
- Shield icon (lucide-react) for coverage UI elements


## [1.2.0] - 2026-01-31

### Added
- **AI-Powered Drug Validation System** - Comprehensive 3-tier drug discovery pipeline
  - Curated drug mappings covering 80+ medications across 25+ medical conditions
  - RxNorm API integration for real-time drug data (brand names, generics, dosage forms)
  - Claude AI validation with intelligent 0-10 scoring and clinical reasoning
  - FDA-approved vs off-label drug categorization with visual distinction
  - Smart deduplication logic to prevent duplicate drug entries
  - Dual-layer caching system (RxNorm: 24hr, Pipeline: 24hr) reducing API costs by 90%
  - Tiered UI display: Green badges for FDA-approved drugs, amber badges for off-label options
  - Server-side API route (`/api/validate-drugs`) for secure Claude API key handling

### Changed
- Replaced OpenFDA drug label API with RxNorm API for improved data quality
- Updated drug search to use curated condition-to-drug mappings for accuracy
- Modified `ResultCard.tsx` to display drugs in FDA-approved and off-label sections
- Enhanced `DrugCard.tsx` with color-coded badges and borders

### Deprecated
- `openFdaApi.ts` - Marked as deprecated, replaced by RxNorm integration
  - OpenFDA had incomplete data (brand/generic names often undefined)
  - Kept for reference and potential future adverse events integration

### Fixed
- Drug name extraction from RxNorm responses (no more "Unknown Brand")
- Duplicate drug entries (e.g., multiple Qsymia dosages appearing separately)
- Client-side environment variable access (moved to server-side API route)
- Off-label drugs being excluded when duplicate entries exceeded result limit

### Technical Details
- Files created: `conditionDrugMappings.ts`, `rxNormApi.ts`
- Files modified: `drugValidationPipeline.ts`, `ResultCard.tsx`, `DrugCard.tsx`
- Dependencies: No new packages required (uses existing fetch API)
- Performance: 24-hour cache reduces repeated API calls by ~90%
### Added - Clinical Trials Multi-Status Filtering (Phase 9)

Enhanced clinical trials feature with interactive filtering and expanded results.

#### Filter Pills UI
- Interactive pill/chip toggles for 5 trial statuses: Recruiting, Active, Completed, Terminated, Withdrawn
- Purple highlight for selected filters, gray for unselected
- Live count badges on each pill showing available trials per status
- Filters reset to smart defaults when section is collapsed

#### Expanded Trial Support
- Increased from 5 to 15 trials per ICD code
- Fetch trials across multiple statuses in a single API call
- Added WITHDRAWN status type with orange color badge
- Dynamic "X of Y" count updates as filters are toggled

#### Accessibility & UX
- ARIA labels and `aria-pressed` states for screen readers
- Keyboard navigable filter pills
- Mobile-responsive flex-wrap layout
- Smooth transitions on filter toggle
- "No trials match current filters" message with helpful hint

#### Technical Details
- Client-side filtering with `useMemo` for instant response
- `useEffect` to reset filters on section collapse
- Conditional "Other" status pill for unexpected API statuses
- Updated `TrialStatus` type to include WITHDRAWN

---


## [2026-02-06] - Medicare Coverage Integration

### Added
- Medicare Coverage button (amber theme) on ResultCard for ICD-10 search results
- CMS API integration searching National Coverage Determinations (NCDs) and Local Coverage Determinations (LCDs)
- Expandable coverage section with NCD/LCD results, clickable links to CMS website
- Server-side proxy at /api/cms-coverage with 24hr in-memory caching
- Client-side helper (cmsCoverageApi.ts) for future Coverage tab use
- CMS disclaimer on all coverage results

### Fixed
- Procedures button restyled to match Drugs/Trials button pattern (inline sizing, spinner, chevron, disabled state)

### Technical
- New app/api/cms-coverage/route.ts server-side proxy with client-side keyword filtering
- New app/lib/cmsCoverageApi.ts client helper with NCDSummary, LCDSummary, CoverageResults types
- Coverage state variables and handleToggleCoverage added to ResultCard.tsx
- Shield icon (lucide-react) for coverage UI elements


### Added - Category Grouping (Phase 7A)

Organizes ICD-10 search results by disease chapter for easier navigation.

#### Category Organization
- Search results grouped by ICD-10 chapter (21 chapters covering all body systems)
- Categories include: Infectious, Neoplasms, Blood, Endocrine, Mental, Nervous, Eye, Ear, Circulatory, Respiratory, Digestive, Skin, Musculoskeletal, Genitourinary, Pregnancy, Perinatal, Congenital, Symptoms, Injuries, External Causes, Health Factors
- Categories sorted by relevance (chapter with highest-scoring result appears first)
- Color-coded left borders for visual distinction per category
- Chapter icons (Heart for Circulatory, Brain for Mental/Nervous, etc.)

#### Collapsible Sections
- Accordion-style expand/collapse for each category
- Smart default expansion: first category and categories with ≤3 results start expanded
- "Expand All" and "Collapse All" controls
- Smooth animations with 300ms transitions
- Collapsed preview shows first 4 ICD codes as compact pills

#### View Toggle
- Switch between **Flat** (traditional grid) and **Grouped** (category sections) views
- View preference stored in component state
- Summary header shows "X results in Y categories"

#### Accessibility
- Full keyboard navigation (Enter/Space to toggle categories)
- ARIA attributes (`aria-expanded`, `aria-controls`, `role="button"`)
- Visible focus states with ring indicator
- Screen reader friendly with proper labeling

#### Technical Details
- New files: `chapterMapping.ts`, `grouping.ts`, `CategorySection.tsx`
- O(n) grouping algorithm using Map for efficient lookups
- Preserves expand/collapse state during "Load More" operations
- Memoized computations to prevent unnecessary re-renders
- Dark mode support throughout

### Changed
- SearchResults component now supports grouped rendering
- Updated header to show category count in grouped view
- Removed Mind Map feature (simplified to list-only interface)

---


## [2026-02-06] - Medicare Coverage Integration

### Added
- Medicare Coverage button (amber theme) on ResultCard for ICD-10 search results
- CMS API integration searching National Coverage Determinations (NCDs) and Local Coverage Determinations (LCDs)
- Expandable coverage section with NCD/LCD results, clickable links to CMS website
- Server-side proxy at /api/cms-coverage with 24hr in-memory caching
- Client-side helper (cmsCoverageApi.ts) for future Coverage tab use
- CMS disclaimer on all coverage results

### Fixed
- Procedures button restyled to match Drugs/Trials button pattern (inline sizing, spinner, chevron, disabled state)

### Technical
- New app/api/cms-coverage/route.ts server-side proxy with client-side keyword filtering
- New app/lib/cmsCoverageApi.ts client helper with NCDSummary, LCDSummary, CoverageResults types
- Coverage state variables and handleToggleCoverage added to ResultCard.tsx
- Shield icon (lucide-react) for coverage UI elements


## [1.7.0] - 2026-01-26

### Added - Interactive Mind Map Enhancements (Phase 7)

#### Phase 7A: Click-to-Expand
- Progressive disclosure of drug and trial nodes
- Expand/collapse buttons on ICD code nodes with badge preview (`+3💊 +2🧪`)
- "Expand All" and "Collapse All" controls in top-left panel
- Nodes start collapsed for cleaner visualization
- Statistics panel shows visible vs. total node counts

#### Phase 7B: Hover Highlighting
- Hover over any node to see its connections highlighted
- Connected nodes stay at 100% opacity, others dim to 30%
- Edges brighten and thicken when connected to hovered node
- Smooth 200ms CSS transitions for all highlight effects
- Works on ICD codes, drugs, and trials (bi-directional)

#### Phase 7C: Focus Mode
- Click any node to enter Focus Mode (persistent highlight)
- Focused branch stays at 100% opacity with ring glow
- Non-connected nodes dim to 15% for clear isolation
- Focus Mode badge shows current node and connection count
- Click node again, click background, or click ✕ to exit
- Different from hover: focus persists until explicitly exited

#### Phase 7D: Multiple Layout Algorithms
- **Hierarchical (Tree)** — ICD codes at top, drugs/trials below
- **Radial (Sunburst)** — ICD codes in center circle, children radiating outward
- **Circular (Ring)** — All nodes arranged in a single circle
- Layout selector button group in top-left panel
- Smooth animated transitions when switching layouts (500ms)
- Layout preference saved to localStorage
- All features (expand, hover, focus) work in all layouts

### Changed
- Updated help tooltip with new workflow guidance
- Mind map statistics panel now shows visible/total counts
- Improved visual hierarchy in controls panel

---


## [2026-02-06] - Medicare Coverage Integration

### Added
- Medicare Coverage button (amber theme) on ResultCard for ICD-10 search results
- CMS API integration searching National Coverage Determinations (NCDs) and Local Coverage Determinations (LCDs)
- Expandable coverage section with NCD/LCD results, clickable links to CMS website
- Server-side proxy at /api/cms-coverage with 24hr in-memory caching
- Client-side helper (cmsCoverageApi.ts) for future Coverage tab use
- CMS disclaimer on all coverage results

### Fixed
- Procedures button restyled to match Drugs/Trials button pattern (inline sizing, spinner, chevron, disabled state)

### Technical
- New app/api/cms-coverage/route.ts server-side proxy with client-side keyword filtering
- New app/lib/cmsCoverageApi.ts client helper with NCDSummary, LCDSummary, CoverageResults types
- Coverage state variables and handleToggleCoverage added to ResultCard.tsx
- Shield icon (lucide-react) for coverage UI elements


## [1.6.0] - 2026-01-26

### Added - Favorites & History (Phase 6)

#### Favorites System
- Star icon on result cards to save ICD codes as favorites
- Favorites panel with slide-in drawer UI
- Category-based color coding for favorite codes
- Relative timestamps ("Just now", "2 hours ago", "Yesterday")
- One-click search from favorites
- Persistence via localStorage (up to 500 favorites)

#### Search History
- Enhanced history tracking with timestamps and result counts
- History panel showing recent searches
- Top result preview for each history entry
- One-click re-search from history
- Clear individual entries or all history
- Persistence via localStorage (up to 50 entries)

#### Export/Import
- Export favorites as JSON file with metadata
- Import favorites from JSON file (merges without duplicates)
- Cross-device sync via export/import workflow
- Status messages for successful/failed operations

### Changed
- Header updated with Favorites and History buttons
- Phase badge updated to "Phase 6 - Favorites"
- Improved mobile responsiveness for panels

---


## [2026-02-06] - Medicare Coverage Integration

### Added
- Medicare Coverage button (amber theme) on ResultCard for ICD-10 search results
- CMS API integration searching National Coverage Determinations (NCDs) and Local Coverage Determinations (LCDs)
- Expandable coverage section with NCD/LCD results, clickable links to CMS website
- Server-side proxy at /api/cms-coverage with 24hr in-memory caching
- Client-side helper (cmsCoverageApi.ts) for future Coverage tab use
- CMS disclaimer on all coverage results

### Fixed
- Procedures button restyled to match Drugs/Trials button pattern (inline sizing, spinner, chevron, disabled state)

### Technical
- New app/api/cms-coverage/route.ts server-side proxy with client-side keyword filtering
- New app/lib/cmsCoverageApi.ts client helper with NCDSummary, LCDSummary, CoverageResults types
- Coverage state variables and handleToggleCoverage added to ResultCard.tsx
- Shield icon (lucide-react) for coverage UI elements


## [1.5.0] - 2026-01-25

### Added - Common Terms Translation (Phase 5)

- Search with everyday language (85+ common terms)
- Automatic translation to medical terminology
- Examples: "heart attack" → "myocardial infarction"
- "Showing results for..." badge when translation applied
- Dual search: searches both original and translated terms
- Search tips tooltip with usage examples
- Categories: cardiovascular, respiratory, musculoskeletal, GI, mental health, neurological, dermatological

---


## [2026-02-06] - Medicare Coverage Integration

### Added
- Medicare Coverage button (amber theme) on ResultCard for ICD-10 search results
- CMS API integration searching National Coverage Determinations (NCDs) and Local Coverage Determinations (LCDs)
- Expandable coverage section with NCD/LCD results, clickable links to CMS website
- Server-side proxy at /api/cms-coverage with 24hr in-memory caching
- Client-side helper (cmsCoverageApi.ts) for future Coverage tab use
- CMS disclaimer on all coverage results

### Fixed
- Procedures button restyled to match Drugs/Trials button pattern (inline sizing, spinner, chevron, disabled state)

### Technical
- New app/api/cms-coverage/route.ts server-side proxy with client-side keyword filtering
- New app/lib/cmsCoverageApi.ts client helper with NCDSummary, LCDSummary, CoverageResults types
- Coverage state variables and handleToggleCoverage added to ResultCard.tsx
- Shield icon (lucide-react) for coverage UI elements


## [1.4.0] - 2026-01-24

### Added - Intelligent Search Ranking (Phase 4)

- Multi-factor relevance scoring algorithm
- Keyword match scoring (35% weight)
- Code popularity scoring based on healthcare utilization (40% weight)
- Specificity scoring for code granularity (15% weight)
- Exactness bonus for direct code searches (10% weight)
- "Top Match" badges on highest-scoring results
- Fetches 50 results, ranks them, displays top 25
- "Load More" button for extended results
- Score breakdown available in result cards

### Added
- Common ICD-10 code frequency database (100+ codes)
- Based on MEPS, CMS, and all-payer claims data

---


## [2026-02-06] - Medicare Coverage Integration

### Added
- Medicare Coverage button (amber theme) on ResultCard for ICD-10 search results
- CMS API integration searching National Coverage Determinations (NCDs) and Local Coverage Determinations (LCDs)
- Expandable coverage section with NCD/LCD results, clickable links to CMS website
- Server-side proxy at /api/cms-coverage with 24hr in-memory caching
- Client-side helper (cmsCoverageApi.ts) for future Coverage tab use
- CMS disclaimer on all coverage results

### Fixed
- Procedures button restyled to match Drugs/Trials button pattern (inline sizing, spinner, chevron, disabled state)

### Technical
- New app/api/cms-coverage/route.ts server-side proxy with client-side keyword filtering
- New app/lib/cmsCoverageApi.ts client helper with NCDSummary, LCDSummary, CoverageResults types
- Coverage state variables and handleToggleCoverage added to ResultCard.tsx
- Shield icon (lucide-react) for coverage UI elements


## [1.3.0] - 2026-01-23

### Added - Multi-API Integration (Phase 3)

- OpenFDA drug label API integration
- ClinicalTrials.gov v2 API integration
- Drug cards with brand name, generic name, manufacturer
- Trial cards with NCT ID, title, status, sponsor
- Direct links to full trial details on ClinicalTrials.gov
- Three node types in mind map: ICD (green), Drugs (blue), Trials (purple)
- Edges connecting ICD codes to drugs and trials
- On-demand loading via "View Drugs" and "View Trials" buttons

---


## [2026-02-06] - Medicare Coverage Integration

### Added
- Medicare Coverage button (amber theme) on ResultCard for ICD-10 search results
- CMS API integration searching National Coverage Determinations (NCDs) and Local Coverage Determinations (LCDs)
- Expandable coverage section with NCD/LCD results, clickable links to CMS website
- Server-side proxy at /api/cms-coverage with 24hr in-memory caching
- Client-side helper (cmsCoverageApi.ts) for future Coverage tab use
- CMS disclaimer on all coverage results

### Fixed
- Procedures button restyled to match Drugs/Trials button pattern (inline sizing, spinner, chevron, disabled state)

### Technical
- New app/api/cms-coverage/route.ts server-side proxy with client-side keyword filtering
- New app/lib/cmsCoverageApi.ts client helper with NCDSummary, LCDSummary, CoverageResults types
- Coverage state variables and handleToggleCoverage added to ResultCard.tsx
- Shield icon (lucide-react) for coverage UI elements


## [1.2.0] - 2026-01-22

### Added - Mind Map Visualization (Phase 2)

- React Flow integration for mind map view
- Custom IcdNode component with holographic design
- Category-based gradient colors (A-Z palette)
- Glass morphism and glow effects
- Animated edges with flowing connections
- Radial gradient background
- Zoom and pan controls
- Minimap for navigation
- Stats panel with zoom level and node counts
- Toggle between List View and Mind Map View

---


## [2026-02-06] - Medicare Coverage Integration

### Added
- Medicare Coverage button (amber theme) on ResultCard for ICD-10 search results
- CMS API integration searching National Coverage Determinations (NCDs) and Local Coverage Determinations (LCDs)
- Expandable coverage section with NCD/LCD results, clickable links to CMS website
- Server-side proxy at /api/cms-coverage with 24hr in-memory caching
- Client-side helper (cmsCoverageApi.ts) for future Coverage tab use
- CMS disclaimer on all coverage results

### Fixed
- Procedures button restyled to match Drugs/Trials button pattern (inline sizing, spinner, chevron, disabled state)

### Technical
- New app/api/cms-coverage/route.ts server-side proxy with client-side keyword filtering
- New app/lib/cmsCoverageApi.ts client helper with NCDSummary, LCDSummary, CoverageResults types
- Coverage state variables and handleToggleCoverage added to ResultCard.tsx
- Shield icon (lucide-react) for coverage UI elements


## [1.1.0] - 2026-01-21

### Added - Enhanced Search (Phase 1)

- ClinicalTables API integration for ICD-10 lookup
- Search by condition name or ICD-10 code
- Result cards with code and description
- Recent searches saved to localStorage
- Loading states and error handling
- Responsive grid layout

---


## [2026-02-06] - Medicare Coverage Integration

### Added
- Medicare Coverage button (amber theme) on ResultCard for ICD-10 search results
- CMS API integration searching National Coverage Determinations (NCDs) and Local Coverage Determinations (LCDs)
- Expandable coverage section with NCD/LCD results, clickable links to CMS website
- Server-side proxy at /api/cms-coverage with 24hr in-memory caching
- Client-side helper (cmsCoverageApi.ts) for future Coverage tab use
- CMS disclaimer on all coverage results

### Fixed
- Procedures button restyled to match Drugs/Trials button pattern (inline sizing, spinner, chevron, disabled state)

### Technical
- New app/api/cms-coverage/route.ts server-side proxy with client-side keyword filtering
- New app/lib/cmsCoverageApi.ts client helper with NCDSummary, LCDSummary, CoverageResults types
- Coverage state variables and handleToggleCoverage added to ResultCard.tsx
- Shield icon (lucide-react) for coverage UI elements


## [1.0.0] - 2026-01-20

### Added - Initial Release

- Next.js 15 project setup with App Router
- React 19 and TypeScript 5 configuration
- Tailwind CSS 4 styling
- Basic search interface
- HealthVerity-inspired color palette
- Dark mode support
- Mobile-responsive design

---


## [2026-02-06] - Medicare Coverage Integration

### Added
- Medicare Coverage button (amber theme) on ResultCard for ICD-10 search results
- CMS API integration searching National Coverage Determinations (NCDs) and Local Coverage Determinations (LCDs)
- Expandable coverage section with NCD/LCD results, clickable links to CMS website
- Server-side proxy at /api/cms-coverage with 24hr in-memory caching
- Client-side helper (cmsCoverageApi.ts) for future Coverage tab use
- CMS disclaimer on all coverage results

### Fixed
- Procedures button restyled to match Drugs/Trials button pattern (inline sizing, spinner, chevron, disabled state)

### Technical
- New app/api/cms-coverage/route.ts server-side proxy with client-side keyword filtering
- New app/lib/cmsCoverageApi.ts client helper with NCDSummary, LCDSummary, CoverageResults types
- Coverage state variables and handleToggleCoverage added to ResultCard.tsx
- Shield icon (lucide-react) for coverage UI elements


## Legend

- **Added** — New features
- **Changed** — Changes to existing functionality
- **Deprecated** — Features to be removed in future versions
- **Removed** — Features that have been removed
- **Fixed** — Bug fixes
- **Security** — Security-related changes
