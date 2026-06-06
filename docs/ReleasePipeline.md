# Release Pipeline

VaultBill packages the desktop product with Electron Builder after the shared
browser demo UI and Electron shell builds complete.

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

## Workflows

The `Build Release Files` workflow runs on manual dispatch and has two jobs.
The `verify` job runs install, format check, lint, typecheck, unit tests,
coverage, Playwright browser flows, web build, Electron native-module rebuild,
desktop build, desktop directory packaging, and installer smoke on Ubuntu. The
`package` job runs on Windows, creates the installer, requires an installer
artifact during smoke, validates first-run DB startup patch tests, generates
release notes, and uploads `release/**` plus the generated notes. It also
publishes a GitHub Release for `v${package.json version}`, and if that release
tag already exists it deletes the old release and tag before recreating them.

To keep the SQLite-backed startup tests deterministic on hosted runners, the
workflow installs Node 24 so `node:sqlite` stays available on hosted runners
and the Vitest suites can run in serial mode where needed.

The `GitHub Pages` workflow automatically publishes the browser demo build to
GitHub Pages on pushes to `main`, and uses the `VaultBill` Pages environment
name for the deployment record. It sets `VITE_DEMO_MODE=true`, runs
formatting, lint, typecheck, coverage, and Playwright gates, then builds with
the `/VaultBill/` base path. The demo build stores records in the browser
only.
