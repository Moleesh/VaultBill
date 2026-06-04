<!-- @format -->

# VaultBill Specification Reference

The implementation source of truth is
`C:/Users/Moleesh/Downloads/VaultBill_Final_Spec_v9.md`.

This repository follows that handoff in phase order. Phase 20 is the current
completed scope and includes:

- Vite, Electron, React, TypeScript, and SCSS scaffold
- Build-time app name derivation from one `APP_NAME` environment variable
- Five built-in themes using shared CSS variables
- Responsive SPA shell without normal-flow redirects
- SQLite startup patching, account/operator context, document format fallback,
  schema, line item, formula, record, print, PDF, printer, import, bulk print,
  report, backup, Local API, branding, and app asset engines/adapters
- Keyboard shortcut metadata, action tooltips, reusable feedback states, and the
  required responsive viewport matrix
- Native-module rebuild, Electron Builder desktop packaging, installer/package
  smoke checks, release-note generation, and release artifact upload workflow
- Optional SMS provider, GST helper, signature pad, and GSP hook integration
  contracts with clear no-compliance-guarantee fallback messaging

All listed implementation phases are represented in code, tests, and docs.
