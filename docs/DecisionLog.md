<!-- @format -->

# Decision Log

## 2026-06-04

- Started with Phase 1 because the workspace was an empty git repository and
  the handoff baseline requires phase-order implementation.
- Used Vite + React + TypeScript + SCSS with strict compiler settings.
- Added Electron main/preload files now, but left printing, PDF, printer
  listing, Local API, database, and engines as typed placeholders for their
  required future phases.
- Implemented `APP_NAME` derivation in both Vite and Electron with the
  fallback of `VaultBill`.
- Kept runtime branding separate from build-time identity.
- Added five built-in themes through CSS variables rather than hardcoded
  component colors.
- Documented unresolved later-phase items instead of faking incomplete product
  behavior.

## 2026-06-04 Phase 2

- Used Node's built-in `node:sqlite` `DatabaseSync` behind a small port instead
  of adding a native npm SQLite dependency during the startup-patching phase.
- Implemented startup checks as a transaction after enabling and verifying
  `PRAGMA foreign_keys = ON`.
- Created required tables first, then checked `PRAGMA table_info`, then added
  missing columns with safe nullable/default definitions.
- Seeded one built-in `GST Invoice` default format only when
  `document_formats` is empty.
- Treated duplicate default formats during unique-index creation as a recovery
  error that stops startup.

## 2026-06-04 Phase 3

- Added a hard-coded permission matrix for SysAdmin, Admin, and User roles.
- Implemented navigation gating so JSON/UI configuration can disable access but
  cannot grant a role a capability denied by the matrix.
- Added operator context metadata helpers for `CreatedBy`, `CreatedByName`,
  `LastActionBy`, and `LastActionByName`.
- Added account limit validation for one active SysAdmin, one active Admin, and
  up to five active Users.
- Added a bootstrap helper that seeds clean databases with SysAdmin and Admin
  rows while keeping password/PIN disabled by default.

## 2026-06-04 Phase 4

- Added document-format resolution in strict fallback order: `FormatId`,
  `FormatName`, then the single valid default format.
- Added the exact required non-blocking warning when the default fallback is
  used.
- Treated invalid format JSON or metadata mismatch as unavailable during
  selection resolution.
- Added a delete guard that prevents deleting the default document format.
- Added DB row loading for stored document formats without giving the browser
  direct SQLite access.

## 2026-06-04 Phase 5

- Added field catalog metadata for every field type listed in the baseline.
- Added schema-engine parsing for document format JSON through Zod.
- Added top-level document value validation for required fields, integers,
  decimal strings, dates, string arrays, booleans, and character max length.
- Added default savable-field extraction that excludes layout/generated fields.
- Added breaking-change warnings for `FormatId` changes and referenced field
  deletion.

## 2026-06-04 Phase 6

- Added a dynamic line-item engine for row creation, add, duplicate, reorder,
  essential-column lookup, and row-level validation.
- Preserved row identity through `RowId` and normalized `DisplayOrder` during
  reorder operations.
- Enforced `MinRows`, `MaxRows`, `AllowAddRows`, `AllowDuplicateRows`, and
  `AllowReorderRows` from JSON section config.
- Reused schema field validation for line-item cells and skipped missing
  calculated values so the formula phase can populate them later.

## 2026-06-04 Phase 7

- Added a BigInt-backed decimal implementation for parsing, addition,
  subtraction, multiplication, division, HALF_UP rounding, and fixed-precision
  formatting.
- Added a small arithmetic formula tokenizer/parser with identifiers,
  parentheses, unary minus, and operator precedence.
- Added formula evaluation for calculated line-item fields using JSON
  calculation policy precision.

## 2026-06-04 Phase 8

- Added the saved `DocumentRecord` JSON contract and SQLite repository for
  draft save, draft editing, finalization, cancellation, and reprint retrieval.
- Kept draft saves numberless; final document numbers are allocated only during
  finalization inside one immediate SQLite transaction.
- Stored cancellation audit metadata in indexed DB columns while preserving the
  single saved-record JSON shape from the baseline.
- Enforced read-only finalized/cancelled records and Admin-only cancellation.

## 2026-06-04 Phase 9

- Added print template JSON validation, HTML sanitization, placeholder
  compilation, escaped record value rendering, missing-placeholder warnings, and
  DB asset data URL resolution.
- Stored templates and assets through SQLite adapters instead of filesystem
  folders.
- Rejected scripts, inline handlers, blocked tags, external URLs, data URLs, and
  file URLs in saved template HTML.
- Kept PDF, printer selection, Draft Print, Final Print, Reprint, and Test Print
  as later phases that reuse the same sanitized HTML pipeline.

## 2026-06-04 Phase 10

- Added print workflow planning for Draft Print, Final Print, Reprint, Test
  Print, Preview, Download as PDF, and printer output.
- Enforced the action table: Draft Print does not allocate a sequence, Final
  Print requires a finalized record, Reprint allows finalized/cancelled records,
  and Test Print uses mapping sample values.
- Applied copy count only to printer output; PDF output always plans one copy.
- Replaced Electron print/PDF placeholders with validated IPC handlers using
  hidden windows, `webContents.print`, and `webContents.printToPDF`.

## 2026-06-04 Phase 11

- Added printer profile JSON validation, SQLite storage, list/default loading,
  and repository-level default-profile clearing.
- Added output-target resolution for `SelectedPrinter`, `SystemDefaultPrinter`,
  `AskEveryTime`, `DownloadPdf`, and `PreviewOnly`.
- Disabled exact selected-printer output outside desktop Electron and when the
  configured printer is missing.
- Added Electron system printer listing through validated preload IPC; Electron
  currently exposes printer names but not a typed default-printer marker, so
  `SystemDefaultPrinter` remains enabled without requiring a named default.

## 2026-06-04 Phase 12

- Added delimited text parsing for CSV and spreadsheet paste TSV data without
  mutating saved records.
- Added header detection, proposed mappings by header or column order, and
  manual mapping support for import previews.
- Added import field classification for required, optional, system, and
  auto-calculated fields plus upload-template column generation.
- Added row-level validation, optional line-item formula calculation, duplicate
  external document-number issues, and spreadsheet formula-injection escaping
  for generated template examples.

## 2026-06-04 Phase 13

- Added bulk print planning for selected records and report-filtered record
  sets.
- Added combined PDF HTML generation with page breaks, individual PDF jobs, and
  printer-per-document jobs through the existing printer profile resolver.
- Added bulk print progress state calculation for idle, running, and complete
  UI states.
- Kept report filtering itself in Phase 14; Phase 13 accepts the matching record
  set supplied by the later report engine.

## 2026-06-04 Phase 14

- Added JSON report validation, SQLite report configuration storage, and
  latest-created-first report row evaluation.
- Excluded drafts from reports and supported configured format filters plus date
  range filters.
- Added paged report rows for infinite scroll and all-matching-row export for
  CSV/report print.
- Added report print preparation through sanitized HTML templates and CSV export
  protection against spreadsheet formula injection.

## 2026-06-04 Phase 15

- Added DB-only backup package creation with `manifest.json`, `database.sqlite`
  or encrypted database payload, and mandatory `checksums.json`.
- Added strict restore validation for manifest presence, VaultBill product
  identity, database payload presence, and checksum matching.
- Added optional AES-GCM backup encryption with a wrapped data key that can be
  restored by either backup password or recovery key.
- Kept OS file picker, folder write, and live SQLite `VACUUM INTO` copy wiring
  as desktop adapter concerns; the pure engine operates on consistent database
  bytes supplied by that adapter.

## 2026-06-04 Phase 16

- Added a browser-facing Local API adapter with typed methods for health,
  document formats, records, print preview, reports, bulk import preview, and
  backup capability.
- Preserved account/operator context in record action request bodies so LAN
  clients do not depend on the Electron preload bridge.
- Marked LAN Local API adapter status as available for browser clients.
- Updated Electron Local API health metadata to report ready capabilities and
  passwordless default LAN behavior.

## 2026-06-04 Phase 17

- Added company profile JSON validation and settings persistence.
- Added runtime branding normalization that falls back to `VaultBill` and the
  default tagline without changing packaged build identity.
- Added company print/report placeholders for name, legal name, GSTIN, address,
  phone, and email.
- Added DB-backed app asset storage for runtime logos and favicons.

## 2026-06-04 Phase 18

- Added action keyboard shortcut metadata with visible tooltips and
  `aria-keyshortcuts` for save draft, draft print, PDF download, and finalize.
- Added responsive viewport matrix metadata matching the required Playwright
  sizes and mapped those widths to single, double, or triple column modes.
- Added reusable loading, empty, error, and success feedback state examples for
  slow workflows instead of leaving screens visually silent.
- Kept visual-regression proof lightweight in this phase by pairing unit checks
  for the viewport contract with browser smoke checks against the running SPA.

## 2026-06-04 Phase 19

- Added Electron Builder desktop packaging with product name, artifact slug, and
  app identifier derived from the single `APP_NAME` build variable.
- Added a production/optional native-module rebuild script for the installed
  Electron runtime instead of rebuilding dev-only tooling.
- Added package/installer smoke checks that validate built web/Electron outputs,
  package main metadata, generated build identity, and release package presence.
- Updated CI and desktop release workflows to run native rebuild, package
  artifacts, first-run DB startup patch smoke, release-note generation, and
  artifact upload.

## 2026-06-04 Phase 20

- Added optional integration settings for signature pad, messaging, tax, and
  helper flows using DB-stored JSON settings. These legacy provider surfaces
  are now superseded by the single Secrets settings model.
- Implemented GSTIN format/checksum validation, HSN/SAC lookup, state-based GST
  split/IGST helpers, and GSTR export cell escaping without claiming compliance.
- Added adapter contracts with secret masking and a production-web guard that
  requires server-side integration flow.
- Added signature pad availability rules that allow screen drawing, limit
  USB/HID support to tested desktop devices, and validate SVG path-only storage.
- Added generic request planning with masked client secrets and explicit
  non-compliance-guarantee messaging.
- Hardened GitHub Actions test execution by running the SQLite-heavy Vitest
  suites in serial mode on CI and release smoke jobs, and opted the workflows
  into the Node 24 JavaScript action runtime ahead of the deprecation window.

## 2026-06-05

- Pinned `actions/setup-node` to Node 24 in the release and web deploy
  workflows so the `node:sqlite` startup smoke stays compatible with hosted
  runners.
- Routed SQLite-backed Vitest suites to the Node environment with
  file-level `@vitest-environment node` annotations so jsdom UI tests can keep
  running while database tests import `node:sqlite` safely.
- Reduced GitHub Actions to two workflows by removing the standalone CI file,
  keeping a dedicated release-file builder, and keeping a separate GitHub Pages
  deploy workflow.
- Switched the `GitHub Pages` workflow to automatic deployment on `main`
  pushes and configured the Vite base path for the `/VaultBill/` project Pages
  subpath.
- Added a GitHub Pages 404 fallback plus a production bootstrap redirect so
  stray URLs resolve back to the canonical `/VaultBill/` home path.
- Added GitHub Release publication to the desktop release workflow and made it
  delete any existing release and tag for the same version before recreating
  the release assets.

## 2026-06-05 Baseline v20

- Replaced the phase-status scaffold with a login-first routed product shell
  for dashboard, records, reports, builder, and settings.
- Added shared capability, overlay, searchable-dropdown, contextual-help, and
  horizontal-overflow foundations so desktop, LAN browser, and GitHub Pages demo
  behavior comes from one registry.
- Added five semantic-token themes from v20 and removed obsolete theme IDs.
- Used browser-only demo storage so the GitHub Pages flow stays secret-free
  and never depends on backend credentials or cross-device persistence.
- Used Prettier's native SCSS formatter because a maintained
  `prettier-plugin-scss` package does not exist.
- Added strict ESLint rules, Husky/lint-staged/commitlint hooks, coverage
  thresholds, and Playwright role, help, routing, and responsive overflow gates.

## 2026-06-07 Consolidated baseline v24

- Replaced fragmented v20-v23 plans with the live v24 implementation baseline
  and synchronized the repo docs to match it.
- Limited current desktop releases to Windows and Linux; macOS and native
  Android moved to future scope.
- Reduced first-run setup to Welcome, required Business Profile, and SysAdmin
  security. Admin/User creation moved to authorized Settings.
- Defined role-based navigation and account limits: one Admin and five Users.
- Added accumulated-use desktop trial state and package-time license verifier.
- Replaced the rigid shell with fixed navigation, Lucide icons, a scroll progress
  rail, compact theme palette, role-aware footer, and mobile bottom navigation.
- Reworked Document builder into six focused steps and separated JSON document
  configuration from HTML templates and shared assets.
- Defined deterministic ten-record print batches and progress for all output.
- Consolidated Settings into one jump-linked page and expanded reports with
  combined filters, progressive loading, export, report print, and record print.
- Changed Release App to run on every `main` push, package Windows/Linux
  separately, publish only for tags/manual runs, and replace same-version
  releases intentionally.
- Implemented hosted HttpOnly/CSRF sessions, SQLite operator persistence,
  scrypt/safeStorage credentials, cancellable native output jobs, checksummed
  encrypted ZIP backup/restore/reset, and session invalidation on data reset.
- Connected published Document builder formats to record entry and printing, including
  custom values, configured calculations, HTML assets, cancellation values, and
  deterministic ten-record batches.
- Persisted business, integration, and hosted-web settings in SQLite and exposed
  live LAN state through the tray and fixed application shell.
- Set the v24 unit-coverage floor to 70% statements/lines, 60% functions, and
  50% branches for domain logic, SQLite stores, API security, engines, and
  reusable workflows. React page composition and Electron entry/bridge glue are
  instead exercised through the mobile/tablet/desktop/wide Playwright matrix
  and desktop package smoke gates.

## 2026-06-11 UI cleanup and docs simplification

- Reworked the desktop shell, login, settings, builder, help copy, and version
  footer behavior to match the latest UI cleanup decisions.
- Kept the close icon, tray-close behavior, fixed blurred shell, hidden shell
  scrollbar, compact dropdowns, and pinned `1.0.0` version as the current UI
  baseline.
- Superseded the old legacy integration settings with the single Secrets
  surface and `Secrets.Key` formula syntax.
- Removed the central spec file and rewrote the README/docs copy so the
  practical documentation stands on its own.
