/** @format */

import { useQuery } from '@tanstack/react-query';

import { useCapabilities } from '../../capability/CapabilityContext';
import { getRuntimeQueryScope, queryKeys } from '../../query/QueryKeys';
import {
    fetchSysAdminDashboardState,
    type SysAdminDashboardState,
    type SysAdminSummary,
} from '../../query/RuntimeQueries';
import { useSession } from '../auth/SessionContext';

export type { SysAdminDashboardState, SysAdminSummary } from '../../query/RuntimeQueries';

export type TrialCountdownParts = {
    readonly amount: string;
    readonly label: string;
};

const defaultSummary: SysAdminSummary = {
    formatCount: 0,
    defaultFormatCount: 0,
    templateCount: 0,
    incompleteFormatCount: 0,
    recordCount: 0,
    draftCount: 0,
    finalizedCount: 0,
    cancelledCount: 0,
    accountCount: 0,
    activeAccountCount: 0,
    lastBackupAt: null,
    trialRemainingSeconds: 0,
    isTrialExpired: false,
    isFullVersion: false,
};

/**
 * Loads the SysAdmin dashboard summary from the desktop bridge or hosted API.
 */
export const useSysAdminDashboardState = (): SysAdminDashboardState => {
    const capabilities = useCapabilities();
    const runtimeScope = getRuntimeQueryScope(capabilities);
    const { accounts, operatorContext } = useSession();
    const dashboardQuery = useQuery({
        queryKey: queryKeys.sysAdminDashboard(
            runtimeScope,
            operatorContext?.account.userId ?? 'guest',
        ),
        enabled: Boolean(operatorContext),
        queryFn: () =>
            fetchSysAdminDashboardState({
                accounts,
                capabilities,
            }),
        staleTime: Number.POSITIVE_INFINITY,
    });

    if (!operatorContext) {
        return {
            inventory: [],
            summary: defaultSummary,
            message: '',
        };
    }

    if (dashboardQuery.data) {
        return dashboardQuery.data;
    }

    return {
        inventory: [],
        summary: defaultSummary,
        message:
            dashboardQuery.error instanceof Error
                ? dashboardQuery.error.message
                : dashboardQuery.isError
                  ? 'Dashboard summary could not load.'
                  : '',
    };
};
