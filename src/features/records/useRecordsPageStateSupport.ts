/** @format */

import { useForm } from '@tanstack/react-form';

import { builtInDocumentFormatSummaries } from '../../constants/BuiltInDocumentFormats';
import {
    canUseLocalHostedApi,
    isHostedApiErrorStatus,
    requestHostedApi,
} from '../../runtime/HostedApi';
import {
    normalizeSecretsSettings,
    secretValuesFromSettings,
} from '../settings/SettingsSecretsSectionSupport';
import type { AppRecord, EditableRecord } from './RecordStoreContext';

/** Minimal published-format shape used by the records page picker and reprint flow. */
export type PublishedFormat = { readonly formatId: string; readonly formatName: string };

type RecordsReprintSearchFormValues = {
    readonly searchQuery: string;
};

const useRecordsReprintSearchForm = () =>
    useForm({
        defaultValues: {
            searchQuery: '',
        } satisfies RecordsReprintSearchFormValues,
    });

/** Shared TanStack form api used by the records reprint search panel and actions. */
export type RecordsReprintSearchFormApi = ReturnType<typeof useRecordsReprintSearchForm>;

/** Creates the shared reprint search form used by the records workspace tabs. */
export const useCreateRecordsReprintSearchForm = useRecordsReprintSearchForm;

/** Resolves the document format list from desktop inventory, hosted inventory, or bundled defaults. */
export const resolveRecordsFormatOptions = (
    publishedFormats: readonly PublishedFormat[],
    usesStaticHostedBrowserBuild: boolean,
) =>
    (publishedFormats.length > 0
        ? publishedFormats
        : usesStaticHostedBrowserBuild
          ? builtInDocumentFormatSummaries.slice(0, 1)
          : builtInDocumentFormatSummaries
    ).map((format) => ({
        value: format.formatId,
        label: format.formatName,
    }));

/** Filters stored records down to printable reprint candidates using the active search query. */
export const filterReprintRecords = (records: readonly AppRecord[], searchQuery: string) => {
    const query = searchQuery.trim().toLocaleLowerCase();
    return records.filter((item) => {
        const isPrintable = item.status === 'Finalized' || item.status === 'Cancelled';
        return (
            isPrintable &&
            (query.length === 0 ||
                item.customerName.toLocaleLowerCase().includes(query) ||
                item.documentNumber?.toLocaleLowerCase().includes(query))
        );
    });
};

/** Loads the published format inventory for desktop or hosted mode. */
export const loadPublishedFormats = async (
    isHostedWeb: boolean,
): Promise<readonly PublishedFormat[]> => {
    if (isHostedWeb || canUseLocalHostedApi()) {
        try {
            return await requestHostedApi<readonly PublishedFormat[]>('/print/formats');
        } catch {
            if (window.vaultBillDesktop) {
                return window.vaultBillDesktop.listBuilderInventory();
            }
        }
    }
    if (window.vaultBillDesktop) {
        return window.vaultBillDesktop.listBuilderInventory();
    }
    return [];
};

/** Loads shared secret values from the active runtime and normalizes them for formula use. */
export const loadRecordsSecretValues = async (
    isHostedWeb: boolean,
): Promise<Readonly<Record<string, string>>> => {
    let rawSettings: unknown;
    if (isHostedWeb || canUseLocalHostedApi()) {
        try {
            rawSettings = await requestHostedApi('/settings/secrets');
        } catch (error) {
            if (window.vaultBillDesktop) {
                rawSettings = await window.vaultBillDesktop.getSecretsSettings();
            } else if (isHostedApiErrorStatus(error, [401, 403, 404])) {
                rawSettings = undefined;
            } else {
                throw error;
            }
        }
    } else if (window.vaultBillDesktop) {
        rawSettings = await window.vaultBillDesktop.getSecretsSettings();
    }
    const normalized = normalizeSecretsSettings(rawSettings);
    return secretValuesFromSettings(normalized.secrets);
};

/** Locates the currently selected stored record inside the editable records collection. */
export const findSelectedStoredRecord = (records: readonly AppRecord[], record: EditableRecord) =>
    records.find((item) => item.recordId === record.recordId);
