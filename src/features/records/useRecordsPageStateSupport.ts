/** @format */

import { useForm } from '@tanstack/react-form';

import { builtInDocumentFormatSummaries } from '../../constants/BuiltInDocumentFormats';
import { type AppRecord, type EditableRecord } from './RecordStoreContext';

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

/** Locates the currently selected stored record inside the editable records collection. */
export const findSelectedStoredRecord = (records: readonly AppRecord[], record: EditableRecord) =>
    records.find((item) => item.recordId === record.recordId);
