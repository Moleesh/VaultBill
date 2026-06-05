<!-- @format -->

# VaultBill ✨

VaultBill is a JSON-first, offline-capable billing, invoicing, reporting, PDF,
and print platform built to feel calm, predictable, and ready to grow 😊

> The implementation follows `VaultBill_Final_Spec_v9.md` in phase order. The
> current completed scope is Phase 20, and the codebase, tests, and docs all
> reflect that state.

## What VaultBill Is 🌟

VaultBill is designed as a single product foundation for teams that want:

- A responsive SPA shell with a desktop-friendly Electron companion
- JSON-led configuration for document formats, reports, printer profiles, and
  optional integrations
- Offline-capable local data handling with SQLite-backed startup patching
- Strong TypeScript guarantees, SCSS theming, and a clean modular structure
- A release pipeline that produces both web deployment artifacts and desktop
  installer builds

## Why It Feels Nice To Work With 😊

- The app starts from one `APP_NAME` value, so branding stays simple
- Five built-in themes keep the UI visually distinct without custom styling
- Operator-aware permissions and document-format fallback logic are built in
- Print, PDF, record, report, backup, and Local API seams are already wired
- Optional integration contracts exist for SMS, GST helpers, signature pad, and
  GSP hooks without pretending they guarantee compliance
- GitHub Pages deployment is automatic, so the web build stays easy to publish

## Quick Start 🚀

```powershell
npm install
npm run dev
```

Then open the local app at `http://127.0.0.1:5173/`.

If you want the Electron shell too:

```powershell
npm run dev:electron
```

## Useful Scripts 🛠️

### Day-to-day

| Command                | What it does                                 |
| ---------------------- | -------------------------------------------- |
| `npm run dev`          | Starts the Vite dev server for the web app   |
| `npm run dev:electron` | Runs the web app and Electron shell together |
| `npm run preview`      | Serves the production web build locally      |
| `npm run format:check` | Checks formatting with Prettier              |
| `npm run lint`         | Runs ESLint with zero warnings allowed       |
| `npm run typecheck`    | Runs TypeScript checks for web and Electron  |
| `npm run test`         | Runs the Vitest suite once                   |
| `npm run test:ci`      | Runs Vitest in CI-friendly serial mode       |

### Build and release

| Command                             | What it does                                      |
| ----------------------------------- | ------------------------------------------------- |
| `npm run build:web`                 | Builds the web bundle                             |
| `npm run build:electron`            | Builds the Electron TypeScript output             |
| `npm run build:desktop`             | Builds the web app and Electron output together   |
| `npm run rebuild:native`            | Rebuilds optional native modules for Electron     |
| `npm run package:desktop`           | Creates an unpacked desktop package in `release/` |
| `npm run package:desktop:installer` | Creates platform installer artifacts              |
| `npm run smoke:installer`           | Verifies the packaged desktop output              |
| `npm run smoke:first-run-db`        | Checks first-run database startup patches         |
| `npm run release:notes`             | Generates `artifacts/release-notes.md`            |
| `npm run release:desktop`           | Runs the full desktop release flow                |

## Branding And Build Identity 🎨

VaultBill uses one build-time name variable:

```powershell
$env:APP_NAME = 'Acme Billing'
npm run build:desktop
```

If `APP_NAME` is blank or missing, VaultBill is used as the fallback name.

For GitHub Pages builds, the app is published under the `/VaultBill/` subpath.
The production build and the Pages workflow are aligned with that base path, and
the app includes a redirect so stray URLs fall back to the canonical home page.

## Automation And Deployment 🤖

- `Build Release Files` packages the desktop release files and runs the release
  validation flow when dispatched manually.
- `GitHub Pages` automatically deploys the web build on pushes to `main`.
- The Pages workflow uses the `VaultBill` GitHub Pages environment name.
- A `public/404.html` fallback keeps GitHub Pages navigation friendly.

## What’s Inside The App 📘

VaultBill already includes the core foundations for:

- SQLite startup patching and schema recovery
- Operator accounts, roles, and permission-aware navigation
- Document-format selection, validation, and fallback handling
- Dynamic line-item behavior and formula evaluation
- Saved records, reprints, cancellations, and finalization workflows
- Print template sanitization, PDF planning, and printer profile selection
- CSV / TSV import previews and bulk print planning
- Reports, exports, backup packages, and restore validation
- Runtime branding, company settings, and DB-backed app assets
- Keyboard shortcuts, responsive layout metadata, and reusable feedback states

## Project Notes 💡

- The implementation source of truth is `docs/Spec.md`
- The release pipeline details live in `docs/ReleasePipeline.md`
- GitHub Pages is the web publishing target for the SPA build
- The Electron release flow is separated from the Pages deployment flow so each
  workflow stays focused and easy to reason about

## A Tiny Promise 😊

This repo is meant to stay phase-ordered, test-backed, and pleasantly boring in
the best possible way. No hidden magic, no surprise build steps, and no
guesswork about where the code lives.

If you’re here to extend VaultBill, you’re in the right place. Let’s keep it
smooth, colorful, and reliable ✨
