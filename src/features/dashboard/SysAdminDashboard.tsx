/** @format */

import type { FC } from 'react';

import { format, parseISO } from 'date-fns';

import { ActionLink } from '../../components/ActionLink';
import { DashboardMetric } from './DashboardMetric';
import { DashboardTrialCountdown } from './DashboardTrialCountdown';
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
            <section className="page-hero page-hero--compact">
                <div>
                    <p className="eyebrow">SysAdmin</p>
                    <h1>Workspace health</h1>
                    <p>Document formats, people, backups, and activation readiness in one place.</p>
                </div>
                <div className="dashboard-quick-actions">
                    <ActionLink to="/app/records" variant="primary">
                        Create record
                    </ActionLink>
                    <ActionLink to="/app/reports">Reports</ActionLink>
                    <ActionLink to="/app/builder">Document library</ActionLink>
                    <ActionLink to="/app/settings#backup">Backup</ActionLink>
                </div>
            </section>
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
