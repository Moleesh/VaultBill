# Unresolved Issues

The v20 implementation has no phase-blocking issues.

- GitHub Pages is intentionally a limited demo. Its random browser identity
  isolates document rows through RLS but is not a human account or cross-device
  login. Production multi-device access should use Supabase Auth.
- Browser PDF output uses the browser print dialog and Save as PDF, as required;
  direct browser PDF generation remains outside the current scope.
- Exact printer selection, local backup/restore, USB devices, and secret-backed
  integrations remain desktop-only by design.
