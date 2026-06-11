<!-- @format -->

# VaultBill Security Guidance

## Deployment Boundaries

- GitHub Pages is a secret-free demo, not production business hosting.
- Full data, activation, printing, backup, and integrations belong to Electron.
- LAN hosting is disabled by default.

## Desktop

- Keep `contextIsolation`, renderer sandboxing, CSP, and `nodeIntegration: false`.
- Validate every IPC payload.
- Store login passwords with Node `scrypt`.
- Encrypt backup credentials with Electron `safeStorage`; SQLite stores
  ciphertext only.
- Do not place raw license keys in source, frontend variables, artifacts, logs,
  or documentation.

## Hosted Web

- Never trust a client-provided role.
- Use authenticated server-side sessions with HttpOnly SameSite cookies.
- Require CSRF tokens for mutations.
- Apply login throttling, expiry, origin checks, request schemas, role and
  capability checks.
- Require password reauthentication and confirmation for restore, backup
  download, reset, LAN changes, operator security, and permanent deletion.

## Templates And Files

- Reject scripts, event handlers, forms, frames, external URLs, CSS imports,
  local file URLs, and unsafe SVG content.
- The default Local API request ceiling is 100 MB.
- Warn before unusually large HTML, JSON, image, or font imports.
- Stage SQLite snapshots and restored databases on disk before replacement.
- The current ZIP layer buffers compressed archives and is capped by the Local
  API request ceiling for hosted transfers; true chunked ZIP streaming remains
  tracked in `docs/UnresolvedIssues.md`.

## Releases

- Treat unsigned installers/AppImages as testing artifacts.
- Keep `VAULTBILL_LICENSE_KEY` in GitHub Secrets when packaging activated builds.
- Run dependency audit, secret scan, security tests, and configuration checks
  before packaging.
