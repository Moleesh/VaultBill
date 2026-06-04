<!-- @format -->

# Release Pipeline

Phase 19 packages VaultBill with Electron Builder after the web and Electron
shell builds complete.

## Build Identity

The package identity is derived from `APP_NAME` with the same fallback as the
desktop runtime:

```json
{
  "APP_NAME": "VaultBill",
  "ProductName": "VaultBill",
  "AppId": "com.vaultbill.vaultbill",
  "ArtifactSlug": "vaultbill"
}
```

Use the same `APP_NAME` for every release of an existing branded installation
so upgrades resolve to the same app identity.

## Scripts

- `npm run rebuild:native` rebuilds production and optional native modules for
  the installed Electron runtime.
- `npm run package:desktop` creates an unpacked desktop package in `release/`.
- `npm run package:desktop:installer` creates platform installer artifacts.
- `npm run smoke:installer` verifies build outputs, package main entry, build
  identity, and unpacked package presence.
- `npm run smoke:installer:required` additionally requires an installer
  artifact in `release/`.
- `npm run smoke:first-run-db` runs startup patch tests for first-run and
  upgrade safety.
- `npm run release:notes` writes `artifacts/release-notes.md`.

## CI Gate

The CI workflow runs install, format check, lint, typecheck, unit tests,
coverage, web build, Electron native-module rebuild, desktop build, desktop
directory packaging, and installer smoke.

The desktop release workflow runs on Windows, creates the installer, requires
an installer artifact during smoke, validates first-run DB startup patch tests,
generates release notes, and uploads `release/**` plus the generated notes.
