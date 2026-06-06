# Release Pipeline

VaultBill has exactly two public automation flows.

## Demo Pages

`.github/workflows/demo-pages.yml` runs automatically for pushes to `main`.
It installs from the lockfile, runs formatting, lint, typecheck, demo-safe tests,
secret scanning, Playwright smoke tests, and builds with:

```env
VITE_DEMO_MODE=true
VITE_BASE_PATH=/VaultBill/
```

The resulting secret-free bundle deploys to the `VaultBill` Pages environment.

## Release App

`.github/workflows/release-app.yml` runs for `v*` tags or manual dispatch. Its
verification job runs the strict quality and security gates, Playwright flows,
native-module rebuild, desktop build, and package smoke checks.

The mandatory Windows job builds the installer in CI, runs first-run SQLite
smoke tests, generates release notes and SHA-256 checksums, records whether
signing credentials were available, and uploads all artifacts.

The GitHub Release tag is `v${package.json version}`. If that release already
exists, the workflow deletes the old release and tag before publishing the new
assets and notes for the same version.

## Local Gates

- `npm run format:check`
- `npm run lint`
- `npm run typecheck`
- `npm run test:ci`
- `npm run test:e2e`
- `npm run audit:security`
- `npm run scan:secrets`
- `npm run test:security`
- `npm run security:check`
- `npm run build:desktop`
