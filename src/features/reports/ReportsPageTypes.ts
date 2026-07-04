/** @format */

import type { RefObject } from 'react';

import type { CapabilityRegistry } from '../../capability/Capability.types';
import type { WorkspaceSettings } from '../../runtime/WorkspaceSettings';
import type { AppRecord } from '../records/RecordStoreSupport';
import type { PrintTask } from './ReportsPageSupport';
import type { SavedReportDefinition, SavedReportEditorInput } from './SavedReportsSupport';

import type { ReportsFilterFormApi } from './useReportsPageFilters';

export type ReportFieldFilter = {
    readonly id: string;
    readonly field: string;
    readonly operator?: string;
    readonly value: string;
    readonly valueEnd?: string;
    readonly caseInsensitive?: boolean;
    readonly promptAtRun?: boolean;
};

export type ReportsPageActionInput = {
    readonly capabilities: {
        readonly isHostedWeb: boolean;
    };
    readonly displayFields: readonly string[];
    readonly loadCompleteResult: () => Promise<readonly AppRecord[]>;
    readonly reportId: string;
    readonly totalRecords: number;
    readonly setTask: (task: PrintTask | undefined) => void;
    readonly setPrintSource: (records: readonly AppRecord[]) => void;
    readonly printSource: readonly AppRecord[];
    readonly workspaceSettings: Pick<WorkspaceSettings, 'companyName' | 'address' | 'gstin'>;
};

export type ReportsPageController = {
    readonly capabilities: CapabilityRegistry;
    readonly applyPreset: (value: string) => void;
    readonly addReportFilter: () => void;
    readonly browserMatchingRecords: readonly AppRecord[];
    readonly canPrintRecords: boolean;
    readonly customers: readonly string[];
    readonly error: string;
    readonly exportAll: () => void;
    readonly form: ReportsFilterFormApi;
    readonly fromDate: string;
    readonly canManageReport: (report: SavedReportDefinition) => boolean;
    readonly reportFilters: readonly ReportFieldFilter[];
    readonly savedReports: readonly SavedReportDefinition[];
    readonly selectedDisplayFields: readonly string[];
    readonly selectedSavedReportId: string;
    readonly isDynamicPromptOpen: boolean;
    readonly canAddReportFilter: boolean;
    readonly reportField: string;
    readonly reportFieldValue: string;
    readonly isLoading: boolean;
    readonly loadCompleteResult: () => Promise<readonly AppRecord[]>;
    readonly matchingRecords: readonly AppRecord[];
    readonly nextCursor: string | undefined;
    readonly pageError: string;
    readonly pageLoading: boolean;
    readonly preset: string;
    readonly printSource: readonly AppRecord[];
    readonly query: Readonly<Record<string, unknown>>;
    readonly reportId: string;
    readonly reset: () => void;
    readonly removeReportFilter: (id: string) => void;
    readonly runNextRecordBatch: (startAt?: number, suppliedRecords?: readonly AppRecord[]) => void;
    readonly runReportPrint: () => void;
    readonly sentinelRef: RefObject<HTMLDivElement | null>;
    readonly setFromDate: (value: string) => void;
    readonly setPageError: (value: string) => void;
    readonly setPreset: (value: string) => void;
    readonly setPrintSource: (records: readonly AppRecord[]) => void;
    readonly setReportId: (value: string) => void;
    readonly setSelectedSavedReportId: (value: string) => void;
    readonly saveCurrentReport: (input: SavedReportEditorInput) => void;
    readonly duplicateSelectedSavedReport: () => void;
    readonly canManageSelectedSavedReport: () => boolean;
    readonly setDefaultSavedReport: () => void;
    readonly deleteSavedReportById: (reportId: string) => void;
    readonly deleteSelectedSavedReport: () => void;
    readonly closeDynamicPrompt: () => void;
    readonly setReportField: (value: string) => void;
    readonly setReportFieldValue: (value: string) => void;
    readonly setServerRecords: (records: readonly AppRecord[]) => void;
    readonly setServerTotal: (value: number) => void;
    readonly setStatus: (value: string) => void;
    readonly setTask: (task: PrintTask | undefined) => void;
    readonly setToDate: (value: string) => void;
    readonly setVisibleCount: (count: number | ((current: number) => number)) => void;
    readonly updateReportFilter: (id: string, next: Partial<ReportFieldFilter>) => void;
    readonly status: string;
    readonly task: PrintTask | undefined;
    readonly toDate: string;
    readonly totalRecords: number;
    readonly trialExpired: boolean;
    readonly usesServerPaging: boolean;
    readonly visibleCount: number;
    readonly visibleRecords: readonly AppRecord[];
    readonly workspaceSettings: WorkspaceSettings;
};
