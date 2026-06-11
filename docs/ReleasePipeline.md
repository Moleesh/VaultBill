<!-- @format -->

# Release Pipeline v24

VaultBill maintains exactly two GitHub Actions workflows.

## Demo Pages

Triggers on every `main` push and manual dispatch.

It runs formatting, lint, typecheck, unit tests, dependency/security checks,
secret scanning, Playwright, and the web build with:

```env
VITE_DEMO_MODE=true
VITE_BASE_PATH=/VaultBill/
```

The secret-free bundle deploys to the `VaultBill` environment. Playwright traces
and screenshots upload when browser checks fail.

## Release App

Triggers on:

- every `main` push
- `v*` tags
- manual dispatch

The shared verification job runs the complete quality/security/browser gate
once. Separate Windows and Linux jobs then build:

- Windows x64 NSIS installer
- Linux x64 AppImage

Ordinary `main` pushes upload workflow artifacts only. Tag/manual runs download
both platform artifacts, generate release notes and SHA-256 checksums, report
signing status, and publish a GitHub Release.

For tags, `v${package.json.version}` must equal the pushed tag. Before
publication, an existing release and tag for the same package version are
deleted so a corrected build can be republished intentionally.

`VAULTBILL_LICENSE_KEY` is optional packaging input from GitHub Secrets. The
package embeds only its verifier.
