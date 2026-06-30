/** @format */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useCapabilities } from '../../capability/CapabilityContext';
import { builtInDefaultFormat } from '../../db/startup/BuiltInDefaultFormat';
import {
    defaultWorkspaceSettings,
    loadWorkspaceSettings,
    type WorkspaceSettings,
} from '../../runtime/WorkspaceSettings';
import { useSession } from '../auth/SessionContext';
import { loadRecordPrintPackage, type RecordPrintPackage } from './RecordPrintHtml';
import {
    createEmptyRecord,
    knownDocumentFields,
    knownLineFields,
    normalizeId,
    toEditableRecord,
} from './RecordsPageSupport';
import type { OutputTask } from './RecordsPageOutputTypes';
import { calculateRecordTotals } from './RecordTotals';
import { useRecordStore, type EditableRecord } from './RecordStoreContext';
import {
    filterReprintRecords,
    findSelectedStoredRecord,
    loadPublishedFormats,
    loadRecordsSecretValues,
    resolveRecordsFormatOptions,
    useCreateRecordsReprintSearchForm,
    type PublishedFormat,
} from './useRecordsPageStateSupport';
import { isStaticHostedBrowserBuild } from '../../runtime/RuntimeMode';

/** Holds the record page data, derived values, and server-backed inventory. */
export const useRecordsPageState = () => {
    const capabilities = useCapabilities();
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
    const [activePrintPackage, setActivePrintPackage] = useState<RecordPrintPackage>();
    const [publishedFormats, setPublishedFormats] = useState<readonly PublishedFormat[]>([]);
    const [secretValues, setSecretValues] = useState<Readonly<Record<string, string>>>({});
    const [workspaceSettings, setWorkspaceSettings] =
        useState<WorkspaceSettings>(defaultWorkspaceSettings);
    const reprintSearchForm = useCreateRecordsReprintSearchForm();

    const activeTab: 'create' | 'reprint' =
        searchParams.get('tab') === 'reprint' ? 'reprint' : 'create';
    const selectedStoredRecord = findSelectedStoredRecord(records, record);
    const isReadOnly = actionState === 'Finalized' || actionState === 'Reprint';
    const formatOptions = resolveRecordsFormatOptions(
        publishedFormats,
        usesStaticHostedBrowserBuild,
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
        void loadPublishedFormats(capabilities.isHostedWeb)
            .then((formats) => {
                setPublishedFormats(formats);
            })
            .catch(() => {
                setPublishedFormats([]);
            });
    }, [capabilities.isHostedWeb]);

    useEffect(() => {
        void loadWorkspaceSettings(capabilities.isHostedWeb)
            .then(setWorkspaceSettings)
            .catch(() => {
                setWorkspaceSettings(defaultWorkspaceSettings);
            });
    }, [capabilities.isHostedWeb]);

    useEffect(() => {
        void loadRecordsSecretValues(capabilities.isHostedWeb)
            .then(setSecretValues)
            .catch(() => {
                setSecretValues({});
            });
    }, [capabilities.isHostedWeb]);

    useEffect(() => {
        setActivePrintPackage(undefined);
        void loadRecordPrintPackage(record.formatId, capabilities.isHostedWeb)
            .then(setActivePrintPackage)
            .catch(() => {
                setActivePrintPackage(undefined);
            });
    }, [capabilities.isHostedWeb, record.formatId]);

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
