# Unresolved Issues

The v23 implementation has no phase-blocking product issues.

- GitHub Pages is intentionally a browser-only demo and is not a production
  deployment.
- Exact printer selection, database backup/restore, LAN hosting, and USB devices
  remain desktop capabilities by design.
- Public production releases require configured signing credentials; unsigned
  packages are labelled internal/testing builds.
- Linux and macOS packages are produced when runner and signing setup permit.
- Android is not a v1 target and remains blocked until its separate security
  gate is implemented.
