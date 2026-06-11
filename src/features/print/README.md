<!-- @format -->

Print templates are stored in SQLite through `print_templates` and
`print_template_assets`. The print workflow prepares Draft Print, Final Print,
Reprint, Test Print, Preview, Download as PDF, and printer-output jobs from the
same sanitized HTML pipeline.

Desktop PDF generation and direct printer output are exposed through validated
Electron IPC. Browser/web PDF uses browser print preview, where the user chooses
Save as PDF.

Printer profiles and richer output-target selection are Phase 11.
