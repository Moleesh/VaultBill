/** @format */

import type { FC } from 'react';

import { format, parseISO } from 'date-fns';

import { buildSysAdminDashboardChartData } from './SysAdminDashboardChartSupport';
import { type SysAdminSummary } from './SysAdminDashboardSupport';

type SysAdminDashboardChartsProps = {
    readonly summary: SysAdminSummary;
};

export const SysAdminDashboardCharts: FC<SysAdminDashboardChartsProps> = ({ summary }) => {
    const chartData = buildSysAdminDashboardChartData(summary);
    return (
        <>
            <section
                className="dashboard-charts dashboard-charts--sysadmin"
                aria-label="SysAdmin summary charts"
            >
                <article className="dashboard-chart-card">
                    <div className="section-heading">
                        <div>
                            <p className="eyebrow">Formats</p>
                            <h2>Publishing health</h2>
                            <p className="dashboard-chart-card-summary">
                                {chartData.formatSummary}
                            </p>
                        </div>
                    </div>
                    <div className="dashboard-chart-card-body">
                        <div
                            className="dashboard-chart-ring"
                            aria-label="Document format health chart"
                            style={{ background: chartData.formatRingBackground }}
                        >
                            <strong>{summary.formatCount}</strong>
                            <span>formats</span>
                        </div>
                        <ul className="dashboard-chart-legend">
                            {chartData.formatSegments.map((segment) => (
                                <li key={segment.label}>
                                    <span className={segment.className} />
                                    <strong>{segment.label}</strong>
                                    <small>{String(segment.value)}</small>
                                </li>
                            ))}
                        </ul>
                    </div>
                </article>
                <article className="dashboard-chart-card">
                    <div className="section-heading">
                        <div>
                            <p className="eyebrow">Records</p>
                            <h2>Document mix</h2>
                            <p className="dashboard-chart-card-summary">
                                {chartData.recordSummary}
                            </p>
                        </div>
                    </div>
                    <div className="dashboard-chart-card-body">
                        <div
                            className="dashboard-chart-stack"
                            aria-label="Record status distribution"
                        >
                            {chartData.recordSegments.map((segment) => (
                                <span
                                    className={segment.className}
                                    key={segment.label}
                                    style={{
                                        width: `${String(
                                            (segment.value / chartData.recordTotal) * 100,
                                        )}%`,
                                    }}
                                    title={`${segment.label}: ${String(segment.value)}`}
                                />
                            ))}
                        </div>
                        <dl className="dashboard-chart-list">
                            <div>
                                <dt>Total records</dt>
                                <dd>{summary.recordCount}</dd>
                            </div>
                            <div>
                                <dt>Finalized</dt>
                                <dd>{summary.finalizedCount}</dd>
                            </div>
                            <div>
                                <dt>Cancelled</dt>
                                <dd>{summary.cancelledCount}</dd>
                            </div>
                        </dl>
                    </div>
                </article>
                <article className="dashboard-chart-card">
                    <div className="section-heading">
                        <div>
                            <p className="eyebrow">Operations</p>
                            <h2>People and backup</h2>
                            <p className="dashboard-chart-card-summary">{chartData.userSummary}</p>
                        </div>
                    </div>
                    <div className="dashboard-chart-card-body">
                        <div
                            className="dashboard-chart-ring dashboard-chart-ring--secondary"
                            aria-label="Account activity chart"
                            style={{ background: chartData.userRingBackground }}
                        >
                            <strong>{summary.activeAccountCount}</strong>
                            <span>active users</span>
                        </div>
                        <ul className="dashboard-chart-legend">
                            {chartData.userSegments.map((segment) => (
                                <li key={segment.label}>
                                    <span className={segment.className} />
                                    <strong>{segment.label}</strong>
                                    <small>{String(segment.value)}</small>
                                </li>
                            ))}
                        </ul>
                        <dl className="dashboard-chart-list">
                            <div>
                                <dt>Users created</dt>
                                <dd>{summary.accountCount}</dd>
                            </div>
                            <div>
                                <dt>Last backup</dt>
                                <dd>
                                    {summary.lastBackupAt
                                        ? format(
                                              parseISO(summary.lastBackupAt),
                                              'd MMM yyyy, HH:mm',
                                          )
                                        : 'Never'}
                                </dd>
                            </div>
                        </dl>
                        <p className="dashboard-chart-card-summary">{chartData.backupSummary}</p>
                    </div>
                </article>
            </section>
            <p className="dashboard-chart-note">
                Published formats, record mix, and account activity are shown as charts so the
                SysAdmin can read operational health at a glance.
            </p>
        </>
    );
};
