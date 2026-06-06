# VaultBill ✨

VaultBill is a JSON-first, offline-capable billing, invoicing, reporting, PDF,
and print platform built around two clearly separated flows:

- A GitHub Pages demo that stays browser-only and secret-free
- A full desktop app that keeps data local in SQLite and uses the local API

> The implementation follows `VaultBill_Final_Spec_v23.md`. The routed product
> shell, platform capability model, shared overlays, automated quality gates,
> desktop releases, and GitHub Pages demo deployment reflect that plan.

[![Demo Deploy](https://img.shields.io/github/actions/workflow/status/Moleesh/VaultBill/demo-pages.yml?branch=main)](https://github.com/Moleesh/VaultBill/actions/workflows/demo-pages.yml)
[![Desktop Release](https://img.shields.io/github/actions/workflow/status/Moleesh/VaultBill/release-app.yml)](https://github.com/Moleesh/VaultBill/actions/workflows/release-app.yml)
[![Latest Release](https://img.shields.io/github/v/release/Moleesh/VaultBill)](https://github.com/Moleesh/VaultBill/releases/latest)
[![Tests](https://img.shields.io/badge/tests-Vitest%20%2B%20Playwright-brightgreen)](https://github.com/Moleesh/VaultBill/actions/workflows/release-app.yml)
[![Security](https://img.shields.io/badge/security-release%20gated-0f766e)](https://github.com/Moleesh/VaultBill/actions/workflows/release-app.yml)
[![License](https://img.shields.io/github/license/Moleesh/VaultBill)](LICENSE)
[![Platforms](https://img.shields.io/badge/platforms-Windows%20%7C%20Linux%20%7C%20macOS-informational)](https://github.com/Moleesh/VaultBill)

## What VaultBill Is 🌟

VaultBill is designed as a single product foundation for teams that want:

- A responsive SPA shell with a desktop-friendly Electron companion
- JSON-led configuration for document formats, reports, printer profiles, and
  optional integrations
- Offline-capable local data handling with SQLite-backed startup patching
- Strong TypeScript guarantees, SCSS theming, and a clean modular structure
- A release pipeline that produces both browser demo artifacts and desktop
  installer builds

## Demo And Full App 🚀

- Live demo: [moleesh.github.io/VaultBill](https://moleesh.github.io/VaultBill/)
- Demo mode lives on GitHub Pages under `/VaultBill/`
- Demo mode stores records in the browser only and has no backend or secrets
- Full app mode stores data locally in SQLite and uses the desktop shell
- The full app keeps LAN, backup, restore, printer, and signing controls on the
  desktop host

## Screenshots 📸

- The live GitHub Pages demo is the quickest way to see the current UI polish
- Desktop screenshots are easiest to capture from the packaged app after build
- Release notes call out the current visual and workflow state when releases go out

## Why It Feels Nice To Work With 😊

- VaultBill has a fixed product/package identity so upgrades stay reliable
- Five built-in themes keep the UI visually distinct without custom styling
- Operator-aware permissions and document-format fallback logic are built in
- Print, PDF, record, report, backup, and Local API seams are already wired
- Optional integration contracts exist for SMS, GST helpers, signature pad, and
  GSP hooks without pretending they guarantee compliance
- GitHub Pages deployment is automatic, so the browser demo stays easy to publish

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

## Environment Configuration 🔐

Copy `.env.example` to a local environment file only when you need to override
defaults. Never place a service-role key or provider secret in a frontend
variable.

| Variable            | Required | Used by                | Default | Purpose                                                                   |
| ------------------- | -------- | ---------------------- | ------- | ------------------------------------------------------------------------- |
| `SYSADMIN_PASSWORD` | No       | Desktop/LAN startup    | Empty   | Optional SysAdmin password for protected actions such as permanent delete |
| `BACKUP_PASSWORD`   | No       | Desktop backup/restore | Empty   | Enables encrypted backup by default when configured                       |

The GitHub Pages workflow sets `VITE_DEMO_MODE=true` and `VITE_BASE_PATH=/VaultBill/`
automatically. Normal developers do not need to set those variables by hand.

## Useful Scripts 🛠️

### Day-to-day

| Command                  | What it does                                         |
| ------------------------ | ---------------------------------------------------- |
| `npm run dev`            | Starts the Vite dev server for the web app           |
| `npm run dev:electron`   | Runs the web app and Electron shell together         |
| `npm run preview`        | Serves the production web build locally              |
| `npm run format:check`   | Checks formatting with Prettier                      |
| `npm run lint`           | Runs ESLint with zero warnings allowed               |
| `npm run typecheck`      | Runs TypeScript checks for web and Electron          |
| `npm run test`           | Runs the Vitest suite once                           |
| `npm run test:ci`        | Runs Vitest in CI-friendly serial mode               |
| `npm run scan:secrets`   | Scans tracked release source for secrets             |
| `npm run security:check` | Verifies Electron, CSP, identity, and workflow gates |

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

The product name, package identity, and artifact slug are fixed to VaultBill.
Business profile, logo, tagline, print identity, accent, and themes remain
configurable without changing the installed application identity.

For GitHub Pages builds, the app is published under the `/VaultBill/` subpath.
The production build and the Pages workflow are aligned with that base path, and
the app includes a redirect so stray URLs fall back to the canonical home page.

## Automation And Deployment 🤖

- `Release App` packages desktop release files on version tags or manual
  dispatch. It also replaces an existing GitHub
  Release for the same version before publishing the fresh one.
- `Demo Pages` automatically deploys the demo on pushes to `main`.
- The Pages workflow uses the `VaultBill` GitHub Pages environment name.
- The Pages workflow sets `VITE_DEMO_MODE=true` and `VITE_BASE_PATH=/VaultBill/`
  automatically, and the hosted demo stores records in browser storage only.
- A `public/404.html` fallback keeps GitHub Pages navigation friendly.

## Security And Release Safety 🔐

- Demo mode is not a production deployment.
- Full app mode stores data locally in SQLite.
- LAN is disabled by default.
- Electron uses isolation, sandboxing, typed IPC validation, and a restrictive CSP.
- Local API requests have origin, role, validation, and upload-size checks.
- Backups may contain sensitive data.
- Encrypted backup is recommended when `BACKUP_PASSWORD` is set.
- Public desktop releases should use signed installers when available.
- Release artifacts include SHA-256 checksums and recorded signing status.
- Android is future scope and has a separate security gate.

## Testing 🧪

- `npm run format:check`
- `npm run lint`
- `npm run typecheck`
- `npm run test:ci`
- `npm run coverage:ci`
- `npm run test:e2e`

## Release Process 🚚

- `Release App` is the tag/manual desktop release pipeline.
- If the same release version already exists, the workflow deletes the old
  GitHub Release and tag before publishing fresh assets.
- Demo Pages publishes automatically on `main` and uses the `VaultBill`
  environment.

## Troubleshooting 🧰

- If the GitHub Pages route looks blank after a refresh, verify the app is
  being served under `/VaultBill/`.
- If a desktop release smoke test fails, re-run `npm run smoke:installer`.
- If demo data seems missing, clear browser storage for the Pages origin and
  create a new draft.

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
- Fixed product branding, business profile settings, and DB-backed app assets
- Keyboard shortcuts, responsive layout metadata, and reusable feedback states

## Project Notes 💡

- The implementation source of truth is `docs/Spec.md`
- The release pipeline details live in `docs/ReleasePipeline.md`
- GitHub Pages is the web publishing target for the SPA demo build
- The Electron release flow is separated from the Pages deployment flow so each
  workflow stays focused and easy to reason about

## A Tiny Promise 😊

This repo is meant to stay spec-led, test-backed, and pleasantly boring in the
best possible way. No hidden magic, no surprise build steps, and no guesswork
about where the code lives.

If you’re here to extend VaultBill, you’re in the right place. Let’s keep it
smooth, colorful, and reliable ✨
