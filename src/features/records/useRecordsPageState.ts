/** @format */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useQuery } from '@tanstack/react-query';

import { useCapabilities } from '../../capability/CapabilityContext';
import { builtInDefaultFormat } from '../../db/startup/BuiltInDefaultFormat';
import { getRuntimeQueryScope, queryKeys } from '../../query/QueryKeys';
import {
    fetchBuilderPackage,
    fetchPublishedFormats,
    fetchSecretsSettings,
    fetchWorkspaceSettings,
} from '../../query/RuntimeQueries';
import { isStaticHostedBrowserBuild } from '../../runtime/RuntimeMode';
import { defaultWorkspaceSettings, type WorkspaceSettings } from '../../runtime/WorkspaceSettings';
import { useSession } from '../auth/SessionContext';
import { secretValuesFromSettings } from '../settings/SettingsSecretsSectionSupport';
import type { RecordPrintPackage } from './RecordPrintHtml';
import type { OutputTask } from './RecordsPageOutputTypes';
import {
    createEmptyRecord,
    knownDocumentFields,
    knownLineFields,
    normalizeId,
    toEditableRecord,
} from './RecordsPageSupport';
import { useRecordStore, type EditableRecord } from './RecordStoreContext';
import { calculateRecordTotals } from './RecordTotals';

import {
    filterReprintRecords,
    findSelectedStoredRecord,
    resolveRecordsFormatOptions,
    useCreateRecordsReprintSearchForm,
} from './useRecordsPageStateSupport';

/** Holds the record page data, derived values, and server-backed inventory. */
export const useRecordsPageState = () => {
    const capabilities = useCapabilities();
    const runtimeScope = getRuntimeQueryScope(capabilities);
    const usesStaticHostedBrowserBuild = isStaticHostedBrowserBuild(capabilities);
    const { operatorContext } = useSession();
    const { cancelRecord, error, finalizeRecord, isLoading, records, saveDraft } = useRecordStore();
    const [searchParams, setSearchParams] = useSearchParams();
    const formRef = useRef<HTMLDivElement>(null);
    const [record, setRecord] = useState<EditableRecord>(createEmptyRecord);
    const [actionState, setActionState] = useState<
        'New' | 'DraftDirty' | 'DraftSaved' | 'Finalized' | 'Reprint'
    >('New');
    const [notice, setNotice] = useState('');
    const [operationError, setOperationError] = useState('');
    const [isFinalizeOpen, setIsFinalizeOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [outputTask, setOutputTask] = useState<OutputTask>();
    const reprintSearchForm = useCreateRecordsReprintSearchForm();
    const workspaceSettingsQuery = useQuery({
        queryKey: queryKeys.workspaceSettings(runtimeScope),
        queryFn: () => fetchWorkspaceSettings({ capabilities }),
        staleTime: Number.POSITIVE_INFINITY,
    });
    const publishedFormatsQuery = useQuery({
        queryKey: queryKeys.publishedFormats(runtimeScope),
        queryFn: () => fetchPublishedFormats({ capabilities }),
        refetchOnMount: 'always',
        staleTime: Number.POSITIVE_INFINITY,
    });
    const secretValuesQuery = useQuery({
        queryKey: queryKeys.secretsSettings(runtimeScope),
        queryFn: () => fetchSecretsSettings({ capabilities }),
        select: (settings) => secretValuesFromSettings(settings.secrets),
        staleTime: Number.POSITIVE_INFINITY,
    });
    const activePrintPackageQuery = useQuery({
        queryKey: queryKeys.builderPackage(runtimeScope, record.formatId || '__current__'),
        queryFn: () => fetchBuilderPackage({ capabilities, formatId: record.formatId }),
        enabled: record.formatId.trim().length > 0,
    });

    const activeTab: 'create' | 'reprint' =
        searchParams.get('tab') === 'reprint' ? 'reprint' : 'create';
    const selectedStoredRecord = findSelectedStoredRecord(records, record);
    const isReadOnly = actionState === 'Finalized' || actionState === 'Reprint';
    const workspaceSettings: WorkspaceSettings =
        workspaceSettingsQuery.data ?? defaultWorkspaceSettings;
    const publishedFormats = useMemo(
        () => publishedFormatsQuery.data ?? [],
        [publishedFormatsQuery.data],
    );
    const secretValues = secretValuesQuery.data ?? {};
    const activePrintPackage = activePrintPackageQuery.data as RecordPrintPackage | undefined;
    const defaultFormat = publishedFormats.find((format) => format.isDefault);
    const formatOptions = useMemo(
        () => resolveRecordsFormatOptions(publishedFormats, usesStaticHostedBrowserBuild),
        [publishedFormats, usesStaticHostedBrowserBuild],
    );
    const activeConfig = activePrintPackage?.config ?? builtInDefaultFormat;
    const recordTotals = useMemo(() => calculateRecordTotals(record), [record]);
    const configuredDocumentFields = useMemo(
        () =>
            activeConfig.Fields.filter(
                (field) => !knownDocumentFields.has(normalizeId(field.FieldId)),
            ),
        [activeConfig],
    );
    const configuredLineFields = useMemo(
        () =>
            (activeConfig.LineItemSections[0]?.Fields ?? []).filter(
                (field) => !knownLineFields.has(normalizeId(field.FieldId)),
            ),
        [activeConfig],
    );
    const reprintRecords = filterReprintRecords(
        records,
        reprintSearchForm.state.values.searchQuery,
    );
    const { outputTarget, preferredPrinterName } = workspaceSettings;
    const printLabel = outputTarget === 'DownloadPdf' ? 'Print / PDF' : 'Print';
    const showShortcuts =
        !window.matchMedia('(pointer: coarse)').matches &&
        (capabilities.isDesktop || capabilities.isHostedWeb || capabilities.isDemoMode);

    useEffect(() => {
        if (!defaultFormat || actionState !== 'New') return;
        setRecord((current) => {
            if (current.formatId === defaultFormat.formatId || current.customerName.trim()) {
                return current;
            }
            return {
                ...current,
                formatId: defaultFormat.formatId,
                formatName: defaultFormat.formatName,
            };
        });
    }, [actionState, defaultFormat]);

    useEffect(() => {
        if (formatOptions.length === 0) return;
        setRecord((current) => {
            if (formatOptions.some((format) => format.value === current.formatId)) {
                return current;
            }
            const fallbackFormat =
                formatOptions.find((format) => format.value === defaultFormat?.formatId) ??
                formatOptions[0];
            if (!fallbackFormat) return current;
            return {
                ...current,
                formatId: fallbackFormat.value,
                formatName: fallbackFormat.label,
            };
        });
    }, [defaultFormat?.formatId, formatOptions]);

    return {
        actionState,
        activeConfig,
        activePrintPackage,
        activeTab,
        cancelRecord,
        cancelReason,
        capabilities,
        formatOptions,
        configuredDocumentFields,
        configuredLineFields,
        error,
        finalizeRecord,
        formRef,
        isCancelOpen,
        isFinalizeOpen,
        isLoading,
        isReadOnly,
        notice,
        operationError,
        outputTask,
        operatorContext,
        outputTarget,
        preferredPrinterName,
        printLabel,
        publishedFormats,
        record,
        recordTotals,
        reprintSearchForm,
        secretValues,
        workspaceSettings,
        records,
        reprintRecords,
        searchParams,
        selectedStoredRecord,
        setActionState,
        setCancelReason,
        setIsCancelOpen,
        setIsFinalizeOpen,
        setOutputTask,
        setNotice,
        setOperationError,
        setRecord,
        setSearchParams,
        showShortcuts,
        saveDraft,
        toEditableRecord,
    };
};
