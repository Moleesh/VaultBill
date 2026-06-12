/** @format */

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { z } from 'zod';

import { useCapabilities } from '../../capability/CapabilityContext';
import { builtInDefaultPrintTemplateHtml } from '../../db/startup/BuiltInDefaultPrintTemplate';
import { DocumentFormatConfigSchema } from '../../db/startup/ConfigSchemas';
import { requestHostedApi } from '../../runtime/HostedApi';
import {
    base64ByteLength,
    builtInSampleAsset,
    htmlStorageKey,
    readConfig,
    steps,
    type BuilderLayoutConfig,
    type AssetSummary,
    type BuilderStep,
    type StoredBuilderPackage,
} from './BuilderPageSupport';
import { validateCalculationGraph } from './BuilderPageCalculationSupport';
import { useBuilderPageActions } from './useBuilderPageActions';

type EditingState = { readonly kind: 'document' | 'line'; readonly index: number } | undefined;
type DocumentFormatConfig = z.infer<typeof DocumentFormatConfigSchema> & {
    readonly Layout?: BuilderLayoutConfig;
};
type FieldConfig = DocumentFormatConfig['Fields'][number];

/** Keeps the builder state, loading, and rendering actions in a compact hook. */
export const useBuilderPageController = () => {
    const capabilities = useCapabilities();
    const [searchParams] = useSearchParams();
    const requestedFormatId = searchParams.get('format') ?? undefined;
    const [stepIndex, setStepIndex] = useState(() =>
        searchParams.get('step') === 'preview' ? steps.length - 1 : 0,
    );
    const [config, setConfig] = useState<DocumentFormatConfig>(() => readConfig());
    const [templateHtml, setTemplateHtml] = useState(
        () => window.localStorage.getItem(htmlStorageKey) ?? builtInDefaultPrintTemplateHtml,
    );
    const [assets, setAssets] = useState<readonly AssetSummary[]>(() => [builtInSampleAsset]);
    const [editing, setEditing] = useState<EditingState>();
    const [message, setMessage] = useState('');
    const [importWarnings, setImportWarnings] = useState<readonly string[]>([]);

    const activeStep: BuilderStep = steps[stepIndex] ?? 'Format';
    const lineSection: DocumentFormatConfig['LineItemSections'][number] | undefined =
        config.LineItemSections[0];
    const editingField =
        editing?.kind === 'document'
            ? config.Fields[editing.index]
            : editing?.kind === 'line'
              ? lineSection?.Fields[editing.index]
              : undefined;
    const allFields: readonly FieldConfig[] = useMemo(
        () => [...config.Fields, ...(lineSection?.Fields ?? [])],
        [config.Fields, lineSection?.Fields],
    );
    const referencedFieldIds = new Set<string>();
    for (const field of allFields) {
        for (const reference of field.Formula?.matchAll(/\b([A-Za-z_][\w]*)\b/gu) ?? []) {
            const match = reference[1];
            if (match) referencedFieldIds.add(match);
        }
    }
    const validation = useMemo<readonly string[]>(() => {
        const result = DocumentFormatConfigSchema.safeParse(config);
        const errors = result.success ? [] : result.error.issues.map((issue) => issue.message);
        const ids = [
            ...config.Fields.map((field) => field.FieldId),
            ...(lineSection?.Fields.map((field) => field.FieldId) ?? []),
        ];
        if (new Set(ids).size !== ids.length) errors.push('Every field ID must be unique.');
        for (const field of [...config.Fields, ...(lineSection?.Fields ?? [])]) {
            if (field.Calculated && !field.Formula?.trim()) {
                errors.push(`${field.Label} is calculated but has no formula.`);
            }
        }
        errors.push(...validateCalculationGraph(allFields));
        if (!templateHtml.trim()) errors.push('Upload one HTML print template.');
        return errors;
    }, [allFields, config, lineSection?.Fields, templateHtml]);

    useEffect(() => {
        const applyPackage = (stored: StoredBuilderPackage | undefined) => {
            if (!stored) return;
            const parsedConfig: DocumentFormatConfig = DocumentFormatConfigSchema.parse(
                stored.config,
            );
            setConfig(parsedConfig);
            setTemplateHtml(stored.templateHtml);
            const nextAssets: readonly AssetSummary[] = stored.assets.map((asset) => ({
                ...asset,
                size: base64ByteLength(asset.dataBase64),
            }));
            setAssets(nextAssets);
        };
        if (window.vaultBillDesktop) {
            void window.vaultBillDesktop.loadBuilderPackage(requestedFormatId).then((stored) => {
                applyPackage(stored);
            });
        } else if (capabilities.isLanBrowser) {
            const query = requestedFormatId
                ? `?formatId=${encodeURIComponent(requestedFormatId)}`
                : '';
            void requestHostedApi<StoredBuilderPackage | undefined>(`/builder/package${query}`)
                .then(applyPackage)
                .catch((reason: unknown) => {
                    setMessage(
                        reason instanceof Error
                            ? reason.message
                            : 'Builder data could not be loaded.',
                    );
                });
        }
    }, [capabilities.isLanBrowser, requestedFormatId]);

    const updateFields = (kind: 'document' | 'line', fields: readonly FieldConfig[]) => {
        if (kind === 'document') {
            setConfig({ ...config, Fields: [...fields] });
            return;
        }
        if (!lineSection) return;
        setConfig({ ...config, LineItemSections: [{ ...lineSection, Fields: [...fields] }] });
    };

    const actions = useBuilderPageActions({
        assets,
        capabilities: { isLanBrowser: capabilities.isLanBrowser },
        config,
        setAssets,
        setConfig,
        setImportWarnings,
        setMessage,
        setTemplateHtml,
        templateHtml,
    });

    return {
        ...actions,
        activeStep,
        allFields,
        assets,
        config,
        editing,
        editingField,
        importWarnings,
        lineSection,
        message,
        referencedFieldIds,
        setAssets,
        setConfig,
        setEditing,
        setStepIndex,
        stepIndex,
        templateHtml,
        updateFields,
        validation,
    };
};

export type BuilderPageController = ReturnType<typeof useBuilderPageController>;
