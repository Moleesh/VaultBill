# VaultBill ✨

VaultBill is an offline-first billing, reporting, PDF, and print workspace with
two deliberately different personalities:

- 🌐 **GitHub Pages demo:** browser-only, seeded, secret-free, and safe to reset.
- 🖥️ **Full desktop app:** Electron + SQLite for Windows and Linux, with a hosted
  local web workspace while VaultBill is running.

[![Demo Pages](https://img.shields.io/github/actions/workflow/status/Moleesh/VaultBill/demo-pages.yml?branch=main&label=demo%20pages)](https://github.com/Moleesh/VaultBill/actions/workflows/demo-pages.yml)
[![Release App](https://img.shields.io/github/actions/workflow/status/Moleesh/VaultBill/release-app.yml?branch=main&label=release%20app)](https://github.com/Moleesh/VaultBill/actions/workflows/release-app.yml)
[![Latest Release](https://img.shields.io/github/v/release/Moleesh/VaultBill?display_name=tag&label=latest)](https://github.com/Moleesh/VaultBill/releases)
[![Platforms](https://img.shields.io/badge/platforms-Windows%20%7C%20Linux-167d73)](https://github.com/Moleesh/VaultBill/actions/workflows/release-app.yml)
[![Tests](https://img.shields.io/badge/tests-Vitest%20%2B%20Playwright-f0a202)](https://github.com/Moleesh/VaultBill/actions)

## Try The Demo 🚀

Open [moleesh.github.io/VaultBill](https://moleesh.github.io/VaultBill/).

The demo includes a dashboard, records, reports, browser printing, seeded
customers, drafts, finalized invoices, and cancelled history. Data stays in
your browser. No Supabase, API key, license key, LAN host, backup, or desktop
integration is used. Tiny browser sandbox, zero secret drama. 😊

All demo routes use `/VaultBill/`, including refresh recovery.

## Full App 🧰

The desktop app owns:

- SQLite business records and configuration
- document formats, custom record fields, calculations, HTML templates, and shared assets
- printing, PDF output, verified backup/restore/reset, trial state, and activation
- a localhost web workspace that remains available while minimized to tray
- optional LAN hosting, disabled by default and persisted in SQLite

Windows NSIS and Linux AppImage are current targets. macOS and native Android
remain future scope; an Android browser may use the hosted web workspace.

## Roles 🔐

| Role       | Main workspace                                                  |
| ---------- | --------------------------------------------------------------- |
| `SysAdmin` | Dashboard, Builder, Business/Security/Integration Settings      |
| `Admin`    | Dashboard, Records, Reports, restricted User/password Settings  |
| `User`     | Records, Reports, personal password control                     |
| `Demo`     | Dashboard, Records, Reports, browser print/PDF, confirmed reset |

First-run setup creates only the protected System Administrator. Admin and User
accounts are created later in Settings. VaultBill permits one active Admin and
up to five active Users.

## First Run 🌱

The setup wizard asks for:

1. Welcome.
2. Required business name and address.
3. System Administrator and backup security.

If unchanged, initial SysAdmin and backup passwords use the packaged default.
VaultBill never displays that default and keeps warning until both credentials
are replaced. Please replace defaults before real business use. Seriously. 🔒

## Builder 🧩

Builder has six focused steps:

1. Format
2. Fields
3. Line Items
4. Calculations
5. Print
6. Preview & Save

Document configuration imports/exports as versioned JSON. Print templates stay
separate: one sanitized HTML file plus shared PNG, JPEG, WebP, SVG, WOFF, and
WOFF2 assets. Templates reference assets with `{{Asset.Name}}`.

Starter builder examples live in `samples/first-application/` so the sample
document JSON, matching HTML template, and shared asset stay together.
Fresh desktop databases also seed the same starter print template and asset so
the Builder opens with a ready-made format instead of a blank promise. 🙂

Formula examples:

```text
Quantity * Rate
SUM(Items.Amount)
COUNT(Items)
```

## Reports And Printing 📊

Reports support customer, partial invoice number, dates, status, common date
presets, and Last 100. Results load progressively in batches of 50.

- **Sales Register:** document-level status and value history
- **Tax Summary:** finalized taxable value and tax grouped by rate
- **Customer Ledger:** documents, cancellations, and finalized revenue by customer
- **Export:** all matching rows
- **Print Report:** one formatted report
- **Print Records:** each record through its document template
- Bulk record printing uses deterministic batches of 10 and asks before the next
  batch, so the printer does not suddenly become the office’s most ambitious
  employee. 🙂

Cancelled records remain visible but are excluded from revenue. Print templates
receive cancellation status/reason so they can render watermarks.

## Trial And Activation ⏳

Desktop trial time is accumulated only while Electron is running, including
tray mode. The trial lasts 24 accumulated hours. Expired trials permit login and
read-only Records/Reports plus activation access.

Package builds may receive:

```env
VAULTBILL_LICENSE_KEY=your-packaging-key
```

Only a verifier/hash is embedded in the package. GitHub Pages bypasses desktop
licensing and cannot be activated into the full application.

## Local Development 🛠️

```powershell
npm install
npm run dev
```

Open `http://127.0.0.1:5173/`.

If you want local environment defaults, copy `.env.example` to `.env` and
adjust the values for your machine.

Run the Electron shell:

```powershell
npm run dev:electron
```

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
npm run build:desktop
```

Useful packaging commands:

| Command                             | Purpose                                  |
| ----------------------------------- | ---------------------------------------- |
| `npm run build:web`                 | Build the browser bundle                 |
| `npm run build:electron`            | Compile Electron TypeScript              |
| `npm run package:desktop`           | Build an unpacked desktop directory      |
| `npm run package:desktop:installer` | Build the current platform installer     |
| `npm run smoke:first-run-db:ci`     | Verify SQLite first-run startup          |
| `npm run smoke:installer:required`  | Require and verify an installer artifact |

## Automation 🤖

The repository intentionally has exactly two workflows:

- **Demo Pages:** every `main` push and manual dispatch. It runs formatting,
  lint, typecheck, unit/security/browser gates, builds `/VaultBill/`, and deploys
  to the `VaultBill` environment.
- **Release App:** every `main` push, `v*` tag, and manual dispatch. It verifies
  once, builds Windows and Linux in separate jobs, and uploads workflow
  artifacts. Tags/manual runs additionally publish a GitHub Release.

When a release for the package version already exists, Release App removes the
old release/tag and republishes fresh assets, checksums, notes, and signing
status.

## Security Notes 🛡️

- Demo mode is not production hosting.
- LAN hosting is off by default.
- Electron uses context isolation, sandboxing, a restrictive CSP, and typed IPC.
- Hosted web uses HttpOnly SameSite sessions, CSRF checks, expiry, login
  throttling, origin checks, request validation, and server-side role enforcement.
- HTML templates reject scripts, event handlers, frames, forms, remote URLs,
  local file URLs, imports, and unsafe SVG patterns.
- Backups are checksummed ZIP packages. Restore validates identity, checksums,
  encryption metadata, and SQLite integrity before replacement. Encrypted output
  is strongly preferred because accounting data is not known for being shy. 🔐
- Unsigned desktop artifacts are testing builds, not a trust signal.
- Known hardening work is tracked honestly in `docs/UnresolvedIssues.md`.

## Documentation 📚

- [Decision log](docs/DecisionLog.md)
- [Release pipeline](docs/ReleasePipeline.md)
- [Security guidance](docs/Security.md)
- [JSON configuration](docs/JsonConfig.md)
- [Print templates](docs/PrintTemplate.md)
- [Known gaps](docs/UnresolvedIssues.md)

## Troubleshooting 🧯

- **Blank Pages refresh:** confirm the URL begins with `/VaultBill/`.
- **No desktop artifact:** review both Windows and Linux jobs in Release App.
- **Installer smoke fails:** run `npm run build:desktop`, package again, then
  `npm run smoke:installer:required`.
- **Demo data looks odd:** use the confirmed Reset demo action.
- **Hosted browser cannot reconnect:** open VaultBill Desktop on the host and
  confirm the hosted-web/LAN status in Settings or the tray menu.
- **SQLite startup fails:** run `npm run smoke:first-run-db:ci` and review the
  startup patch test.

VaultBill aims to be the pleasant kind of serious software: careful with data,
clear about limitations, and only mildly delighted when all the checks turn
green. ✨
