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
- Instant results from the National Library of Medicine
- Recent searches saved locally for quick access

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
- Hierarchical layout with clear relationships
- Drag, zoom, and pan navigation
- Hover tooltips with detailed information
- Animated edges showing data connections
- Real-time node counter and zoom indicator

### 🎨 UI/UX Features
- Toggle between List View and Mind Map View
- Dark mode support
- Mobile-responsive design
- Loading skeletons and smooth transitions
- HealthVerity-inspired color palette (#00D084 green)
- Glass-morphism and gradient effects

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
2. **Drag** nodes to rearrange the layout
3. **Scroll** to zoom in/out
4. **Hover** over any node for details
5. Load drugs/trials in List view to see them in the Mind Map

**Node Colors:**
- 🟢 **Green** = ICD-10 Codes (primary nodes)
- 🔵 **Blue** = Drugs (connected to ICD codes)
- 🟣 **Purple** = Clinical Trials (connected to ICD codes)

---

## 📁 Project Structure

```
icd-lookup-app/
├── app/
│   ├── components/
│   │   ├── SearchBar.tsx       # Search input with recent searches
│   │   ├── SearchResults.tsx   # Results container with view toggle
│   │   ├── ResultCard.tsx      # ICD result card with drug/trial expansion
│   │   ├── DrugCard.tsx        # Individual drug display (blue theme)
│   │   ├── TrialCard.tsx       # Individual trial display (purple theme)
│   │   ├── ViewToggle.tsx      # List/Mind Map view switcher
│   │   ├── MindMapView.tsx     # React Flow canvas with multi-node support
│   │   ├── IcdNode.tsx         # Custom React Flow node (green)
│   │   ├── DrugNode.tsx        # Custom React Flow node (blue)
│   │   └── TrialNode.tsx       # Custom React Flow node (purple)
│   ├── lib/
│   │   ├── api.ts              # ClinicalTables API helper
│   │   ├── openFdaApi.ts       # OpenFDA API helper
│   │   └── clinicalTrialsApi.ts # ClinicalTrials.gov API helper
│   ├── types/
│   │   └── icd.ts              # TypeScript interfaces & helpers
│   ├── globals.css             # Global styles & animations
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Main page with state management
├── public/
│   └── screenshot.png          # README screenshot
├── PLAN.md                     # Development plan & progress
├── AGENTS.md                   # AI assistant guidelines
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

### Planned Features

- [ ] **Pagination** — Load more results for large datasets
- [ ] **Export** — Save mind map as PNG/SVG image
- [ ] **Sharing** — Generate shareable links to searches
- [ ] **Favorites** — Save frequently used codes
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
