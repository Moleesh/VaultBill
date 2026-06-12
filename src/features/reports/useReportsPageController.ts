/** @format */

import { useReportsPageActions } from './useReportsPageActions';
import { useReportsPageData } from './useReportsPageData';
import type { ReportsPageController } from './ReportsPageTypes';

export const useReportsPageController = (): ReportsPageController => {
    const data = useReportsPageData();
    const actions = useReportsPageActions({
        capabilities: data.capabilities,
        loadCompleteResult: data.loadCompleteResult,
        printSource: data.printSource,
        reportId: data.reportId,
        setPrintSource: data.setPrintSource,
        setTask: data.setTask,
        totalRecords: data.totalRecords,
    });
    return { ...data, ...actions };
};
