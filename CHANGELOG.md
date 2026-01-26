# Changelog

All notable changes to the ICD Mind Map Lookup Tool will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

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

## [1.1.0] - 2026-01-21

### Added - Enhanced Search (Phase 1)

- ClinicalTables API integration for ICD-10 lookup
- Search by condition name or ICD-10 code
- Result cards with code and description
- Recent searches saved to localStorage
- Loading states and error handling
- Responsive grid layout

---

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

## Legend

- **Added** — New features
- **Changed** — Changes to existing functionality
- **Deprecated** — Features to be removed in future versions
- **Removed** — Features that have been removed
- **Fixed** — Bug fixes
- **Security** — Security-related changes
