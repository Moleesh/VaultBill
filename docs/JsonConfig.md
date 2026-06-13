<!-- @format -->

# JSON Config

This document summarizes supporting JSON contracts used by the current schema,
print, report, settings, and integration engines.

## Runtime Branding

```json
{
    "ApplicationName": "VaultBill",
    "CompanyName": "",
    "Tagline": "Configure once. Bill, print, and report anywhere.",
    "ApplicationLogoAssetId": "",
    "PrintLogoAssetId": "",
    "FaviconAssetId": ""
}
```

## Document Format Summary

The product shell uses format summaries for selection while the schema engine
validates complete document format JSON before persistence.

```json
{
    "FormatId": "TaxInvoice",
    "FormatName": "GST Invoice",
    "Description": "Default seeded format placeholder",
    "IsDefault": true
}
```

## Built-In Format Seed

Clean SQLite databases seed one default document format:

```json
{
    "FormatId": "TaxInvoice",
    "FormatName": "GST Invoice",
    "LineItemSections": ["Items"],
    "CalculationPolicy": {
        "Currency": "INR",
        "MoneyPrecision": 2,
        "QuantityPrecision": 3,
        "RatePrecision": 4,
        "RoundingMode": "HALF_UP"
    }
}
```

The saved JSON is validated with Zod before insertion and again when startup
checks confirm the single default format.

## Theme

The built-in theme IDs are:

- `teal-flow`
- `midnight-ink`
- `sandstone-ledger`
- `slate-pro`
- `indigo-mint`

## Print Template

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
        "Record.InvoiceNumber": {
            "SourceField": "DocumentNumber"
        },
        "Items": {
            "SourceField": "LineItemSections.Items",
            "SampleValue": []
        }
    }
}
```

The template JSON metadata must match the `print_templates` row. Template HTML
is sanitized before saving and again before compilation.

Available placeholder groups in record print templates:

- Company profile: `Company.Name`, `Company.LegalName`, `Company.Gstin`,
  `Company.Address`, `Company.Phone`, `Company.Email`
- Record metadata: `Record.Number`, `Record.Status`, `Record.IsCancelled`,
  `Record.CancellationReason`, `Record.InvoiceDate`, `Record.CustomerName`,
  `Record.CustomerGstin`, `Record.Gstin`, `Record.State`,
  `Record.BillingAddress`, `Record.Subtotal`, `Record.TaxTotal`,
  `Record.RoundOff`, `Record.GrandTotal`, `Record.FormatName`
- Operator metadata: `Record.CreatedBy`, `Record.CreatedByName`,
  `Record.LastActionBy`, `Record.LastActionByName`
- Record collections: `Items.Table`, `Items.Rows`
- Custom document fields: `Record.{FieldId}`
- Shared assets: `Asset.Name`

## Printer Profile

```json
{
    "ProfileId": "OfficeA4",
    "ProfileName": "Office A4 Printer",
    "OutputTarget": "SelectedPrinter",
    "PrinterName": "HP LaserJet Pro",
    "PaperSize": "A4",
    "Orientation": "Portrait",
    "Margins": {
        "Top": 10,
        "Right": 10,
        "Bottom": 10,
        "Left": 10
    },
    "Scale": 1,
    "ShowPreviewBeforePrint": true,
    "AskCopiesBeforePrint": false,
    "DefaultCopies": 1,
    "FirstPageOnly": true
}
```

`SelectedPrinter` is available only in desktop Electron and must be disabled
with a tooltip if the configured printer is missing. `SystemDefaultPrinter`,
`AskEveryTime`, `DownloadPdf`, and `PreviewOnly` resolve through the print
workflow before output.

## Import Template Columns

Generated upload templates expose column metadata instead of saving records:

```json
{
    "label": "Item Name",
    "fieldId": "ItemName",
    "required": "Required",
    "dataType": "Text",
    "example": "Sample Item",
    "calculated": "No"
}
```

Calculated fields are marked `AutoCalculated`. Example values are escaped for
spreadsheet formula-injection protection when they begin with `=`, `+`, `-`, or
`@`.

## Report

```json
{
    "ReportId": "SalesSummary",
    "ReportName": "Sales Summary",
    "Source": "Records",
    "FormatIds": ["TaxInvoice"],
    "Filters": [
        {
            "FieldId": "InvoiceDate",
            "Type": "DateRange",
            "Label": "Invoice Date"
        }
    ],
    "Columns": [
        {
            "ColumnId": "CustomerName",
            "Label": "Customer",
            "SourceField": "CustomerName"
        }
    ],
    "PrintTemplates": [{ "TemplateId": "SalesSummaryA4", "IsDefault": true }]
}
```

Rows are sorted latest-created-first by default. Export and report print use all
matching rows, not only the visible page.

## Company Profile

```json
{
    "CompanyName": "Sample Traders",
    "LegalName": "Sample Traders Pvt Ltd",
    "Gstin": "",
    "Address": "",
    "Phone": "",
    "Email": "",
    "State": "",
    "BankName": "",
    "BankAccountNumber": "",
    "Ifsc": ""
}
```

Company placeholders available to print/report mappings:

- `Company.Name`
- `Company.LegalName`
- `Company.Gstin`
- `Company.Address`
- `Company.Phone`
- `Company.Email`

## Keyboard Shortcuts

Action shortcuts are exposed as metadata so UI buttons, tooltips, and future
settings screens can share the same contract:

```json
{
    "ActionId": "save-draft",
    "Label": "Save draft",
    "Keys": ["Control", "S"],
    "AriaKeyShortcut": "Control+S"
}
```

Current action IDs:

- `save-draft`
- `draft-print`
- `download-pdf`
- `finalize`

## Responsive Viewport Matrix

The required responsive test matrix is tracked in code and docs:

```json
{
    "Name": "Standard mobile",
    "Width": 390,
    "Height": 844,
    "ExpectedColumns": "Single"
}
```

Viewport widths below `640` use single-column layout, widths below `1200` use
double-column layout, and wider screens may use the three-column desktop layout.

## Secrets

Secrets are stored as a generic key/value structure so GST, SMS, and future
integrations can add fields without schema churn:

```json
{
    "secrets": [
        {
            "key": "CompanyGSTIN",
            "value": "29ABCDE1234F1Z5",
            "description": "GST registration number"
        },
        {
            "key": "SmsSenderId",
            "value": "VAULT",
            "description": "SMS routing"
        }
    ]
}
```

Sensitive values are stored in local application data and can be referenced in
formulas with `Secrets.Key`.
