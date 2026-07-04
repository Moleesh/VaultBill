<!-- @format -->

# VaultBill ✨

VaultBill is an offline-first billing, invoicing, reporting, PDF, and print
workspace with two clearly different modes:

- 🌐 **GitHub Pages demo** for browser-only exploration, seeded data, and safe
  resets.
- 🖥️ **Full desktop app** for Electron + SQLite on Windows and Linux, with a
  hosted local web workspace while VaultBill is running.
- 🤖 **Android app** for a local mobile workspace, with optional pairing to a
  live desktop host when the operator wants to work against that session.

The repo documents the product directly through the app, docs, and workflows.
Nice and tidy. 🙂

[![Demo Pages](https://img.shields.io/github/actions/workflow/status/Moleesh/VaultBill/demo-pages.yml?branch=main&label=demo%20pages)](https://github.com/Moleesh/VaultBill/actions/workflows/demo-pages.yml)
[![Release App](https://img.shields.io/github/actions/workflow/status/Moleesh/VaultBill/release-app.yml?branch=main&label=release%20app)](https://github.com/Moleesh/VaultBill/actions/workflows/release-app.yml)
[![Platforms](https://img.shields.io/badge/platforms-Windows%20%7C%20Linux%20%7C%20Android-167d73)](https://github.com/Moleesh/VaultBill/actions/workflows/release-app.yml)
[![Tests](https://img.shields.io/badge/tests-Vitest%20%2B%20Playwright-f0a202)](https://github.com/Moleesh/VaultBill/actions)

## What VaultBill Does 🚀

VaultBill helps a business set up document formats, capture records, print and
export PDFs, inspect reports, manage operators, and keep data local in the full
desktop app. The demo mirrors the workflow shape without exposing secrets or
desktop-only services.

## Demo Mode 🌐

Open the hosted demo at
[moleesh.github.io/VaultBill](https://moleesh.github.io/VaultBill/).

The demo is browser-only and uses local browser storage. It includes:

- dashboard charts and recent activity
- records for drafts, finalized invoices, and cancelled history
- reports with filters and browser printing
- seeded customers and realistic sample data
- a confirmed reset flow for demo data
- browser PDF / print output

Demo routes all use `/VaultBill/`, including refresh recovery. No Supabase,
license key, LAN hosting, backup, or Electron-only integration is required.

## Full Desktop App 🖥️

The desktop build owns the local business data and system features:

- SQLite record storage and configuration
- document formats, custom fields, calculations, HTML print templates, and
  shared assets
- printing, PDF export, backup / restore / reset, trial state, and activation
- a hosted localhost web workspace that remains available while the app runs or
  sits in the tray
- optional LAN hosting, disabled by default and stored in SQLite

Windows installer, Linux AppImage, and unsigned Android APK artifacts are the
current release targets. macOS remains future scope.

## Android Runtime 🤖

Android runs as a DB-backed local workspace by default. During Android first-run
setup, operators can optionally connect to a live VaultBill Desktop host by
entering or scanning for a LAN host. Skipping pairing keeps the mobile workspace
local; pairing does not add sync or merge behavior. SysAdmin settings can change
or remove the pairing later.

## Roles And Access 🔐

| Role       | Main workspace                                                      |
| ---------- | ------------------------------------------------------------------- |
| `SysAdmin` | Dashboard, Document builder, Business / Security / Secrets / Backup |
| `Admin`    | Dashboard, Records, Reports, restricted password/settings views     |
| `User`     | Records, Reports, personal password control                         |
| `Demo`     | Dashboard, Records, Reports, browser print/PDF, confirmed reset     |

First-run setup creates only the protected System Administrator. Admin and
User accounts are added later through Settings. VaultBill allows one active
Admin and up to five active Users. SysAdmin always requires a password, while
Admin and User accounts may be created without one and will prompt for it only
when a password has been configured.

## First Run 🌱

The setup wizard asks for:

1. Welcome.
2. Required business name and address.
3. System Administrator and backup security.

If the default credential remains unchanged, VaultBill keeps the warning visible
until the password is replaced. The default is never displayed in the UI.

## Login And Session Flow 🔑

The login page lets the operator choose the account, enter a password only when
one is configured, and press `Enter` to sign in. SysAdmin access is hidden
behind the desktop `F8` unlock path instead of showing a visible hint. A
one-time logo animation and a compact help popover keep the screen light
instead of noisy.

## Document Builder 🧩

Document library opens first, and the Document builder wizard lives inside it
for new, duplicate, or edited formats. The wizard uses eight focused steps:

1. Format
2. Layout
3. Fields
4. Line Items
5. Calculations
6. Print
7. Field Preview
8. Print Preview

Document configuration imports and exports as portable JSON packages. Print templates
stay separate as one sanitized HTML file plus shared PNG, JPEG, WebP, SVG,
WOFF, and WOFF2 assets. Templates reference assets with `{{Asset.Name}}`.

Starter builder examples live in `samples/first-application/` so the sample
document JSON, matching HTML template, and shared asset sit together. The fresh
desktop database also seeds the same starter print template and asset so the
Document builder opens with a usable format instead of an empty promise. 🙂

Formula examples:

```text
Quantity * Rate
SUM(Items.Amount)
COUNT(Items)
```

## Records And Printing 📄

Records support draft, finalize, cancel, and reprint flows. The UI keeps create
and reprint as the main tabs, while action states explain when printing or
finalizing is unavailable.

- drafts stay editable until finalization
- finalized records are printable and reportable
- cancelled records remain visible in history and can be styled as cancellation
  copies by the print template
- bulk print uses deterministic ordering and batch continuation

## Reports And Filters 📊

Reports are built from reusable saved definitions. The **Format** dropdown picks
the output family, while the **Saved report** dropdown chooses a shared report
definition that can be run, duplicated, edited, deleted when permitted, or set
as the operator's personal default.

Each report definition owns display fields, sorting, and up to five filters.
Prompt-at-run filters ask the operator for values before execution, while
built-in reports such as Today's report and This month report stay undeletable
and outside the per-operator custom-report quota.

Available report views:

- Sales Register
- Tax Summary
- Customer Ledger

## Trial And Activation ⏳

Desktop trial time is accumulated only while Electron is running, including tray
mode. The trial lasts 24 accumulated hours. Expired trials permit login and
read-only Records / Reports plus activation access.

Package builds may receive:

```env
VAULTBILL_LICENSE_KEY=your-packaging-key
```

Only the verifier/hash is embedded in the app package. GitHub Pages bypasses
desktop licensing and cannot be activated into the full application.

## Local Development 🛠️

```powershell
npm install
npm run dev
```

Open `http://127.0.0.1/VaultBill/`.
If port `80` is already in use, VaultBill falls back to `http://127.0.0.1:5173/VaultBill/`.

Run the Electron shell:

```powershell
npm run dev:electron
```

`npm run dev:electron` now keeps development aligned with production:

- Electron serves the app from its own hosted local server
- renderer changes rebuild into `dist/`
- open the hosted workspace at `http://localhost/VaultBill/` while the desktop app is running

This flow intentionally avoids pointing Electron at a separate Vite dev server,
so stopping the desktop runtime also stops the live hosted workspace.

## Data Fetching Architecture 🔄

VaultBill uses **TanStack Query** as the standard runtime request layer for
browser, hosted local web, and desktop-backed workspace data.

The shared approach is:

- one root `QueryClient` for the app
- centralized runtime query keys
- centralized runtime query and mutation helpers for setup, session, trial,
  hosted web, workspace settings, security, builder, records, reports, and
  secrets
- cache invalidation and refetch after setup completion, login/logout,
  operator changes, builder publish/delete, record writes, and settings saves

Practical rule of thumb:

- workspace data reads should come from a shared query helper
- workspace writes should use a shared mutation helper when the action maps to
  runtime state
- only local UI commands such as desktop window chrome or tray actions should
  stay as thin imperative runtime adapters

This keeps reconnect, retry, cache hydration, and cross-screen consistency in
one place instead of scattering runtime fetch logic across components.

Useful packaging and smoke commands:

| Command                             | Purpose                                  |
| ----------------------------------- | ---------------------------------------- |
| `npm run build:web`                 | Build the browser bundle                 |
| `npm run build:electron`            | Compile Electron TypeScript              |
| `npm run build:desktop`             | Build the web bundle and Electron output |
| `npm run build:android`             | Build and sync the Android APK locally   |
| `npm run package:desktop`           | Build an unpacked desktop directory      |
| `npm run package:desktop:installer` | Build the current platform installer     |
| `npm run smoke:first-run-db:ci`     | Verify SQLite first-run startup          |
| `npm run smoke:installer:required`  | Require and verify an installer artifact |

## Quality Gates ✅

```powershell
npm run format:check
npm run lint
npm run typecheck
npm run test:ci
npm run coverage:ci
npm run audit:security
npm run scan:secrets
npm run test:security
npm run security:check
npm run test:e2e
```

## Automation 🤖

The repository intentionally keeps exactly two workflows:

- **Demo Pages** runs on every `main` push. It checks formatting, lint,
  typecheck, unit/security/browser gates, builds the `/VaultBill/` bundle, and
  deploys to the `VaultBill` environment.
- **Release App** runs on every `main` push, `v*` tag, and manual dispatch. It
  verifies once, builds Windows, Linux, and Android in separate jobs, uploads
  workflow artifacts on `main`, and publishes GitHub Releases for tags and
  manual runs.

When a release already exists for the current package version, Release App
replaces the previous release and tag before publishing fresh assets, checksums,
and notes. That keeps the release list tidy instead of collecting stale copies.

## Documentation 📚

- [Decision log](docs/DecisionLog.md)
- [Release pipeline](docs/ReleasePipeline.md)
- [Security guidance](docs/Security.md)
- [Secrets](docs/Secrets.md)
- [JSON configuration](docs/JsonConfig.md)
- [Print templates](docs/PrintTemplate.md)

## Naming And Maintenance 🧹

- intent-based source filenames over milestone or numbered names
- kebab-case DOM class names so JSX and SCSS stay predictable together
- import order is a standing rule:
  React-family first, third-party libraries next, internal repo modules next,
  internal hooks after other internal modules, and style imports last
- `npm run imports:write` is the repo-wide normalizer, while ESLint can autofix
  supported top-level import drift during local editing and pre-commit
- focused utility comments where behavior is easy to misuse or drift over time
- README and inline docs updated alongside product-facing cleanup

## Credits 🤝

VaultBill is developed with AI coding support from
[<img alt="Codex" src="https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/light/codex-color.png" width="18" /> Codex](https://openai.com/codex/).

## Troubleshooting 🧯

- **Blank Pages refresh:** confirm the URL begins with `/VaultBill/`.
- **Missing release artifact:** review the Windows, Linux, and Android jobs in
  Release App.
- **Installer smoke fails:** run `npm run build:desktop`, package again, then
  `npm run smoke:installer:required`.
- **Demo data looks odd:** use the confirmed Reset demo action.
- **Hosted browser cannot reconnect:** open VaultBill Desktop on the host and
  confirm the hosted-web / LAN status in Settings or the tray menu.
- **Android build cannot find the SDK:** set `ANDROID_HOME` or create
  `android/local.properties` with `sdk.dir=...`; CI configures this in the
  Android release job.
- **SQLite startup fails:** run `npm run smoke:first-run-db:ci` and review the
  startup patch test.

VaultBill aims to be the pleasant kind of serious software: careful with data,
clear about limitations, and only mildly delighted when all the checks turn
green. ✨
