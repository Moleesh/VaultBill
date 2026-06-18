<!-- @format -->

# Unresolved Issues

These items remain open in the current implementation and are not hidden
release claims.

- Backup ZIP creation and hosted restore upload currently buffer the compressed
  archive in memory. SQLite snapshots and restore replacement are staged on
  disk, integrity checked, and restart-safe, but true chunked archive
  compression/decompression remains a large-database hardening item.
- Advanced Document builder field types such as attachment, multi-select, QR
  code, and rich dropdown option editors still need dedicated Records widgets.
  Text, textarea, checkbox, date, numeric, custom values, row formulas,
  `SUM(Items.Field)`, and `COUNT(Items)` are connected today. Signature support
  already lives in document-builder/template configuration rather than Settings.
- Hosted sessions are enforced server-side, but a SysAdmin session inventory and
  selective revoke screen is not yet exposed in Settings.
- Secrets-backed GST/GSP and SMS adapters still need reviewed compliance
  validation before real submission or messaging.
- Public artifacts are unsigned unless repository signing credentials are
  configured. Unsigned packages are testing builds.
- macOS signing/notarization, native Android, discovery/certificate handling,
  and lost-SysAdmin database recovery remain future scope.
