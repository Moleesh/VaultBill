/** @format */

import type { ReportsPageController } from './ReportsPageTypes';

import { useReportsPageActions } from './useReportsPageActions';
import { useReportsPageData } from './useReportsPageData';

export const useReportsPageController = (): ReportsPageController => {
    const data = useReportsPageData();
    const actions = useReportsPageActions({
        capabilities: data.capabilities,
        displayFields: data.selectedDisplayFields,
        loadCompleteResult: data.loadCompleteResult,
        printSource: data.printSource,
        reportId: data.reportId,
        setPrintSource: data.setPrintSource,
        setTask: data.setTask,
        totalRecords: data.totalRecords,
        workspaceSettings: data.workspaceSettings,
    });
    return { ...data, ...actions };
};
