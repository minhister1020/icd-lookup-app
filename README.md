# 🏥 ICD Lookup Tool

> **Find medical diagnosis codes, related drugs, and clinical trials — organized by body system**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://icd-lookup-app.vercel.app/)

## 🌐 Live Demo

**👉 [https://icd-lookup-app.vercel.app/](https://icd-lookup-app.vercel.app/)**

Try it now — no installation required!

![ICD Lookup Screenshot](./public/screenshot.png)
*Search results organized by body system with collapsible category sections*

---

## 📋 Overview

The **ICD Lookup Tool** is a modern web application that transforms medical code lookup into an intuitive, organized experience. Search for any medical condition and instantly discover related ICD-10 codes, FDA-approved drugs, and active clinical trials — all organized by body system/disease chapter for easy navigation.

### ✨ What Makes It Unique

- **Category Grouping** — Results organized by ICD-10 chapter (Endocrine, Circulatory, Respiratory, etc.)
- **Multi-API Integration** — Seamlessly combines data from three authoritative medical databases
- **Intelligent Ranking** — Most clinically relevant codes appear first
- **Common Terms Search** — Search with everyday language like "heart attack"
- **Zero Configuration** — No API keys required, works out of the box

---

## 🚀 Features

### 🔍 ICD-10 Code Search
- Search by condition name (e.g., "diabetes", "hypertension")
- Search by ICD-10 code directly (e.g., "E11", "I10")
- **🗣️ Common Terms Translation** — Search with everyday language like "heart attack"
- **🎯 Intelligent Relevance Ranking** — Most clinically useful codes appear first
- Instant results from the National Library of Medicine
- Recent searches saved locally for quick access
- "Load More" button for extended results

### 💊 Drug Information (OpenFDA)
- View FDA-approved drugs for any condition
- Brand names, generic names, and manufacturers
- Indications and usage information
- Warning and safety data

### 🔬 Clinical Trials (ClinicalTrials.gov)
- Find clinical trials across 5+ statuses (Recruiting, Active, Completed, Terminated, Withdrawn)
- **Interactive filter pills** — Toggle status filters with live-updating counts
- NCT IDs with direct links to full trial details
- Trial status, sponsor, and location information
- Eligibility criteria and study summaries
- Up to 15 trials per ICD code with smart defaults

### 📊 Category Grouping (NEW!)
- **21 ICD-10 Chapters** — Results organized by body system/disease type
- **Collapsible Sections** — Accordion-style expand/collapse for each category
- **Color-Coded Borders** — Visual distinction per chapter (Endocrine=green, Circulatory=red, etc.)
- **Chapter Icons** — Heart for Circulatory, Brain for Mental/Nervous, etc.
- **View Toggle** — Switch between Flat (grid) and Grouped (category) views
- **Expand All / Collapse All** — Quick controls for all categories
- **Smart Defaults** — Top category and small categories start expanded

### ⭐ Favorites & History
- **Star favorites** — Save frequently used ICD codes
- **Favorites panel** — Quick access with category colors
- **Search history** — Track searches with timestamps
- **Export/Import** — Backup and share favorites as JSON

### 🎨 UI/UX Features
- Toggle between Flat and Grouped views
- Dark mode support
- Mobile-responsive design
- Loading skeletons and smooth transitions
- HealthVerity-inspired color palette (#00D084 green)
- Full keyboard accessibility (Enter/Space to toggle categories)

---
## 🤖 AI-Powered Drug Validation

The ICD Mind Map includes an intelligent drug validation system that filters treatment options by clinical relevance.

### Features

#### 🎯 Smart Drug Discovery
- **3-Tier Lookup**: Curated mappings → Fallback cache → AI generation (Claude Haiku)
- **Universal Coverage**: Works for ANY condition, not just curated ones
- **Curated Mappings**: 80+ drugs across 25+ conditions (obesity, diabetes, hypertension, etc.)
- **Real-Time Data**: Integrates with NLM's RxNorm API for accurate drug information
- **AI Validation**: Claude Sonnet scores each drug 0-10 based on clinical relevance

#### 🏥 FDA Approval Awareness
- **FDA-Approved Section**: Green badges (score ≥7) for on-label treatments
- **Off-Label Section**: Amber badges (score 4-6) for commonly prescribed off-label uses
- **Clinical Reasoning**: Each drug includes AI-generated explanation for its score

#### ⚡ Performance Optimized
- **Dual Caching**: 24-hour cache on both RxNorm and validation pipeline
- **90% Cost Reduction**: Caching dramatically reduces Claude API calls
- **Smart Deduplication**: Prevents duplicate entries from appearing

### Example: Obesity Treatment Search

**FDA-Approved Treatments (6)**
- ✅ Wegovy (semaglutide) - 10/10
  - "FDA-approved for chronic weight management in adults with obesity"
- ✅ Saxenda (liraglutide) - 10/10
- ✅ Zepbound (tirzepatide) - 10/10
- ✅ Qsymia (phentermine/topiramate) - 10/10
- ✅ Xenical (orlistat) - 10/10
- ✅ Tenuate (diethylpropion) - 9/10

**Off-Label Options (2)**
- ⚠️ Ozempic (semaglutide) - 6/10
  - "FDA-approved for diabetes but commonly used off-label for weight management"
- ⚠️ Mounjaro (tirzepatide) - 6/10

### Architecture
```
User Search (E66.9 - Obesity)
        ↓
1. 3-Tier Drug Lookup
   ├── Tier 1: Curated Mappings (25+ conditions)
   ├── Tier 2: Fallback Cache (24hr AI-generated)
   └── Tier 3: AI Generation (Claude Haiku for any condition)
   → Returns: [Wegovy, Saxenda, Ozempic, ...]
        ↓
2. RxNorm API (with 24hr cache)
   → Fetches: Brand names, generic names, dosage forms
        ↓
3. Claude AI Validation (Sonnet)
   → Scores: 0-10 with clinical reasoning
        ↓
4. Pipeline Filtering (with 24hr cache)
   → Filters: FDA-approved (≥7), Off-label (4-6)
        ↓
5. UI Display
   → Shows: Tiered sections with color-coded badges
```

**Universal Coverage**: Even conditions without curated mappings get drug results via AI fallback.

### Technical Implementation

**Key Files:**
- `app/lib/conditionDrugMappings.ts` - 3-tier drug lookup (curated + cache + AI)
- `app/lib/drugListGenerator.ts` - Claude Haiku AI drug generation
- `app/lib/rxNormApi.ts` - RxNorm REST API integration
- `app/lib/drugRelevanceAgent.ts` - Claude Sonnet AI scoring logic
- `app/lib/drugValidationPipeline.ts` - Orchestration & caching
- `app/api/validate-drugs/route.ts` - Server-side API endpoint

**Environment Variables:**
```env
ANTHROPIC_API_KEY=sk-ant-...  # Required for Claude AI validation
```

**Data Sources:**
- Drug mappings: Manually curated from FDA databases
- Drug details: [RxNorm REST API](https://rxnav.nlm.nih.gov/REST/)
- AI validation: Claude Sonnet 4 via Anthropic API

For detailed technical documentation, see [DRUG_VALIDATION.md](./DRUG_VALIDATION.md)
```

---

### 📄 FILE 3: Create NEW file `DRUG_VALIDATION.md`

**Create a new file in your project root called `DRUG_VALIDATION.md` and paste this entire content:**

[The complete DRUG_VALIDATION.md content I provided above - it's very long, so I'll provide it separately if you want it, or you can copy it from my previous message]

---

## ⚡ QUICK METHOD: Use Cursor to Create These

**Or paste this into Cursor to do it automatically:**
```
Create comprehensive documentation for the drug validation system

Create/update these 3 documentation files:

1. CHANGELOG.md - Add new version entry at the top
2. README.md - Add AI-Powered Drug Validation section
3. DRUG_VALIDATION.md - Create new technical documentation file

Use the exact content I'll provide in the next message.

After creating/updating files:
- Verify formatting is correct
- Check all links work
- Commit with: "docs: Add comprehensive drug validation system documentation"
## 🗣️ Common Terms Translation (Phase 5)

Search using **everyday language** and get professional medical results! The app automatically translates 85+ common terms to their medical equivalents.

### How It Works

```
User types: "heart attack"
     ↓
Translates to: "myocardial infarction"
     ↓
Returns: I21.9, I21.3, I21.4... (heart attack codes)
     ↓
Shows badge: "💡 Showing results for 'myocardial infarction'"
```

### Example Translations

| You Search | We Search | ICD Codes |
|------------|-----------|-----------|
| heart attack | myocardial infarction | I21.* |
| stroke | cerebral infarction | I63.* |
| broken bone | fracture | S.* |
| high blood pressure | hypertension | I10.* |
| flu | influenza | J09.* |
| heartburn | gastroesophageal reflux | K21.* |
| UTI | urinary tract infection | N39.* |
| anxiety attack | panic disorder | F41.0 |

### Categories Covered (85+ Terms)

| Category | Terms | Examples |
|----------|-------|----------|
| **Cardiovascular** | 18 | heart attack, stroke, high blood pressure |
| **Respiratory** | 14 | flu, cold, pneumonia, asthma attack |
| **Musculoskeletal** | 14 | broken bone, sprain, arthritis, back pain |
| **Gastrointestinal** | 12 | heartburn, stomach flu, food poisoning |
| **Mental Health** | 10 | anxiety attack, depression, panic attack |
| **Neurological** | 8 | migraine, seizure, dizziness |
| **Dermatological** | 5 | rash, hives, eczema |
| **And more...** | 4+ | UTI, kidney stones, etc. |

### Smart Features

- **Case-insensitive** — "HEART ATTACK" and "heart attack" both work
- **Partial matching** — "my heart attack symptoms" finds "heart attack"
- **Dual search** — Searches both medical term AND original for best coverage
- **Educational** — Badge shows what medical term was used

### Search Tips Tooltip

Click the ℹ️ icon in the search bar to see tips:
- Use common terms like "heart attack" or "broken bone"
- Use medical terms like "myocardial infarction"
- Use ICD codes like "E11.9" or "I21"

---

## 📊 Category Grouping (Phase 7A)

Organize search results by ICD-10 chapter for easier navigation!

### How It Works

```
Search "diabetes":
     ↓
Results grouped into categories:
     ↓
┌─────────────────────────────────────────────────────────────┐
│ 25 results in 3 categories                                  │
│                                                             │
│ ▼ 💚 Endocrine (18 results)                                │
│   ├── E11.9   Type 2 diabetes mellitus...    🔥 Top Match  │
│   ├── E11.65  Type 2 diabetes with hyperglycemia           │
│   └── E10.9   Type 1 diabetes mellitus...                  │
│                                                             │
│ ▶ ❤️ Circulatory (5 results)                               │
│      I25.10, I25.84, I79.2...                              │
│                                                             │
│ ▶ 📋 Health Factors (2 results)                            │
│      Z13.1, Z86.32                                         │
└─────────────────────────────────────────────────────────────┘
```

### ICD-10 Chapters (21 Total)

| Chapter | Code Range | Icon | Color |
|---------|------------|------|-------|
| Infectious | A00-B99 | 🦠 | Red |
| Neoplasms | C00-D49 | ⭕ | Pink |
| Blood | D50-D89 | 💧 | Rose |
| **Endocrine** | E00-E89 | 📈 | Emerald |
| Mental | F01-F99 | 🧠 | Violet |
| Nervous | G00-G99 | 🧠 | Purple |
| Eye | H00-H59 | 👁️ | Cyan |
| Ear | H60-H95 | 👂 | Teal |
| **Circulatory** | I00-I99 | ❤️ | Red |
| **Respiratory** | J00-J99 | 💨 | Sky |
| Digestive | K00-K95 | 🍴 | Amber |
| Skin | L00-L99 | 👕 | Orange |
| Musculoskeletal | M00-M99 | 🦴 | Lime |
| Genitourinary | N00-N99 | ⭕ | Fuchsia |
| Pregnancy | O00-O9A | 👶 | Pink |
| Perinatal | P00-P96 | 👶 | Blue |
| Congenital | Q00-Q99 | 🧬 | Indigo |
| Symptoms | R00-R99 | 🩺 | Slate |
| Injuries | S00-T88 | 🩹 | Yellow |
| External Causes | V00-Y99 | 🚗 | Gray |
| Health Factors | Z00-Z99 | 📋 | Green |

### Features

| Feature | Description |
|---------|-------------|
| **Collapsible** | Click category header to expand/collapse |
| **Smart Defaults** | First category + categories with ≤3 results start expanded |
| **Expand/Collapse All** | Quick controls for bulk operations |
| **View Toggle** | Switch between Flat (grid) and Grouped views |
| **Preserved State** | Expand/collapse choices maintained during Load More |
| **Category Sorting** | Most relevant category (highest scoring result) appears first |

### Accessibility

- **Keyboard Navigation** — Enter/Space to toggle categories
- **ARIA Attributes** — `aria-expanded`, `aria-controls`, `role="button"`
- **Focus States** — Visible focus ring for keyboard users
- **Screen Reader Friendly** — Proper labeling and structure

---

## ⭐ Favorites & History (Phase 6)

Save frequently used ICD codes and track your search history with timestamps!

### Favorites System

Click the **star icon** on any search result to save it:

```
┌──────────────────────────────────────────────────────┐
│  [E11.9] Type 2 diabetes mellitus...            [⭐] │  ← Click star to favorite
└──────────────────────────────────────────────────────┘
```

#### Features
- **Star/Unstar** — One-click toggle on any result card
- **Favorites Panel** — Slide-in panel with all saved codes
- **Category Colors** — Visual coding by ICD category (E=green, I=red, etc.)
- **Relative Timestamps** — "Just now", "2 hours ago", "Yesterday"
- **Quick Search** — Click to search any saved favorite
- **Persistence** — Saved to localStorage (survives refresh)

### Export/Import

Back up your favorites or share with colleagues!

| Action | Description |
|--------|-------------|
| **Export** | Download as JSON file (`icd-favorites-2026-01-26.json`) |
| **Import** | Load from JSON file, merges with existing (no duplicates) |

#### Export Format
```json
{
  "version": "1.0",
  "exportDate": "2026-01-26T10:30:00.000Z",
  "appName": "ICD Mind Map Lookup Tool",
  "count": 5,
  "favorites": [
    { "code": "E11.9", "name": "Type 2 diabetes...", ... }
  ]
}
```

### Search History

Track what you've searched with rich metadata:

```
┌────────────────────────────────────────────────────┐
│ 🕐 Search History (5)                         [✕] │
├────────────────────────────────────────────────────┤
│ [🔍] diabetes                          [🔍] [🗑️] │
│      ⏱️ 2 minutes ago • # 847 results             │
│      Top: E11.9 - Type 2 diabetes...              │
└────────────────────────────────────────────────────┘
```

#### Features
- **Timestamps** — When each search was performed
- **Result Counts** — How many results returned
- **Top Result Preview** — Quick reference to best match
- **Re-Search** — Click to run the search again
- **Clear History** — Remove individual or all entries

---

## 🎯 Intelligent Search Ranking (Phase 4)

Unlike traditional medical code databases that return results alphabetically, ICD Mind Map uses a **multi-factor relevance algorithm** to show the most clinically useful codes first.

### How It Works

Results are scored using four factors (100 points max):

| Factor | Weight | Description |
|--------|--------|-------------|
| **Keyword Match** | 35% | How well the condition name matches your search |
| **Code Popularity** | 40% | Based on real healthcare utilization data (100+ common codes) |
| **Specificity** | 15% | Balances general vs. highly-specific codes |
| **Exactness** | 10% | Bonus for direct code searches (e.g., "E11") |

### Example: Search "diabetes"

**Before (Alphabetical):**
```
E08.0 → E08.01 → E08.10 → E08.11 → E09.0...
(Rare codes first!)
```

**After (Relevance-Ranked):**
```
E11.9  (81 pts) 🔥 Type 2 diabetes, unspecified — Most common
E11.65 (76 pts) 🔥 Type 2 diabetes with hyperglycemia
E10.9  (72 pts) 🔥 Type 1 diabetes, unspecified
E08.0  (55 pts)    Diabetes due to underlying condition...
```

### Relevance Badges

- 🔥 **Top Match** — Appears on positions 1-3
- ✓ **Relevant** — Appears on positions 4-10 with score ≥70

### Performance

- Scores 50 results in **< 1ms** (target: < 10ms)
- Zero latency impact on search

### Data Sources

Popularity scores are based on:
- MEPS (Medical Expenditure Panel Survey)
- CMS Medicare claims data
- Primary care utilization studies
- All-payer claims databases

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| [Next.js 15](https://nextjs.org/) | React framework with App Router |
| [React 19](https://react.dev/) | UI component library |
| [TypeScript 5](https://www.typescriptlang.org/) | Type-safe JavaScript |

### Styling & Components
| Technology | Purpose |
|------------|---------|
| [Tailwind CSS 4](https://tailwindcss.com/) | Utility-first CSS |
| [Lucide React](https://lucide.dev/) | Beautiful icon set |
| Custom Components | ResultCard, DrugCard, TrialCard, etc. |

### APIs (No Keys Required!)
| API | Purpose | Rate Limit |
|-----|---------|------------|
| [ClinicalTables](https://clinicaltables.nlm.nih.gov/) | ICD-10 code lookup | Unlimited |
| [OpenFDA](https://open.fda.gov/) | Drug label data | 240/min, 120K/day |
| [ClinicalTrials.gov](https://clinicaltrials.gov/) | Clinical trial data | Reasonable use |

### State Management
- React `useState` and `useEffect` hooks
- `useCallback` for memoized handlers
- `Map` data structures for drug/trial caching
- `localStorage` for preferences persistence

---

## 🏁 Getting Started

### Prerequisites

- **Node.js** 18.17 or later
- **npm** or **yarn** package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/icd-lookup-app.git
   cd icd-lookup-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

### Build for Production

```bash
npm run build
npm run start
```

### Environment Variables

No environment variables required! All APIs are publicly accessible.

---

## 📖 Usage

### Searching for Conditions

1. Enter a condition name or ICD-10 code in the search bar
2. Press **Enter** or click the **Search** button
3. View results as cards in the grid

```
Example searches:
• "diabetes" → Returns all diabetes-related ICD codes
• "E11" → Returns Type 2 diabetes codes
• "heart failure" → Returns cardiac-related codes
```

### Viewing Drugs & Trials

1. Click **View Drugs** (blue button) on any result card
2. Expand the drug section to see FDA-approved medications
3. Click **View Trials** (purple button) to see clinical trials
4. Click any NCT ID to open the full trial on ClinicalTrials.gov

### Using Category Grouping

1. Search for a condition (e.g., "diabetes")
2. Results appear grouped by body system/disease chapter
3. Toggle between **Flat** (grid) and **Grouped** views
4. Click category headers to expand/collapse sections
5. Use **Expand All** / **Collapse All** for bulk operations

**Category Colors:**
- 💚 **Emerald** = Endocrine (diabetes, thyroid)
- ❤️ **Red** = Circulatory (heart, blood pressure)
- 💙 **Sky** = Respiratory (lung, breathing)
- 💜 **Purple** = Mental/Nervous (brain, psychology)

**Keyboard Shortcuts:**
- **Enter / Space** = Toggle category expand/collapse
- **Tab** = Navigate between categories

---

## 📁 Project Structure

```
icd-lookup-app/
├── app/
│   ├── components/
│   │   ├── SearchBar.tsx        # Search input with recent searches
│   │   ├── SearchResults.tsx    # Results container with view toggle (Flat/Grouped)
│   │   ├── ResultCard.tsx       # ICD result card with star & drug/trial expansion
│   │   ├── CategorySection.tsx  # Collapsible category section (Phase 7A)
│   │   ├── DrugCard.tsx         # Individual drug display (blue theme)
│   │   ├── TrialCard.tsx        # Individual trial display (purple theme)
│   │   ├── FavoritesPanel.tsx   # Favorites slide-in panel (Phase 6)
│   │   └── HistoryPanel.tsx     # History slide-in panel (Phase 6)
│   ├── lib/
│   │   ├── api.ts               # ClinicalTables API helper (with translation)
│   │   ├── chapterMapping.ts    # ICD-10 chapter lookup (21 chapters) (Phase 7A)
│   │   ├── grouping.ts          # Grouping algorithm & helpers (Phase 7A)
│   │   ├── openFdaApi.ts        # OpenFDA API helper
│   │   ├── clinicalTrialsApi.ts # ClinicalTrials.gov API helper
│   │   ├── scoring.ts           # Relevance scoring algorithm (Phase 4)
│   │   ├── commonCodes.ts       # ICD-10 frequency data (100+ codes)
│   │   ├── termMappings.ts      # Common → Medical term mappings (Phase 5)
│   │   ├── termMapper.ts        # Translation logic (Phase 5)
│   │   └── favoritesStorage.ts  # Favorites & History localStorage utils (Phase 6)
│   ├── types/
│   │   └── icd.ts               # TypeScript interfaces & helpers
│   ├── globals.css              # Global styles & animations
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Main page with state management
├── public/
│   └── screenshot.png           # README screenshot
├── PLAN.md                      # Development plan & progress
├── AGENTS.md                    # AI assistant guidelines
├── CHANGELOG.md                 # Version history & release notes
└── README.md                    # This file
```

---

## 📡 API Documentation

### ClinicalTables API (ICD-10)

```
GET https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search
```

| Parameter | Description |
|-----------|-------------|
| `terms` | Search query |
| `sf` | Search fields (code, name) |
| `maxList` | Max results (default: 20) |

**Response Format:** `[count, codes[], null, names[][]]`

### OpenFDA API (Drug Labels)

```
GET https://api.fda.gov/drug/label.json
```

| Parameter | Description |
|-----------|-------------|
| `search` | Query (indications_and_usage field) |
| `limit` | Max results (default: 5) |

**Rate Limits:** 240 requests/minute, 120,000 requests/day

### ClinicalTrials.gov API v2

```
GET https://clinicaltrials.gov/api/v2/studies
```

| Parameter | Description |
|-----------|-------------|
| `query.cond` | Condition search |
| `filter.overallStatus` | Filter by status (RECRUITING) |
| `pageSize` | Max results |

**Rate Limits:** No official limit, but use responsibly

---

## 🗺️ Roadmap

### Completed Features

- [x] **Clinical Trials Filtering** — Filter trials by status with interactive pills (Phase 9)
- [x] **Category Grouping** — Results organized by ICD-10 chapter with collapsible sections (Phase 7A)
- [x] **Favorites & History** — Save codes, track searches, export/import JSON (Phase 6)
- [x] **Common Terms Translation** — Search with everyday language (Phase 5)
- [x] **Intelligent Ranking** — Multi-factor relevance scoring (Phase 4)
- [x] **Pagination** — Load more results with "Load More" button
- [x] **Multi-API Integration** — ICD-10, OpenFDA, ClinicalTrials.gov

### Planned Features

- [ ] **Chapter Filters** — Filter ICD results by specific chapter
- [ ] **Sharing** — Generate shareable links to searches
- [ ] **Offline Mode** — Cache data for offline access
- [ ] **Advanced Filters** — Filter by code range, date, status
- [ ] **Comparison View** — Compare multiple conditions side-by-side
- [ ] **AI Insights** — Natural language summaries of conditions

### Technical Improvements

- [ ] Add unit tests with Jest/Testing Library
- [ ] Add E2E tests with Playwright
- [ ] Implement error boundary components
- [ ] Add service worker for caching
- [ ] Optimize bundle size with dynamic imports

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Style

- Use TypeScript strict mode
- Follow ESLint configuration
- Use Tailwind CSS for styling
- Add JSDoc comments for complex functions
- Keep components focused and reusable

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 Bobby (minhister1020)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 👤 Author

**Bobby (minhister1020)**

- 🏢 HealthVerity AI Solutions Specialist
- 🔗 [LinkedIn](https://www.linkedin.com/in/yourprofile)
- 🐙 [GitHub](https://github.com/yourusername)
- 📧 minhister1020@example.com

---

## 🙏 Acknowledgments

### APIs & Data Sources
- [National Library of Medicine](https://www.nlm.nih.gov/) — ClinicalTables ICD-10 data
- [U.S. Food & Drug Administration](https://open.fda.gov/) — OpenFDA drug information
- [ClinicalTrials.gov](https://clinicaltrials.gov/) — Clinical trial registry

### Libraries & Tools
- [Next.js](https://nextjs.org/) — The React framework for production
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS framework
- [Lucide Icons](https://lucide.dev/) — Beautiful open-source icons
- [Vercel](https://vercel.com/) — Deployment platform

### Inspiration
- HealthVerity's commitment to healthcare data innovation
- Modern medical dashboards and organized data visualization
- ICD-10 chapter organization for clinical clarity

---

<div align="center">

**Built with ❤️ for the healthcare community**

*Transforming medical data into visual insights*

</div>
