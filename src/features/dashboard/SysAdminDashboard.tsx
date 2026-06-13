/** @format */

import type { FC } from 'react';

import { DashboardTrialCountdown } from './DashboardTrialCountdown';
import { SysAdminDashboardCharts } from './SysAdminDashboardCharts';
import { useSysAdminDashboardState } from './SysAdminDashboardSupport';

/**
 * SysAdmin dashboard surfaces document-format inventory and readiness.
 */
export const SysAdminDashboard: FC = () => {
    const { summary, message } = useSysAdminDashboardState();

    return (
        <div className="page-stack">
            <DashboardTrialCountdown
                isFullVersion={summary.isFullVersion}
                isTrialExpired={summary.isTrialExpired}
                remainingSeconds={summary.trialRemainingSeconds}
            />
            <SysAdminDashboardCharts summary={summary} />
            {message ? <p className="feedback-error">{message}</p> : null}
        </div>
    );
};
