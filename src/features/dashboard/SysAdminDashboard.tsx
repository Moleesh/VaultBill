/** @format */

import { format, parseISO } from 'date-fns';
import type { FC } from 'react';

import { DashboardTrialCountdown } from './DashboardTrialCountdown';
import { DashboardMetric } from './DashboardMetric';
import { SysAdminDashboardCharts } from './SysAdminDashboardCharts';
import { useSysAdminDashboardState } from './SysAdminDashboardSupport';

/**
 * SysAdmin dashboard surfaces document-format inventory and readiness.
 */
export const SysAdminDashboard: FC = () => {
    const { summary, message } = useSysAdminDashboardState();
    const lastBackupLabel = summary.lastBackupAt
        ? format(parseISO(summary.lastBackupAt), 'd MMM yyyy, HH:mm')
        : 'Never';

    return (
        <div className="page-stack">
            <DashboardTrialCountdown
                isFullVersion={summary.isFullVersion}
                isTrialExpired={summary.isTrialExpired}
                remainingSeconds={summary.trialRemainingSeconds}
            />
            <section className="dashboard-metrics" aria-label="SysAdmin operational summary">
                <DashboardMetric label="Formats published" value={String(summary.formatCount)} />
                <DashboardMetric
                    label="Templates published"
                    value={String(summary.templateCount)}
                />
                <DashboardMetric
                    label="Formats needing attention"
                    value={String(summary.incompleteFormatCount)}
                />
                <DashboardMetric label="Records total" value={String(summary.recordCount)} />
                <DashboardMetric label="Active users" value={String(summary.activeAccountCount)} />
                <DashboardMetric label="Last backup" value={lastBackupLabel} />
            </section>
            <SysAdminDashboardCharts summary={summary} />
            {message ? <p className="feedback-error">{message}</p> : null}
        </div>
    );
};
