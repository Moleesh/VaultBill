/** @format */

// @vitest-environment node

import { afterEach, describe, expect, it } from 'vitest';

import { runDatabaseStartupChecks } from '../../startup/DatabaseStartup';
import { openNodeSqliteConnection } from '../sqliteAdapter';
import type { SqliteConnection } from '../../sqlite/SqliteConnection';
import type { PrintTemplateConfig } from '../../../engines/printEngine/PrintTemplateTypes';
import {
    listPrintTemplateAssets,
    loadPrintTemplate,
    savePrintTemplate,
    savePrintTemplateAsset,
} from '../printTemplateRepository';

let connection: SqliteConnection | undefined;

const fixedNow = '2026-06-04T10:00:00.000Z';

const templateConfig: PrintTemplateConfig = {
    TemplateId: 'TaxInvoiceA4',
    TemplateName: 'Tax Invoice A4',
    Scope: 'Record',
    Mappings: {
        'Record.CustomerName': {
            SourceField: 'CustomerName',
            SampleValue: 'Sample Customer',
        },
    },
};

const openStartedDatabase = () => {
    connection = openNodeSqliteConnection(':memory:');
    runDatabaseStartupChecks(connection, { nowIso: () => fixedNow });
    return connection;
};

afterEach(() => {
    connection?.close();
    connection = undefined;
});

describe('printTemplateRepository', () => {
    it('stores sanitized template HTML, template JSON, and DB-backed assets', () => {
        const db = openStartedDatabase();

        savePrintTemplate(db, {
            templateId: 'TaxInvoiceA4',
            templateName: 'Tax Invoice A4',
            templateHtml: '<style>.page{page-break-after:always}</style>{{Record.CustomerName}}',
            templateConfig,
            scope: 'Record',
            updatedAt: fixedNow,
        });
        savePrintTemplateAsset(db, {
            assetId: 'asset_1',
            templateId: 'TaxInvoiceA4',
            assetName: 'CompanyLogo',
            mimeType: 'image/png',
            assetBlob: new Uint8Array([1, 2, 3]),
            sizeBytes: 3,
            createdAt: fixedNow,
        });

        expect(loadPrintTemplate(db, 'TaxInvoiceA4')).toMatchObject({
            templateId: 'TaxInvoiceA4',
            templateName: 'Tax Invoice A4',
            scope: 'Record',
            templateConfig,
        });
        expect(listPrintTemplateAssets(db, 'TaxInvoiceA4')).toMatchObject([
            {
                assetId: 'asset_1',
                assetName: 'CompanyLogo',
                sizeBytes: 3,
            },
        ]);
    });

    it('rejects unsafe HTML and mismatched template metadata before saving', () => {
        const db = openStartedDatabase();

        expect(() => {
            savePrintTemplate(db, {
                templateId: 'TaxInvoiceA4',
                templateName: 'Tax Invoice A4',
                templateHtml: '<script>alert(1)</script>',
                templateConfig,
                scope: 'Record',
                updatedAt: fixedNow,
            });
        }).toThrow('blocked HTML tags');

        expect(() => {
            savePrintTemplate(db, {
                templateId: 'TaxInvoiceThermal',
                templateName: 'Tax Invoice Thermal',
                templateHtml: '{{Record.CustomerName}}',
                templateConfig,
                scope: 'Record',
                updatedAt: fixedNow,
            });
        }).toThrow('metadata must match');
    });
});
