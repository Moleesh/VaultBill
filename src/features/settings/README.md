Printer profiles are stored as JSON in `printer_profiles` and can be marked as
the default profile. Saving a new default clears the previous default in the
repository.

Branding, company profile, security, theme lock, backup, and restore settings
are represented by validated settings contracts as their spec phases complete.

Backup/restore now validates DB-only backup package contents, checksums,
optional encryption, password recovery, and recovery-key restore semantics. The
desktop file picker/write adapter is kept outside the pure backup engine.

Accessibility settings now expose shared keyboard shortcut metadata and the
required responsive viewport matrix so buttons, tooltips, and visual tests use
one source of truth.

Optional integration settings now include signature pad, SMS provider, GST
helper, and GSP hook contracts. These settings store configuration only; provider
failures and compliance uncertainty must surface as clear user-facing messages.
