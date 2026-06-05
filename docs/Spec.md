# VaultBill Specification Reference

The implementation source of truth is
`C:/Users/Moleesh/Downloads/VaultBill_Final_Spec_v20.md`.

This repository follows that handoff as a production application and includes:

- Routed login-first React application with guarded role-aware pages
- Dashboard, records, reports, builder, settings, and contextual help surfaces
- Shared modal, confirmation, drawer, mobile sheet, popover, dropdown, and
  overflow progress foundations
- Capability-aware desktop, LAN browser, and hosted web/demo behavior
- Build-time app name derivation from one `APP_NAME` environment variable
- Five built-in themes using shared CSS variables
- Responsive SPA shell with GitHub Pages deep-link restoration
- SQLite startup patching, account/operator context, document format fallback,
  schema, line item, formula, record, print, PDF, printer, import, bulk print,
  report, backup, Local API, branding, and app asset engines/adapters
- Keyboard shortcut metadata, action tooltips, reusable feedback states, and the
  required responsive viewport matrix
- Native-module rebuild, Electron Builder desktop packaging, installer/package
  smoke checks, release-note generation, and release artifact upload workflow
- Optional SMS provider, GST helper, signature pad, and GSP hook integration
  contracts with clear no-compliance-guarantee fallback messaging
- Supabase document storage with RLS-isolated browser identities for the
  limited GitHub Pages demo
- Prettier, strict ESLint, Husky, commitlint, Vitest coverage, and Playwright
  browser-flow gates

The v20 plan is represented in code, migrations, tests, workflows, and docs.
