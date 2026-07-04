<!-- @format -->

# Release Pipeline

VaultBill maintains exactly two GitHub Actions workflows.

## Demo Pages

Triggers on every `main` push.

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
once. Separate Windows, Linux, and Android jobs then build:

- Windows x64 NSIS installer
- Linux x64 AppImage
- unsigned Android debug APK

Ordinary `main` pushes also download platform artifacts, generate release notes
and SHA-256 checksums, report signing status, and publish the current GitHub
Release. Tag/manual runs follow the same publish path after verifying the
tag/version agreement.

For tags, `v${package.json.version}` must equal the pushed tag. Before
publication, an existing release and tag for the same package version are
deleted so a corrected build can be republished intentionally.

`VAULTBILL_LICENSE_KEY` is optional packaging input from GitHub Secrets. The
package embeds only its verifier.

Android artifacts are unsigned unless signing secrets are added later. The
Android job uses the Capacitor project in `android/` and builds from the same
React shell with the Android runtime flag enabled.

Local Android builds require an installed Android SDK, exposed through
`ANDROID_HOME` or `android/local.properties`. GitHub Actions configures the SDK
before running `npm run build:android:ci`.
