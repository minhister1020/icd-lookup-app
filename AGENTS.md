# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Common commands

### Install dependencies
- `npm install`
- Clean install from lockfile (CI-like): `npm ci`

### Run the app locally
- Dev server (hot reload): `npm run dev`
  - App will be available at `http://localhost:3000`

### Build + run production server
- Build: `npm run build`
- Start (serves `.next/` build output): `npm run start`

### Lint
- Lint whole repo: `npm run lint`
- Lint a single file (example): `npx eslint app/page.tsx`

### Typecheck
- There is no dedicated `typecheck` script; run TypeScript directly:
  - `npx tsc --noEmit`

### Tests
- No test runner/scripts are currently configured in `package.json`.

## High-level architecture

### Framework + routing
- This is a Next.js project using the **App Router**.
- Routes are defined by the filesystem under `app/`:
  - `app/layout.tsx` is the root layout (HTML shell, global styles, metadata).
  - `app/page.tsx` is the `/` route.

### Styling
- Global CSS lives in `app/globals.css` and is imported by `app/layout.tsx`.
- Tailwind CSS is enabled via PostCSS:
  - `postcss.config.mjs` registers `@tailwindcss/postcss`.
  - `app/globals.css` uses `@import "tailwindcss"` (Tailwind v4 style).

### Static assets
- Static files in `public/` are served at the site root (e.g. `public/vercel.svg` -> `/vercel.svg`).

### Tooling conventions
- TypeScript is in strict mode (`tsconfig.json`), and the alias `@/*` maps to the repo root.
- ESLint uses the flat config in `eslint.config.mjs` with `eslint-config-next` (core-web-vitals + TypeScript).