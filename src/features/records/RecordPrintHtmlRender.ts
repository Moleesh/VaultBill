/** @format */

import type { DocumentFormatConfig } from '../../db/startup/ConfigSchemas';
import type { AppRecord, EditableRecord } from './RecordStoreContext';
import { calculateRecordTotals } from './RecordTotals';
import { escapePrintHtml, readBusinessProfile, recordFieldValue } from './RecordPrintHtmlSupport';

type PrintPackageLike = {
    readonly config: DocumentFormatConfig;
    readonly templateHtml: string;
    readonly assets: readonly {
        readonly name: string;
        readonly type: string;
        readonly dataBase64: string;
    }[];
};

const renderFallbackRecordHtml = (
    record: EditableRecord,
    stored: AppRecord | undefined,
): string => {
    const totals = calculateRecordTotals(record);
    return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>${escapePrintHtml(stored?.documentNumber ?? 'VaultBill Draft')}</title>
    <style>
      body { font-family: sans-serif; margin: 32px; color: #102f2b; }
      table { width: 100%; border-collapse: collapse; margin-top: 24px; }
      th, td { border-bottom: 1px solid #c7d9d5; padding: 10px; text-align: left; }
      .summary {
        margin-top: 24px;
        display: grid;
        gap: 12px;
        justify-content: end;
      }
      .summary div {
        display: flex;
        justify-content: space-between;
        min-width: 240px;
        gap: 24px;
        padding-top: 8px;
        border-top: 1px solid #c7d9d5;
      }
      .summary div:last-child {
        font-size: 1.15rem;
        font-weight: 700;
      }
      .cancelled { color: #9b2c2c; font-size: 2rem; font-weight: 800; text-align: center; }
    </style>
  </head>
  <body>
    ${stored?.status === 'Cancelled' ? '<div class="cancelled">CANCELLED</div>' : ''}
    <h1>${escapePrintHtml(record.formatName)}</h1>
    <p>${escapePrintHtml(stored?.documentNumber ?? 'Draft copy')} · ${escapePrintHtml(record.invoiceDate)}</p>
    <h2>${escapePrintHtml(record.customerName)}</h2>
    <p>${escapePrintHtml(record.billingAddress)}</p>
    <table>
      <thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Tax</th><th>Amount</th></tr></thead>
      <tbody>
        ${record.lineItems
            .map(
                (item) =>
                    `<tr><td>${escapePrintHtml(item.itemName)}</td><td>${escapePrintHtml(item.quantity)}</td><td>${escapePrintHtml(item.rate)}</td><td>${escapePrintHtml(item.taxPercent)}%</td><td>${escapePrintHtml(item.amount)}</td></tr>`,
            )
            .join('')}
      </tbody>
    </table>
    <div class="summary">
      <div><span>Subtotal</span><strong>₹${escapePrintHtml(totals.subtotal)}</strong></div>
      <div><span>GST / tax</span><strong>₹${escapePrintHtml(totals.taxTotal)}</strong></div>
      <div><span>Round off</span><strong>₹${escapePrintHtml(totals.roundOff)}</strong></div>
      <div><span>Total</span><strong>₹${escapePrintHtml(totals.grandTotal)}</strong></div>
    </div>
  </body>
</html>`;
};

const renderConfiguredRecordHtml = (
    record: EditableRecord,
    stored: AppRecord | undefined,
    printPackage: PrintPackageLike,
): string => {
    const business = readBusinessProfile();
    const totals = calculateRecordTotals(record);
    const itemRows = record.lineItems
        .map(
            (item) =>
                `<tr><td>${escapePrintHtml(item.itemName)}</td><td>${escapePrintHtml(item.hsnSac)}</td><td>${escapePrintHtml(item.quantity)}</td><td>${escapePrintHtml(item.rate)}</td><td>${escapePrintHtml(item.taxPercent)}</td><td>${escapePrintHtml(item.amount)}</td></tr>`,
        )
        .join('');
    const itemTable = `<table><thead><tr><th>Item</th><th>HSN/SAC</th><th>Quantity</th><th>Rate</th><th>Tax %</th><th>Amount</th></tr></thead><tbody>${itemRows}</tbody></table>`;
    const values: Record<string, string> = {
        'Company.Name': business.companyName,
        'Company.Address': business.address,
        'Company.Gstin': business.gstin,
        'Record.Number': stored?.documentNumber ?? 'Draft copy',
        'Record.Status': stored?.status ?? 'Draft',
        'Record.IsCancelled': String(stored?.status === 'Cancelled'),
        'Record.CancellationReason': stored?.cancellationReason ?? '',
        'Record.InvoiceDate': record.invoiceDate,
        'Record.CustomerName': record.customerName,
        'Record.CustomerGstin': record.gstin,
        'Record.Gstin': record.gstin,
        'Record.State': record.state,
        'Record.BillingAddress': record.billingAddress,
        'Record.Subtotal': totals.subtotal,
        'Record.TaxTotal': totals.taxTotal,
        'Record.RoundOff': totals.roundOff,
        'Record.GrandTotal': totals.grandTotal,
        'Record.FormatName': record.formatName,
        Items: itemTable,
        'Items.Table': itemTable,
        'Items.Rows': itemRows,
    };
    for (const field of [
        ...printPackage.config.Fields,
        ...printPackage.config.LineItemSections.flatMap((section) => section.Fields),
    ]) {
        values[`Record.${field.FieldId}`] = recordFieldValue(field.FieldId, record);
    }
    for (const asset of printPackage.assets) {
        values[`Asset.${asset.name}`] = `data:${asset.type};base64,${asset.dataBase64}`;
    }
    return printPackage.templateHtml.replace(
        /\{\{\s*([^}]+?)\s*\}\}/gu,
        (_match, rawKey: string) => {
            const key = rawKey.trim();
            const value = values[key] ?? '';
            return key.startsWith('Asset.') || key.startsWith('Items')
                ? value
                : escapePrintHtml(value);
        },
    );
};

/** Renders one record with template placeholders resolved against the record. */
export const renderRecordHtml = (
    record: EditableRecord,
    stored: AppRecord | undefined,
    printPackage?: PrintPackageLike,
): string =>
    printPackage
        ? renderConfiguredRecordHtml(record, stored, printPackage)
        : renderFallbackRecordHtml(record, stored);
