# JSON Config

This document summarizes the persisted JSON contracts validated by the current
schema, print, report, settings, and integration engines.

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

## Signature Pad

```json
{
  "SignaturePad": {
    "Enabled": true,
    "Mode": "Screen",
    "TestedUsbDevices": []
  }
}
```

`Mode` can be `Screen` or `UsbHid`. USB/HID support is desktop-only and only for
explicitly tested devices. Signature values are stored in `record_json` as SVG
path data strings.

## SMS Provider

```json
{
  "Enabled": true,
  "ProviderId": "generic-sms",
  "EndpointUrl": "https://sms.example/send",
  "SenderId": "VAULT",
  "UseServerSideProxy": true,
  "Secrets": {
    "ApiKey": "stored-in-settings",
    "ApiSecret": "stored-in-settings"
  }
}
```

Secrets are stored in DB settings and masked before display. Production web mode
must use a server-side provider flow.

## GST Integration

```json
{
  "Enabled": true,
  "DefaultSellerStateCode": "29",
  "HsnSacCatalog": [
    {
      "Code": "9983",
      "Description": "Professional services",
      "TaxRatePercent": "18"
    }
  ]
}
```

GST helpers validate GSTIN format/checksum, look up HSN/SAC catalog rows, split
same-state CGST/SGST, calculate interstate IGST, and escape GSTR export cells.

## GSP Integration

```json
{
  "Enabled": true,
  "ProviderId": "generic-gsp",
  "BaseUrl": "https://gsp.example/api",
  "Sandbox": true,
  "ClientId": "client",
  "ClientSecret": "secret",
  "Endpoints": {
    "EInvoice": "/einvoice",
    "Gstr": "/gstr"
  }
}
```

GSP hooks prepare generic POST request plans only. VaultBill does not guarantee
GST, e-invoice, GSTR, or provider compliance.
