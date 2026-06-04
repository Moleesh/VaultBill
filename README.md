<!-- @format -->

# VaultBill

VaultBill is a JSON-first, offline-capable billing, invoicing, reporting,
PDF, and print platform.

This repository currently implements the Phase 1 baseline from
`VaultBill_Final_Spec_v9.md`:

- Vite + React + strict TypeScript
- Electron main/preload shell
- SCSS tokens, reset, typography, print styles, and five themes
- Responsive single-page application shell
- CI workflows for web and desktop verification
- Documented seams for future engines, adapters, and feature modules

## Scripts

```powershell
npm install
npm run dev
npm run dev:electron
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build:web
npm run build:desktop
```

## Branding

Build-time naming follows the spec's single-variable rule:

```powershell
$env:APP_NAME='Acme Billing'
npm run build:desktop
```

If `APP_NAME` is blank or missing, VaultBill is used.
