<!-- @format -->

Record drafting is saved as JSON in SQLite without allocating a final document
number. Finalization allocates the format sequence inside the same SQLite
transaction that marks the record `Finalized`, keeping printing separate from
number allocation.

Drafts can be edited by the creator, Admin, or SysAdmin. Finalized and
cancelled records are read-only. Admin cancellation updates indexed audit
columns and changes the saved JSON status to `Cancelled`; reprint retrieval is
allowed only for finalized or cancelled records.
