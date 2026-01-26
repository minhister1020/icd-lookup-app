# 🏥 ICD Mind Map Lookup Tool

> **Find medical diagnosis codes, related drugs, and clinical trials — all in one interactive visualization**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![React Flow](https://img.shields.io/badge/React_Flow-12-FF0072?logo=react)](https://reactflow.dev/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://icd-lookup-app.vercel.app/)

## 🌐 Live Demo

**👉 [https://icd-lookup-app.vercel.app/](https://icd-lookup-app.vercel.app/)**

Try it now — no installation required!

![ICD Mind Map Screenshot](./public/screenshot.png)
*Interactive mind map visualization showing ICD codes, related drugs, and clinical trials*

---

## 📋 Overview

The **ICD Mind Map Lookup Tool** is a modern web application that transforms medical code lookup into an intuitive, visual experience. Search for any medical condition and instantly discover related ICD-10 codes, FDA-approved drugs, and active clinical trials — all presented in a beautiful, interactive mind map.

### ✨ What Makes It Unique

- **Multi-API Integration** — Seamlessly combines data from three authoritative medical databases
- **Visual Discovery** — Transform dry medical codes into an explorable knowledge graph
- **Futuristic Design** — Tony Stark-inspired holographic UI with smooth animations
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
- Find actively recruiting clinical trials
- NCT IDs with direct links to full trial details
- Trial status, sponsor, and location information
- Eligibility criteria and study summaries

### 🗺️ Interactive Mind Map Visualization
- **Three Node Types**: ICD codes (green), Drugs (blue), Trials (purple)
- **🎯 Click-to-Expand** — Progressive disclosure of drug/trial connections
- **✨ Hover Highlighting** — See connections light up on hover
- **🎯 Focus Mode** — Click to spotlight one branch, dim the rest
- **🎨 Multiple Layouts** — Hierarchical, Radial, and Circular views
- Drag, zoom, and pan navigation
- Hover tooltips with detailed information
- Animated edges showing data connections
- Real-time node counter and zoom indicator

### ⭐ Favorites & History (NEW!)
- **Star favorites** — Save frequently used ICD codes
- **Favorites panel** — Quick access with category colors
- **Search history** — Track searches with timestamps
- **Export/Import** — Backup and share favorites as JSON

### 🎨 UI/UX Features
- Toggle between List View and Mind Map View
- Dark mode support
- Mobile-responsive design
- Loading skeletons and smooth transitions
- HealthVerity-inspired color palette (#00D084 green)
- Glass-morphism and gradient effects

---

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

## 🗺️ Interactive Mind Map (Phase 7)

Transform your search results into a visual knowledge graph with powerful interactive features!

### Click-to-Expand (Phase 7A)

Nodes start collapsed — click to reveal connected drugs and trials:

```
Before:                         After clicking ⊕:

  [E11.9]                         [E11.9]
    │                                │
  [⊕ +3💊 +2🧪]                ├── [Metformin] 💊
                                    ├── [Glipizide] 💊
                                    ├── [Jardiance] 💊
                                    ├── [NCT001234] 🧪
                                    └── [NCT005678] 🧪
```

**Features:**
- **Badge Preview** — See `+3💊 +2🧪` before expanding
- **Expand All / Collapse All** — Quick toggle for all nodes
- **Progressive Disclosure** — Keep the mind map clean and focused

### Hover Highlighting (Phase 7B)

Hover over any node to see its connections light up:

```
Hover [E11.9]:
- E11.9 and connected drugs/trials → 100% opacity
- Everything else → 30% opacity (dimmed)
- Connected edges → thicker and brighter
```

**Features:**
- Instant visual feedback
- Works on ICD codes, drugs, and trials
- Smooth 200ms transitions

### Focus Mode (Phase 7C)

Click any node to enter Focus Mode for detailed exploration:

```
┌──────────────────────────────────────────────────┐
│ 🎯 FOCUS MODE │ E11.9 │ 4 nodes │ [✕]          │
│ Click background or another node to change      │
└──────────────────────────────────────────────────┘

Focused branch → 100% opacity with glow ring
Everything else → 15% opacity (heavily dimmed)
```

**Features:**
- Click node to focus, click again to exit
- Click background to exit focus
- Focus badge shows node code and connection count
- Deeper dimming than hover for clear isolation

### Multiple Layouts (Phase 7D)

Switch between three layout algorithms:

| Layout | Icon | Best For |
|--------|------|----------|
| **Hierarchical** | 📊 Tree | Clear parent-child relationships |
| **Radial** | ☀️ | Centering on key nodes |
| **Circular** | 🔵 | Comparing many nodes at once |

```
Hierarchical:                 Radial:                    Circular:

   [ICD-1]──[ICD-2]              [Drug]                    [ICD-1]
      │        │               ╱       ╲                 ╱        ╲
   [Drug]   [Trial]        [ICD-1]──[ICD-2]          [Drug]    [Trial]
                               ╲       ╱                 ╲        ╱
                              [Trial]                    [ICD-2]
```

**Features:**
- **One-click switching** — Layout selector in top-left panel
- **Smooth transitions** — Animated position changes (500ms)
- **Persistent choice** — Layout saved to localStorage
- **Works with all features** — Expand, hover, and focus work in all layouts

### Mind Map Controls

```
┌────────────────────────────────────────────────────────────────┐
│ Layout: [📊 Tree ✓] [☀️ Radial] [🔵 Circle]                   │
├────────────────────────────────────────────────────────────────┤
│ [⊕ Expand All] [⊖ Collapse All] │ 3/5 expanded │ [?]          │
└────────────────────────────────────────────────────────────────┘
```

### Stats Panel

Real-time statistics in the top-right corner:

```
┌───────────────────────┐
│ ZOOM: 125%            │
├───────────────────────┤
│ NODES                 │
│ • ICD Codes     5     │
│ • Drugs         3/10  │ ← 3 visible, 10 loaded
│ • Trials        2/8   │
│ ────────────────      │
│   Visible       10/23 │
└───────────────────────┘
```

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
| [React Flow 12](https://reactflow.dev/) | Mind map visualization |

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

### Using the Mind Map

1. Toggle to **Mind Map** view using the view switcher
2. **Load Data** — Click "View Drugs" or "View Trials" in List view first
3. **Expand Nodes** — Click the ⊕ button on ICD codes to show connections
4. **Hover** — Mouse over nodes to highlight connections
5. **Focus** — Click any node to spotlight that branch
6. **Switch Layouts** — Try Hierarchical, Radial, or Circular views
7. **Navigate** — Drag nodes, scroll to zoom, use minimap

**Node Colors:**
- 🟢 **Green** = ICD-10 Codes (primary nodes)
- 🔵 **Blue** = Drugs (connected to ICD codes)
- 🟣 **Purple** = Clinical Trials (connected to ICD codes)

**Keyboard Shortcuts:**
- **Scroll** = Zoom in/out
- **Click + Drag** = Pan the canvas
- **Click node** = Focus mode (click again to exit)
- **Click background** = Exit focus mode

---

## 📁 Project Structure

```
icd-lookup-app/
├── app/
│   ├── components/
│   │   ├── SearchBar.tsx       # Search input with recent searches
│   │   ├── SearchResults.tsx   # Results container with view toggle
│   │   ├── ResultCard.tsx      # ICD result card with star & drug/trial expansion
│   │   ├── DrugCard.tsx        # Individual drug display (blue theme)
│   │   ├── TrialCard.tsx       # Individual trial display (purple theme)
│   │   ├── ViewToggle.tsx      # List/Mind Map view switcher
│   │   ├── MindMapView.tsx     # React Flow canvas with layouts & interactions (Phase 7)
│   │   ├── IcdNode.tsx         # Custom React Flow node with expand button (green)
│   │   ├── DrugNode.tsx        # Custom React Flow node with highlighting (blue)
│   │   ├── TrialNode.tsx       # Custom React Flow node with highlighting (purple)
│   │   ├── FavoritesPanel.tsx  # Favorites slide-in panel (Phase 6)
│   │   └── HistoryPanel.tsx    # History slide-in panel (Phase 6)
│   ├── lib/
│   │   ├── api.ts              # ClinicalTables API helper (with translation)
│   │   ├── openFdaApi.ts       # OpenFDA API helper
│   │   ├── clinicalTrialsApi.ts # ClinicalTrials.gov API helper
│   │   ├── scoring.ts          # Relevance scoring algorithm (Phase 4)
│   │   ├── commonCodes.ts      # ICD-10 frequency data (100+ codes)
│   │   ├── termMappings.ts     # Common → Medical term mappings (Phase 5)
│   │   ├── termMapper.ts       # Translation logic (Phase 5)
│   │   └── favoritesStorage.ts # Favorites & History localStorage utils (Phase 6)
│   ├── types/
│   │   └── icd.ts              # TypeScript interfaces & helpers
│   ├── globals.css             # Global styles & animations
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Main page with state management
├── public/
│   └── screenshot.png          # README screenshot
├── PLAN.md                     # Development plan & progress
├── AGENTS.md                   # AI assistant guidelines
├── CHANGELOG.md                # Version history & release notes
└── README.md                   # This file
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

- [x] **Interactive Mind Map** — Click-to-expand, hover highlighting, focus mode, multiple layouts (Phase 7)
- [x] **Favorites & History** — Save codes, track searches, export/import JSON (Phase 6)
- [x] **Common Terms Translation** — Search with everyday language (Phase 5)
- [x] **Intelligent Ranking** — Multi-factor relevance scoring (Phase 4)
- [x] **Pagination** — Load more results with "Load More" button
- [x] **Multi-API Integration** — ICD-10, OpenFDA, ClinicalTrials.gov

### Planned Features

- [ ] **Force-Directed Layout** — Physics-based organic node positioning
- [ ] **Mind Map Export** — Save mind map as PNG/SVG image
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
- [React Flow](https://reactflow.dev/) — Powerful node-based graph library
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS framework
- [Lucide Icons](https://lucide.dev/) — Beautiful open-source icons
- [Vercel](https://vercel.com/) — Deployment platform

### Inspiration
- HealthVerity's commitment to healthcare data innovation
- Tony Stark's holographic interfaces from Iron Man
- Modern medical dashboards and visualization tools

---

<div align="center">

**Built with ❤️ for the healthcare community**

*Transforming medical data into visual insights*

</div>
