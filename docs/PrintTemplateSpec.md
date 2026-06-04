<!-- @format -->

# Print Template Spec

Phase 9 implements the template security and compilation baseline.

## Storage

Templates are stored in SQLite, not in a template folder:

- `print_templates.template_html`
- `print_templates.template_json`
- `print_template_assets.asset_blob`

## Template JSON

```json
{
  "TemplateId": "TaxInvoiceA4",
  "TemplateName": "Tax Invoice A4",
  "Scope": "Record",
  "Mappings": {
    "Record.CustomerName": {
      "SourceField": "CustomerName",
      "SampleValue": "Sample Customer"
    },
    "Record.GrandTotal": {
      "SourceField": "GrandTotal",
      "SampleValue": "1180.00"
    },
    "Items": {
      "SourceField": "LineItemSections.Items",
      "SampleValue": []
    }
  }
}
```

## Security Rules

- Store template HTML and assets in the database
- Allow HTML and CSS only
- Reject JavaScript, event handlers, iframes, object/embed tags, forms, meta
  refresh, external CSS URLs, and external assets
- Escape record and report placeholder values by default
- Render missing placeholders as blank values
- Show non-blocking preview warnings for missing placeholders
- Use the same HTML pipeline for print and PDF where supported

Asset placeholders such as `{{Asset.CompanyLogo}}` resolve only from
`print_template_assets`; missing assets render blank and produce a warning.
Record values are escaped by default, and raw HTML placeholders are not
supported.

## Output Workflow

- Draft Print accepts current draft data and does not allocate a document number.
- Final Print requires a finalized record and does not save or allocate a new
  sequence.
- Reprint requires a finalized or cancelled record.
- Test Print uses `SampleValue` entries from template mappings and does not
  require a saved record.
- `Download as PDF` always uses one copy.
- Copy count is applied only to printer output.
- Desktop Electron can generate PDF bytes directly.
- Web and LAN browser PDF output uses browser print preview and the user chooses
  Save as PDF.

## Bulk Print

- Bulk print can start from selected records or from all records matching a
  filtered report.
- Combined PDF creates one HTML document with page breaks between records.
- Individual PDF keeps one prepared print job per record.
- Printer output prints each document separately through the selected printer
  profile.
- Bulk progress exposes idle, running, and complete states for loading/progress
  UI.
