Printer profiles are stored as JSON in `printer_profiles` and can be marked as
the default profile. Saving a new default clears the previous default in the
repository.

The current settings layout keeps business, security, and integrations on one
scrolling page with jump links instead of a stack of rigid tabs. Branding,
company profile, theme, operators, printers, backup, restore, activation, and
integration settings all live under that shell while role access decides what is
visible.

Backup/restore validates DB-only backup package contents, checksums, optional
encryption, password recovery, and recovery-key restore semantics. The desktop
file picker/write adapter is kept outside the pure backup engine.

Accessibility settings expose shared keyboard shortcut metadata and the
responsive viewport matrix so buttons, tooltips, and visual tests use one
source of truth.

Optional integration settings include signature pad, SMS provider, GST helper,
and GSP hook contracts. These settings store configuration only; provider
failures and compliance uncertainty must surface as clear user-facing messages.
