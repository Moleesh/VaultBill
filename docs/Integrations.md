<!-- @format -->

# Optional Integrations

Phase 20 adds optional integration contracts only. VaultBill does not guarantee
GST, SMS provider, signature hardware, e-invoice, or GSP compliance. Provider
or validation failures must be shown as clear user-facing messages.

## SMS

SMS uses a provider adapter pattern:

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

Secrets are stored in DB settings and masked before display. Production web
mode blocks direct secrets unless `UseServerSideProxy` is enabled.

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

Screen mode supports mouse/touch drawing. USB/HID mode is desktop-only and
available only for devices explicitly listed in `TestedUsbDevices`. Signature
values are stored in `record_json` as SVG path data strings.

## GST Helpers

Helpers include GSTIN format/checksum validation, HSN/SAC catalog lookup,
same-state CGST/SGST splitting, interstate IGST calculation, and GSTR export
cell escaping.

## GSP Hooks

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

GSP hooks prepare generic POST request plans. They are placeholders for provider
integration and do not claim compliance success.
