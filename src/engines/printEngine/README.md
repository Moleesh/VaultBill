<!-- @format -->

The print engine sanitizes DB-stored HTML before saving or rendering, rejects
runtime script surfaces, resolves DB asset placeholders to data URLs, escapes
record values by default, and returns non-blocking warnings for missing
placeholders.

Template compilation accepts already-mapped values. Record-specific value
mapping is handled separately so report printing can reuse the same compiler in
Phase 14.

Printer profiles resolve spec output targets into workflow targets. Exact
`SelectedPrinter` output is desktop-only and is disabled with a tooltip when the
configured printer is unavailable; browser/web PDF uses browser Save as PDF.

Bulk print planning supports selected records and report-filtered record sets,
combined PDF HTML, individual PDF jobs, printer-per-document jobs, profile
resolution, and progress state calculation.
