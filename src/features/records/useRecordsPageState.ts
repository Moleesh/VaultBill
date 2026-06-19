/** @format */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useCapabilities } from '../../capability/CapabilityContext';
import { builtInDefaultFormat } from '../../db/startup/BuiltInDefaultFormat';
import { builtInDocumentFormatSummaries } from '../../constants/BuiltInDocumentFormats';
import { requestHostedApi } from '../../runtime/HostedApi';
import {
    defaultWorkspaceSettings,
    loadWorkspaceSettings,
    type WorkspaceSettings,
} from '../../runtime/WorkspaceSettings';
import { useSession } from '../auth/SessionContext';
import {
    normalizeSecretsSettings,
    secretValuesFromSettings,
} from '../settings/SettingsSecretsSectionSupport';
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

type PublishedFormat = { readonly formatId: string; readonly formatName: string };

/** Holds the record page data, derived values, and server-backed inventory. */
export const useRecordsPageState = () => {
    const capabilities = useCapabilities();
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
    const [searchQuery, setSearchQuery] = useState('');
    const [outputTask, setOutputTask] = useState<OutputTask>();
    const [activePrintPackage, setActivePrintPackage] = useState<RecordPrintPackage>();
    const [publishedFormats, setPublishedFormats] = useState<readonly PublishedFormat[]>([]);
    const [secretValues, setSecretValues] = useState<Readonly<Record<string, string>>>({});
    const [workspaceSettings, setWorkspaceSettings] =
        useState<WorkspaceSettings>(defaultWorkspaceSettings);

    const activeTab: 'create' | 'reprint' =
        searchParams.get('tab') === 'reprint' ? 'reprint' : 'create';
    const selectedStoredRecord = records.find((item) => item.recordId === record.recordId);
    const isReadOnly = actionState === 'Finalized' || actionState === 'Reprint';
    // Fall back to bundled document formats until the desktop or hosted inventory is available.
    const formatOptions = (
        publishedFormats.length > 0
            ? publishedFormats
            : capabilities.isDemoMode
              ? builtInDocumentFormatSummaries.slice(0, 1)
              : builtInDocumentFormatSummaries
    ).map((format) => ({
        value: format.formatId,
        label: format.formatName,
    }));
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
    const reprintRecords = records.filter((item) => {
        const isPrintable = item.status === 'Finalized' || item.status === 'Cancelled';
        const query = searchQuery.trim().toLocaleLowerCase();
        return (
            isPrintable &&
            (!query ||
                item.customerName.toLocaleLowerCase().includes(query) ||
                item.documentNumber?.toLocaleLowerCase().includes(query))
        );
    });
    const { outputTarget, preferredPrinterName } = workspaceSettings;
    const printLabel = outputTarget === 'DownloadPdf' ? 'Print / PDF' : 'Print';
    const showShortcuts =
        !window.matchMedia('(pointer: coarse)').matches &&
        (capabilities.isDesktop || capabilities.isLanBrowser || capabilities.isDemoMode);

    useEffect(() => {
        const inventory = window.vaultBillDesktop
            ? window.vaultBillDesktop.listBuilderInventory()
            : capabilities.isLanBrowser
              ? requestHostedApi<readonly PublishedFormat[]>('/print/formats')
              : undefined;
        void inventory
            ?.then((formats) => {
                setPublishedFormats(formats);
            })
            .catch(() => {
                setPublishedFormats([]);
            });
    }, [capabilities.isLanBrowser]);

    useEffect(() => {
        void loadWorkspaceSettings(capabilities.isLanBrowser).then(setWorkspaceSettings);
    }, [capabilities.isLanBrowser]);

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

    useEffect(() => {
        setActivePrintPackage(undefined);
        void loadRecordPrintPackage(record.formatId, capabilities.isLanBrowser)
            .then(setActivePrintPackage)
            .catch(() => {
                setActivePrintPackage(undefined);
            });
    }, [capabilities.isLanBrowser, record.formatId]);

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
        secretValues,
        workspaceSettings,
        records,
        reprintRecords,
        searchParams,
        searchQuery,
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
        setSearchQuery,
        showShortcuts,
        saveDraft,
        toEditableRecord,
    };
};
