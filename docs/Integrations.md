<!-- @format -->

# Optional Integrations

This is a supporting reference for the current integration split and provider
configuration. VaultBill does not guarantee GST, SMS provider, e-invoice, or
GSP compliance. Provider or validation failures must be shown as clear
user-facing messages.

VaultBill stores each connected service as a JSON-backed key/value collection so
GST, SMS, and future providers can add fields without changing the settings
surface.

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
