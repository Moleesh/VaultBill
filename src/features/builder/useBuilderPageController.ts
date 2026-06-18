/** @format */
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCapabilities } from '../../capability/CapabilityContext';
import { builtInDefaultFormat } from '../../db/startup/BuiltInDefaultFormat';
import { builtInDefaultPrintTemplateHtml } from '../../db/startup/BuiltInDefaultPrintTemplate';
import { DocumentFormatConfigSchema } from '../../db/startup/ConfigSchemas';
import { requestHostedApi } from '../../runtime/HostedApi';
import {
    normalizeSecretsSettings,
    secretValuesFromSettings,
} from '../settings/SettingsSecretsSectionSupport';
import {
    builtInSampleAsset,
    steps,
    type BuilderStep,
    type AssetSummary,
    type SavedPrintTemplate,
} from './BuilderPageSupport';
import {
    defaultSavedPrintTemplates,
    findSavedPrintTemplate,
    removeSavedPrintTemplate,
} from './BuilderSavedTemplatesSupport';
import {
    collectCalculationTargets,
    validateCalculationGraph,
} from './BuilderPageCalculationSupport';
import {
    type DocumentFormatConfig,
    type EditingState,
    type FieldConfig,
    updateBuilderCalculationOrder,
    updateBuilderFields,
} from './BuilderPageControllerSupport';
import { useBuilderDocumentLibrary } from './useBuilderDocumentLibrary';
import { useBuilderPageActions } from './useBuilderPageActions';

/** Keeps the builder state, loading, and rendering actions in a compact hook. */
export const useBuilderPageController = () => {
    const capabilities = useCapabilities();
    const [searchParams, setSearchParams] = useSearchParams();
    const [stepIndex, setStepIndex] = useState(() =>
        searchParams.get('step') === 'preview' ? steps.length - 1 : 0,
    );
    const [viewMode, setViewMode] = useState<'library' | 'builder'>(() =>
        searchParams.get('format') ? 'builder' : 'library',
    );
    const [config, setConfig] = useState<DocumentFormatConfig>(
        () => JSON.parse(JSON.stringify(builtInDefaultFormat)) as DocumentFormatConfig,
    );
    const [templateHtml, setTemplateHtml] = useState(builtInDefaultPrintTemplateHtml);
    const [savedTemplates, setSavedTemplates] = useState<readonly SavedPrintTemplate[]>(() =>
        defaultSavedPrintTemplates(),
    );
    const [assets, setAssets] = useState<readonly AssetSummary[]>(() => [builtInSampleAsset]);
    const [editing, setEditing] = useState<EditingState>();
    const [message, setMessage] = useState('');
    const [importWarnings, setImportWarnings] = useState<readonly string[]>([]);
    const [secretValues, setSecretValues] = useState<Readonly<Record<string, string>>>({});

    const activeStep: BuilderStep = steps[stepIndex] ?? 'Format';
    const lineSection: DocumentFormatConfig['LineItemSections'][number] | undefined =
        config.LineItemSections[0];
    const lineSectionEnabled = lineSection?.Enabled !== false;
    const editingField =
        editing?.kind === 'document'
            ? config.Fields[editing.index]
            : editing?.kind === 'line'
              ? lineSection?.Fields[editing.index]
              : undefined;
    const allFields: readonly FieldConfig[] = useMemo(
        () => [...config.Fields, ...(lineSectionEnabled ? (lineSection?.Fields ?? []) : [])],
        [config.Fields, lineSection?.Fields, lineSectionEnabled],
    );
    const activeTemplateName =
        findSavedPrintTemplate(savedTemplates, templateHtml)?.name ?? savedTemplates[0]?.name;
    const calculationTargets = useMemo(() => collectCalculationTargets(config), [config]);
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
        const request = window.vaultBillDesktop
            ? window.vaultBillDesktop.getSecretsSettings()
            : capabilities.isLanBrowser
              ? requestHostedApi('/settings/secrets')
              : undefined;
        void request?.then((rawSettings) => {
            const normalized = normalizeSecretsSettings(rawSettings);
            setSecretValues(secretValuesFromSettings(normalized.secrets));
        });
    }, [capabilities.isLanBrowser]);

    const documentLibrary = useBuilderDocumentLibrary({
        capabilities: { isLanBrowser: capabilities.isLanBrowser },
        config,
        savedTemplates,
        setAssets,
        setConfig,
        setMessage,
        setSavedTemplates,
        setTemplateHtml,
        setViewMode,
    });

    const actions = useBuilderPageActions({
        assets,
        capabilities: { isLanBrowser: capabilities.isLanBrowser },
        config,
        savedTemplates,
        setAssets,
        setConfig,
        setImportWarnings,
        setMessage,
        setSavedTemplates,
        setTemplateHtml,
        templateHtml,
    });

    return {
        ...actions,
        ...documentLibrary,
        publish: async () => {
            await actions.publish();
            await documentLibrary.refreshInventory();
        },
        openBuilder: () => {
            setViewMode('builder');
            setStepIndex(0);
        },
        activeStep,
        allFields,
        assets,
        config,
        calculationTargets,
        activeTemplateName,
        editing,
        editingField,
        importWarnings,
        lineSection,
        message,
        savedTemplates,
        secretValues,
        referencedFieldIds,
        setAssets,
        setConfig,
        setEditing,
        setSavedTemplates,
        setStepIndex,
        setTemplateHtml,
        stepIndex,
        templateHtml,
        viewMode,
        closeBuilder: () => {
            setViewMode('library');
            setSearchParams((current) => {
                const next = new URLSearchParams(current);
                next.delete('step');
                next.delete('format');
                return next;
            });
        },
        updateCalculationOrder: (orderedFieldIds: readonly string[]) => {
            setConfig(updateBuilderCalculationOrder(config, orderedFieldIds));
        },
        lineSectionEnabled,
        setActiveTemplateName: (templateName: string) => {
            const selected = findSavedPrintTemplate(savedTemplates, templateName);
            if (!selected) return;
            setTemplateHtml(selected.templateHtml);
        },
        removeSavedTemplate: (templateName: string) => {
            const nextTemplates = removeSavedPrintTemplate(savedTemplates, templateName);
            const nextFallback = defaultSavedPrintTemplates();
            setSavedTemplates(nextTemplates.length > 0 ? nextTemplates : nextFallback);
            const selected = nextTemplates[0] ?? nextFallback[0];
            if (selected) setTemplateHtml(selected.templateHtml);
        },
        updateFields: (kind: 'document' | 'line', fields: readonly FieldConfig[]) => {
            setConfig(updateBuilderFields(config, lineSection, kind, fields));
        },
        validation,
    };
};
export type BuilderPageController = ReturnType<typeof useBuilderPageController>;
