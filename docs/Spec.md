# VaultBill Complete Consolidated Product Specification v24

Status: canonical implementation baseline as of 2026-06-07.

This document supersedes v23 wherever a decision conflicts with the rules
below. The downloaded v23 specification remains historical reference only.

## Product Modes

### GitHub Pages Demo

- Browser storage only.
- Dashboard, Records, Reports, Help, browser print/PDF, seeded data, and
  confirmed reset.
- No Supabase, secrets, SQLite, licensing, backup, LAN, or integrations.
- `Download Full App` replaces activation.
- All routes and refresh recovery use `/VaultBill/`.

### Full Application

- Electron owns SQLite, printing, PDF, backups, integrations, trial state, and
  the Local API.
- The complete role-authorized app is hosted on localhost while Electron runs,
  including tray mode.
- LAN access is disabled by default and binds to `0.0.0.0` only after authorized
  enablement.
- Windows and Linux are current release targets.
- macOS and native Android remain future scope.

## Roles

- Setup creates only SysAdmin.
- SysAdmin: Dashboard, Builder, Settings.
- Admin: Dashboard, Records, Reports, restricted Settings.
- User: Records, Reports, personal password.
- Demo: Dashboard, Records, Reports.
- One active Admin and up to five active Users.
- SysAdmin manages Admin and User accounts.
- Admin manages User accounts only.
- Removal archives accounts; immutable IDs preserve record ownership.

## Setup And Credentials

Setup has Welcome, required Business Profile, and System Administrator/security.
Business name and address are required.

Initial SysAdmin and backup passwords default to the packaged v24 default when
unchanged. Defaults are never shown and warnings remain until replaced.

Login passwords use Node `scrypt`. Backup credentials are encrypted through
Electron secure storage; SQLite stores ciphertext only. Passwordless Admin/User
accounts may authenticate locally but not over LAN. Lost-SysAdmin database
recovery remains future scope.

## Trial And Activation

- Package builds accept `VAULTBILL_LICENSE_KEY` and embed only a verifier/hash.
- Trial duration is 24 accumulated Electron-running hours, including tray mode.
- Trial and activation state persist in SQLite.
- Reset Application Data clears trial and activation.
- Expired mode is read-only Records/Reports plus activation access.
- Builder, mutations, exports, integrations, backup, and printing are blocked.
- GitHub Pages bypasses desktop licensing.

## Shell

- Electron launches fullscreen, frameless, and without a native menu.
- Sidebar/topbar stay fixed; only main content scrolls.
- The content scroller includes a themed vertical progress rail.
- Navigation uses Lucide icons, concise labels, an icon-only collapse control,
  role filtering, and matching mobile bottom navigation.
- Footer controls include identity, theme palette, host status, and logout.
- Theme preview restores the saved theme on Escape/dismissal.
- Page-level horizontal overflow is prohibited.

## Records

- Main tabs are Create and Reprint.
- New records show no `Unsaved` badge.
- Persisted records show Draft; finalized history shows Finalized; cancelled
  state appears in history/reprint/report contexts.
- Unavailable actions use `aria-disabled`, remain focusable, show lock icons and
  reason tooltips, block activation, and announce the reason.
- Draft Print reason: `Save the draft before printing it.`
- Finalize reason: `Save the draft before finalizing it.`
- Print reason: `Finalize the document before printing it.`

## Printing

Every print, preview, PDF, reprint, report, and bulk operation shows progress.
Print Records uses deterministic report order with record ID tie-breaking,
batches of 10, continuation prompts, and no duplicate completed records.
Templates receive status and cancellation placeholders.

## Builder

Steps: Format, Fields, Line Items, Calculations, Print, Preview & Save.

- No editable description or permanent split preview.
- JSON packages contain document configuration only.
- Existing IDs offer update/copy handling.
- Fields support create, edit, duplicate, delete, drag/keyboard reorder, type,
  required/default/sample/placeholder, visibility, read-only, precision,
  length, prefix/suffix, and calculations.
- Referenced fields cannot be removed without dependency guidance.
- Expressions support same-row operations, aggregates, guided insertion,
  unknown/type/division/cycle diagnostics, samples, and automatic ordering.
- Each format has one active sanitized HTML template.
- Assets are separate PNG/JPEG/WebP/SVG/WOFF/WOFF2 blobs referenced through
  `{{Asset.Name}}`.
- The Local API request ceiling defaults to 100 MB; unusually large imports
  require confirmation rather than an arbitrary small product limit.

## Dashboards

Admin/demo: revenue trend, status distribution, top customers, totals, recent
activity, and direct Records/Reports actions. Cancelled records do not count as
revenue.

SysAdmin: document formats, print templates, defaults, validation, linkage,
last-updated details, warnings, Edit, and Preview.

## Settings

One scrolling page with jump links.

- SysAdmin Business: profile, tax/branding, theme, printer/PDF defaults, backup,
  restore, reset.
- SysAdmin Security: credentials, operators, activation/trial, LAN, sessions,
  permanent-delete authorization.
- SysAdmin Integrations: GST/GSP, SMS, signature, future providers.
- Admin: User management and own password only.
- User: own password from account menu.

## Reports

Sales Register, Tax Summary, and Customer Ledger use SQLite/Local API data.
Filters combine customer, partial/exact invoice, date range, status, Today, This
Month, Financial Year, and Last 100. Active filters are removable chips.

Cursor paging loads 50 rows at a time with infinite scrolling. Export/print
operate on the complete filtered result. `204` and empty successful responses
must not be parsed as JSON.

## Desktop Hosting

Closing hides to tray; explicit Quit stops the host and closes SQLite. The tray
shows Open, host address/status, LAN status, and Quit.

Hosted APIs use authenticated server sessions, HttpOnly SameSite cookies, CSRF
protection, expiry, throttling, origin validation, request schemas, and
capability enforcement. Sensitive remote actions require password
reauthentication and confirmation.

## Backup And Reset

Keep checksummed ZIP backups with encrypted and warned unencrypted modes.
Streaming restore validates identity, manifest, checksums, encryption metadata,
and database startup before replacement. Reset requires SysAdmin password and
typed confirmation, clears all data plus trial/activation, and returns to setup.

## Automation

Exactly two workflows:

1. Demo Pages: every `main` push/manual, full demo gates, `/VaultBill/` deploy to
   environment `VaultBill`.
2. Release App: every `main` push, `v*` tag, and manual. Verify once; package
   Windows NSIS and Linux AppImage separately. Main pushes upload artifacts;
   tags/manual publish releases. Tag/version must agree. Same-version
   release/tag is replaced before republishing.

## Acceptance

Formatting, lint, typecheck, unit, coverage, security, secret scanning,
Playwright, SQLite startup, Windows/Linux packaging, role authorization, trial,
printing, overflow, and hosted-web/tray behavior must pass before release.
