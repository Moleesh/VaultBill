<!-- @format -->

Printer profiles are stored as JSON in `printer_profiles` and can be marked as
the default profile. Saving a new default clears the previous default in the
repository.

The current settings layout keeps business, security, backup, and connected
services on one scrolling page with jump links instead of a stack of rigid
tabs. Branding, company profile, theme, operators, printers, backup, restore,
activation, and integration settings all live under that shell while role
access decides what is visible.

Backup/restore validates DB-only backup package contents, checksums, optional
encryption, password recovery, and recovery-key restore semantics. The desktop
file picker/write adapter is kept outside the pure backup engine.

Accessibility settings expose shared keyboard shortcut metadata and the
responsive viewport matrix so buttons, tooltips, and visual tests all use the
same shared contract.

Connected service settings use one flexible key/value model so GST, SMS, and
future providers can store arbitrary fields without hard-coded schemas. The
builder keeps signature support inside document configuration and print
template JSON rather than general settings.
