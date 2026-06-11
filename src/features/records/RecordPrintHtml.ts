/**
 * eslint-disable max-lines
 *
 * @format
 */

import type { DocumentFormatConfig } from '../../db/startup/ConfigSchemas';
import { requestHostedApi } from '../../runtime/HostedApi';
import type { AppRecord, EditableRecord } from './RecordStoreContext';
import { calculateRecordTotals } from './RecordTotals';

export type RecordPrintPackage = {
    readonly config: DocumentFormatConfig;
    readonly templateHtml: string;
    readonly assets: readonly {
        readonly name: string;
        readonly type: string;
        readonly dataBase64: string;
    }[];
};

export const loadRecordPrintPackage = async (
    formatId: string,
    isLanBrowser: boolean,
): Promise<RecordPrintPackage | undefined> => {
    if (window.vaultBillDesktop) {
        return (await window.vaultBillDesktop.loadBuilderPackage(formatId)) as
            | RecordPrintPackage
            | undefined;
    }
    if (isLanBrowser) {
        return requestHostedApi<RecordPrintPackage | undefined>(
            `/print/template?formatId=${encodeURIComponent(formatId)}`,
        );
    }
    return undefined;
};

export const renderRecordHtml = (
    record: EditableRecord,
    stored: AppRecord | undefined,
    printPackage?: RecordPrintPackage,
): string =>
    printPackage
        ? renderConfiguredRecordHtml(record, stored, printPackage)
        : renderFallbackRecordHtml(record, stored);

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

export const combineRecordHtml = (
    records: readonly AppRecord[],
    packages: ReadonlyMap<string, RecordPrintPackage> = new Map(),
): string => `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>VaultBill records</title>
    <style>
      .vaultbill-print-page { break-after: page; page-break-after: always; }
      .vaultbill-print-page:last-child { break-after: auto; page-break-after: auto; }
    </style>
  </head>
  <body>
    ${records
        .map((record) => {
            const document = renderRecordHtml(record, record, packages.get(record.formatId));
            return `<section class="vaultbill-print-page">${extractDocumentFragment(document)}</section>`;
        })
        .join('')}
  </body>
</html>`;

export const escapePrintHtml = (value: string): string =>
    value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');

const renderConfiguredRecordHtml = (
    record: EditableRecord,
    stored: AppRecord | undefined,
    printPackage: RecordPrintPackage,
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

const recordFieldValue = (fieldId: string, record: EditableRecord): string => {
    const normalized = fieldId.toLocaleLowerCase();
    const totals = calculateRecordTotals(record);
    const directValues: Readonly<Record<string, string>> = {
        invoicedate: record.invoiceDate,
        customername: record.customerName,
        customergstin: record.gstin,
        gstin: record.gstin,
        state: record.state,
        billingaddress: record.billingAddress,
        subtotal: totals.subtotal,
        taxtotal: totals.taxTotal,
        roundoff: totals.roundOff,
        grandtotal: totals.grandTotal,
    };
    if (directValues[normalized] !== undefined) return directValues[normalized];
    const customValue = record.fieldValues?.[fieldId];
    if (customValue !== undefined) return customValue;
    const lineItemValues: Readonly<Record<string, string>> = {
        itemname: record.lineItems.map((item) => item.itemName).join(', '),
        hsnsac: record.lineItems.map((item) => item.hsnSac).join(', '),
        quantity: record.lineItems.map((item) => item.quantity).join(', '),
        rate: record.lineItems.map((item) => item.rate).join(', '),
        taxpercent: record.lineItems.map((item) => item.taxPercent).join(', '),
        amount: record.lineItems.map((item) => item.amount).join(', '),
    };
    return (
        lineItemValues[normalized] ??
        record.lineItems
            .map((item) => item.values?.[fieldId] ?? '')
            .filter(Boolean)
            .join(', ')
    );
};

const readBusinessProfile = (): {
    readonly companyName: string;
    readonly address: string;
    readonly gstin: string;
} => {
    try {
        const profile = JSON.parse(
            window.localStorage.getItem('vaultbill.business-profile') ?? '{}',
        ) as { companyName?: unknown; address?: unknown };
        return {
            companyName: typeof profile.companyName === 'string' ? profile.companyName : '',
            address: typeof profile.address === 'string' ? profile.address : '',
            gstin: window.localStorage.getItem('vaultbill.company-gstin') ?? '',
        };
    } catch {
        return { companyName: '', address: '', gstin: '' };
    }
};

const extractDocumentFragment = (document: string): string => {
    const styles = [...document.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/giu)]
        .map((match) => `<style>${match[1] ?? ''}</style>`)
        .join('');
    const body = /<body\b[^>]*>([\s\S]*?)<\/body>/iu.exec(document)?.[1] ?? document;
    return `${styles}${body
        .replace(/<!doctype[^>]*>/giu, '')
        .replace(/<\/?(?:html|head|body)\b[^>]*>/giu, '')}`;
};
