<!-- @format -->

# Secrets

VaultBill keeps shared integration values in a JSON-backed key/value model.
The Settings screen exposes one `Secrets` table with these fields:

- `key`
- `value`
- `description`

Use the values in formulas with the universal reference syntax:

```text
Secrets.Key
```

Example persisted data:

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

The repository keeps the storage flexible so GST, SMS, and future integrations
can share the same settings surface without introducing extra schema splits.
