/** @format */

import type { Dispatch, SetStateAction, ChangeEvent } from 'react';
import type { z } from 'zod';

import { requestHostedApi } from '../../runtime/HostedApi';
import { DocumentFormatConfigSchema } from '../../db/startup/ConfigSchemas';
import {
    confirmLargeFile,
    htmlStorageKey,
    mimeTypeFromName,
    storageKey,
    type AssetSummary,
} from './BuilderPageSupport';
type DocumentFormatConfig = z.infer<typeof DocumentFormatConfigSchema>;

type BuilderPageActionProps = {
    readonly capabilities: {
        readonly isLanBrowser: boolean;
    };
    readonly config: DocumentFormatConfig;
    readonly templateHtml: string;
    readonly assets: readonly AssetSummary[];
    readonly setConfig: Dispatch<SetStateAction<DocumentFormatConfig>>;
    readonly setTemplateHtml: Dispatch<SetStateAction<string>>;
    readonly setAssets: Dispatch<SetStateAction<readonly AssetSummary[]>>;
    readonly setMessage: Dispatch<SetStateAction<string>>;
    readonly setImportWarnings: Dispatch<SetStateAction<readonly string[]>>;
};

const orderConfigForPublish = (config: DocumentFormatConfig): DocumentFormatConfig => {
    const fields = [
        ...config.Fields.map((field) => ({ ...field })),
        ...(config.LineItemSections[0]?.Fields ?? []).map((field) => ({ ...field })),
    ];
    const calculatedIds = new Set(
        fields.filter((field) => field.Calculated && field.Formula).map((field) => field.FieldId),
    );
    const ordered: string[] = [];
    const visited = new Set<string>();
    const visit = (fieldId: string) => {
        if (visited.has(fieldId)) return;
        visited.add(fieldId);
        const field = fields.find((candidate) => candidate.FieldId === fieldId);
        if (!field || !calculatedIds.has(field.FieldId)) return;
        for (const reference of field.Formula?.matchAll(/\b([A-Za-z_][\w]*)\b/gu) ?? []) {
            const nextId = reference[1];
            if (nextId) visit(nextId);
        }
        ordered.push(field.FieldId);
    };
    for (const field of fields) visit(field.FieldId);
    const orderById = new Map(ordered.map((fieldId, index) => [fieldId, index + 1]));
    const apply = (field: DocumentFormatConfig['Fields'][number]) => {
        const order = orderById.get(field.FieldId);
        return order ? { ...field, CalculationOrder: order } : field;
    };
    return {
        ...config,
        Fields: config.Fields.map(apply),
        LineItemSections: config.LineItemSections.map((section) => ({
            ...section,
            Fields: section.Fields.map(apply),
        })),
    };
};

/** Builds the import, asset, and publish actions for the builder page. */
export const useBuilderPageActions = ({
    capabilities,
    config,
    templateHtml,
    assets,
    setConfig,
    setTemplateHtml,
    setAssets,
    setMessage,
    setImportWarnings,
}: BuilderPageActionProps) => {
    const importJson = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.currentTarget.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024 && !confirmLargeFile(file.name, file.size)) return;
        try {
            const text = await file.text();
            const raw = JSON.parse(text) as Record<string, unknown>;
            const imported = DocumentFormatConfigSchema.parse(raw.Format ?? raw);
            setConfig(imported);
            setImportWarnings(
                Object.keys(raw)
                    .filter((key) => !['PackageVersion', 'Format'].includes(key))
                    .map(
                        (key) =>
                            `Unknown package property "${key}" was preserved in the source file.`,
                    ),
            );
            setMessage(`Imported ${file.name}. Review every step before publishing.`);
        } catch (reason) {
            setMessage(reason instanceof Error ? reason.message : 'The JSON package is invalid.');
        }
        event.currentTarget.value = '';
    };

    const importHtml = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.currentTarget.files?.[0];
        if (!file) return;
        if (!file.name.toLocaleLowerCase().endsWith('.html')) {
            setMessage('Print templates must be a single .html file.');
            return;
        }
        if (file.size > 5 * 1024 * 1024 && !confirmLargeFile(file.name, file.size)) return;
        try {
            const html = await file.text();
            if (
                /<\s*(script|iframe|object|embed|form)\b/iu.test(html) ||
                /\son\w+\s*=/iu.test(html)
            ) {
                setMessage('The HTML contains blocked active content.');
                return;
            }
            setTemplateHtml(html);
            setMessage(`${file.name} uploaded and ready for final preview.`);
        } catch (reason) {
            setMessage(reason instanceof Error ? reason.message : 'The HTML template is invalid.');
        }
        event.currentTarget.value = '';
    };

    const importAssets = async (event: ChangeEvent<HTMLInputElement>) => {
        const files = [...(event.currentTarget.files ?? [])];
        const unusuallyLarge = files.filter((file) => file.size > 20 * 1024 * 1024);
        if (unusuallyLarge.length > 0 && !window.confirm('Some assets are very large. Continue?')) {
            event.currentTarget.value = '';
            return;
        }
        const allowed = new Set([
            'image/png',
            'image/jpeg',
            'image/webp',
            'image/svg+xml',
            'font/woff',
            'font/woff2',
        ]);
        const accepted = files.filter(
            (file) => allowed.has(file.type) || /\.(png|jpe?g|webp|svg|woff2?)$/iu.test(file.name),
        );
        const nextAssets = await Promise.all(
            accepted.map(async (file) => ({
                name: file.name.replace(/\.[^.]+$/u, ''),
                type: file.type || mimeTypeFromName(file.name),
                size: file.size,
                dataBase64: window.btoa(
                    String.fromCharCode(...new Uint8Array(await file.arrayBuffer())),
                ),
            })),
        );
        setAssets((current) => [
            ...current.filter(
                (asset) => !nextAssets.some((candidate) => candidate.name === asset.name),
            ),
            ...nextAssets,
        ]);
        setMessage(`${String(nextAssets.length)} assets imported.`);
        event.currentTarget.value = '';
    };

    const publish = async (): Promise<void> => {
        const orderedConfig: DocumentFormatConfig = orderConfigForPublish(config);
        const builderPackage: {
            readonly config: DocumentFormatConfig;
            readonly templateHtml: string;
            readonly assets: readonly AssetSummary[];
        } = { config: orderedConfig, templateHtml, assets };
        try {
            if (window.vaultBillDesktop) {
                await window.vaultBillDesktop.saveBuilderPackage(builderPackage);
            } else if (capabilities.isLanBrowser) {
                await requestHostedApi<unknown>('/builder/package', 'POST', builderPackage);
            } else {
                window.localStorage.setItem(storageKey, JSON.stringify(config));
                window.localStorage.setItem(htmlStorageKey, templateHtml);
            }
            setMessage('Format, print template, and assets published.');
        } catch (reason: unknown) {
            setMessage(reason instanceof Error ? reason.message : 'Publish failed.');
        }
    };

    return { importAssets, importHtml, importJson, publish };
};
