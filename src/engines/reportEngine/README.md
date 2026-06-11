<!-- @format -->

The report engine evaluates JSON report definitions against saved
`DocumentRecord` values, excludes drafts, filters by configured formats/date
ranges, sorts latest-created-first, and exposes paged rows for infinite scroll.

Report export uses all matching rows rather than only visible rows, and CSV
values are protected against spreadsheet formula injection. Report printing uses
the same sanitized template compiler as record printing.
