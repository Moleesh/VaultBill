# Unresolved v24 Issues

These are real remaining hardening items, not hidden release claims.

- Hosted Local API account sessions must fully replace the transitional trusted
  role header on every route. This requires HttpOnly SameSite cookies, CSRF,
  expiry, throttling, and reauthentication for sensitive operations.
- Hosted browser account persistence and operator CRUD must use the
  Electron-owned SQLite credential repository end to end.
- Builder asset bytes and published format/template data must use SQLite in the
  full app instead of the current UI-local draft state.
- Print progress currently models browser output; host printer cancellation and
  per-record template printing require the final native print queue.
- Backup/restore/reset buttons need the streaming desktop implementation and
  restart/session invalidation flow.
- Public artifacts are unsigned unless repository signing credentials are
  configured. Unsigned packages are testing builds.
- macOS signing/notarization, native Android, discovery/certificate handling,
  and lost-SysAdmin database recovery remain future scope.
