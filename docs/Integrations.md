<!-- @format -->

# Optional Integrations

VaultBill keeps connected services in a JSON-backed key/value model so GST,
SMS, and future providers can expose whatever fields they need without changing
the settings surface.

The current implementation keeps provider choice small and explicit, but the
stored data remains flexible:

```json
{
    "gst": {
        "enabled": true,
        "provider": "local-gsp",
        "fields": [
            { "key": "ApiKey", "value": "stored-in-settings" },
            { "key": "BaseUrl", "value": "https://api.example" }
        ]
    },
    "sms": {
        "enabled": true,
        "provider": "local-relay",
        "fields": [{ "key": "SenderId", "value": "VAULT" }]
    }
}
```

Secrets remain masked in the UI and stored in local application data. Desktop
sessions may use host-side providers, while browser-only demo mode keeps
integration surfaces hidden.

GST-specific calculation helpers and print/report placeholders are documented in
the schema and builder docs rather than duplicated here.
