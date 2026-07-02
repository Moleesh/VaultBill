/** @format */

/**
 * Resolves print templates for desktop and hosted-web output, then renders the
 * final record or bulk print HTML.
 */

import type { DocumentFormatConfig } from '../../db/startup/ConfigSchemas';
import { fetchBuilderPackage } from '../../query/RuntimeQueries';
import type { WorkspaceSettings } from '../../runtime/WorkspaceSettings';
import type { AppRecord, EditableRecord } from './RecordStoreContext';
import { extractDocumentFragment } from './RecordPrintHtmlSupport';
import { renderRecordHtml as renderRecordDocumentHtml } from './RecordPrintHtmlRender';

/** Describes a published document format and the HTML/assets used for print. */
export type RecordPrintPackage = {
    readonly config: DocumentFormatConfig;
    readonly templateHtml: string;
    readonly assets: readonly {
        readonly name: string;
        readonly type: string;
        readonly dataBase64: string;
    }[];
};

/** Loads a print package from the desktop bridge or hosted API. */
export const loadRecordPrintPackage = async (
    formatId: string,
    isHostedWeb: boolean,
): Promise<RecordPrintPackage | undefined> => {
    const builderPackage = await fetchBuilderPackage({
        capabilities: { isHostedWeb },
        formatId,
    });
    return builderPackage ? (builderPackage as RecordPrintPackage) : undefined;
};

/** Renders one record with template placeholders resolved against the record. */
export const renderRecordHtml = (
    record: EditableRecord,
    stored: AppRecord | undefined,
    printPackage?: RecordPrintPackage,
    business: Pick<WorkspaceSettings, 'companyName' | 'address' | 'gstin'> = {
        companyName: '',
        address: '',
        gstin: '',
    },
): string => renderRecordDocumentHtml(record, stored, printPackage, business);

/** Concatenates multiple rendered record documents in stable order. */
export const combineRecordHtml = (
    records: readonly AppRecord[],
    packages: ReadonlyMap<string, RecordPrintPackage> = new Map(),
    business: Pick<WorkspaceSettings, 'companyName' | 'address' | 'gstin'> = {
        companyName: '',
        address: '',
        gstin: '',
    },
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
            const document = renderRecordHtml(
                record,
                record,
                packages.get(record.formatId),
                business,
            );
            return `<section class="vaultbill-print-page">${extractDocumentFragment(document)}</section>`;
        })
        .join('')}
  </body>
</html>`;
