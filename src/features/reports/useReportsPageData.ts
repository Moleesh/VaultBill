/** @format */

import { useReportsPageFilters } from './useReportsPageFilters';
import { useReportsPagePaging } from './useReportsPagePaging';
import { useCapabilities } from '../../capability/CapabilityContext';

export const useReportsPageData = () => {
    const capabilities = useCapabilities();
    const filters = useReportsPageFilters();
    const paging = useReportsPagePaging(
        filters.query,
        filters.browserMatchingRecords,
        filters.visibleCount,
        filters.setVisibleCount,
        filters.status,
    );

    return {
        capabilities,
        ...filters,
        ...paging,
        error: paging.pageError,
        isLoading: paging.pageLoading,
        toDate: filters.toDate,
    } as const;
};
