/** @format */
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useQuery } from '@tanstack/react-query';

import { useCapabilities } from '../../capability/CapabilityContext';
import { builtInDefaultFormat } from '../../db/startup/BuiltInDefaultFormat';
import { builtInDefaultPrintTemplateHtml } from '../../db/startup/BuiltInDefaultPrintTemplate';
import { getRuntimeQueryScope, queryKeys } from '../../query/QueryKeys';
import { fetchSecretsSettings } from '../../query/RuntimeQueries';
import { secretValuesFromSettings } from '../settings/SettingsSecretsSectionSupport';
import { collectCalculationTargets } from './BuilderPageCalculationSupport';
import {
    collectReferencedFieldIds,
    validateBuilderConfig,
} from './BuilderPageControllerStateSupport';
import {
    updateBuilderCalculationOrder,
    updateBuilderFields,
    type DocumentFormatConfig,
    type EditingState,
    type FieldConfig,
} from './BuilderPageControllerSupport';
import {
    builtInSampleAsset,
    steps,
    type AssetSummary,
    type BuilderStep,
    type SavedPrintTemplate,
} from './BuilderPageSupport';
import {
    defaultSavedPrintTemplates,
    findSavedPrintTemplate,
    removeSavedPrintTemplate,
} from './BuilderSavedTemplatesSupport';

import { useBuilderDocumentLibrary } from './useBuilderDocumentLibrary';
import { useBuilderPageActions } from './useBuilderPageActions';

/** Keeps the builder state, loading, and rendering actions in a compact hook. */
export const useBuilderPageController = () => {
    const capabilities = useCapabilities();
    const runtimeScope = getRuntimeQueryScope(capabilities);
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
    const referencedFieldIds = useMemo(() => collectReferencedFieldIds(allFields), [allFields]);
    const validation = useMemo<readonly string[]>(
        () =>
            validateBuilderConfig({
                allFields,
                config,
                lineSection,
                templateHtml,
            }),
        [allFields, config, lineSection, templateHtml],
    );

    const builderSecretsQuery = useQuery({
        queryKey: queryKeys.secretsSettings(runtimeScope),
        queryFn: () => fetchSecretsSettings({ capabilities }),
        select: (settings) => secretValuesFromSettings(settings.secrets),
    });

    const documentLibrary = useBuilderDocumentLibrary({
        assets,
        capabilities,
        config,
        savedTemplates,
        setAssets,
        setConfig,
        setMessage,
        setSavedTemplates,
        setStepIndex,
        setTemplateHtml,
        setViewMode,
        templateHtml,
    });

    const actions = useBuilderPageActions({
        assets,
        capabilities: { isHostedWeb: capabilities.isHostedWeb },
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
            const didPublish = await actions.publish();
            if (!didPublish) return;
            await documentLibrary.refreshInventory();
            setViewMode('library');
            setSearchParams((current) => {
                const next = new URLSearchParams(current);
                next.delete('step');
                next.delete('format');
                return next;
            });
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
        secretValues: builderSecretsQuery.data ?? {},
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
