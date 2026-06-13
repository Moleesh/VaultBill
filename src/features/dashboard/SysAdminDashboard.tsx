/** @format */

import { format, parseISO } from 'date-fns';
import type { FC } from 'react';

import { DashboardTrialCountdown } from './DashboardTrialCountdown';
import { DashboardMetric } from './DashboardMetric';
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
            <section className="dashboard-metrics dashboard-metrics--sysadmin">
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
                <DashboardMetric label="Draft records" value={String(summary.draftCount)} />
                <DashboardMetric label="Finalized records" value={String(summary.finalizedCount)} />
                <DashboardMetric label="Cancelled records" value={String(summary.cancelledCount)} />
                <DashboardMetric label="Users created" value={String(summary.accountCount)} />
                <DashboardMetric label="Active users" value={String(summary.activeAccountCount)} />
                <DashboardMetric
                    label="Default formats"
                    value={String(summary.defaultFormatCount)}
                />
                <DashboardMetric
                    label="Last backup"
                    value={
                        summary.lastBackupAt
                            ? format(parseISO(summary.lastBackupAt), 'd MMM yyyy, HH:mm')
                            : 'Never'
                    }
                />
            </section>
            {message ? <p className="feedback-error">{message}</p> : null}
        </div>
    );
};
