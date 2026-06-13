import { format, parseISO } from 'date-fns';
import type { FC } from 'react';
import type { SysAdminSummary } from './SysAdminDashboardSupport';

type ChartSegment = {
    readonly label: string;
    readonly value: number;
    readonly className: string;
};

type SysAdminDashboardChartsProps = {
    readonly summary: SysAdminSummary;
};
const formatAngle = (value: number, total: number) => `${String((value / total) * 360)}deg`;
const chartSegments = (segments: readonly ChartSegment[]): ChartSegment[] =>
    segments.filter((segment) => segment.value > 0);
export const SysAdminDashboardCharts: FC<SysAdminDashboardChartsProps> = ({ summary }) => {
    const formatHealthTotal = Math.max(summary.formatCount + summary.incompleteFormatCount, summary.defaultFormatCount, 1);
    const recordTotal = Math.max(summary.recordCount, 1);
    const userTotal = Math.max(summary.accountCount, 1);
    const formatSegments = chartSegments([
        { label: 'Published', value: summary.formatCount - summary.incompleteFormatCount, className: 'dashboard-chart__segment--good' },
        { label: 'Needs attention', value: summary.incompleteFormatCount, className: 'dashboard-chart__segment--warning' },
        { label: 'Default', value: summary.defaultFormatCount, className: 'dashboard-chart__segment--accent' },
    ]);
    const recordSegments = chartSegments([
        { label: 'Draft', value: summary.draftCount, className: 'dashboard-chart__segment--muted' },
        { label: 'Finalized', value: summary.finalizedCount, className: 'dashboard-chart__segment--good' },
        { label: 'Cancelled', value: summary.cancelledCount, className: 'dashboard-chart__segment--danger' },
    ]);
    const userSegments = chartSegments([
        { label: 'Active', value: summary.activeAccountCount, className: 'dashboard-chart__segment--good' },
        { label: 'Inactive', value: summary.accountCount - summary.activeAccountCount, className: 'dashboard-chart__segment--muted' },
    ]);
    return (
        <>
            <section className="dashboard-charts dashboard-charts--sysadmin" aria-label="SysAdmin summary charts">
                <article className="dashboard-chart-card">
                    <div className="section-heading"><div><p className="eyebrow">Formats</p><h2>Publishing health</h2></div></div>
                    <div className="dashboard-chart-card__body">
                        <div
                            className="dashboard-chart-ring"
                            aria-label="Document format health chart"
                            style={{
                                background: `conic-gradient(var(--color-primary) 0 ${formatAngle(
                                    summary.formatCount - summary.incompleteFormatCount,
                                    formatHealthTotal,
                                )}, var(--color-warning) ${formatAngle(
                                    summary.formatCount - summary.incompleteFormatCount,
                                    formatHealthTotal,
                                )} ${formatAngle(summary.formatCount, formatHealthTotal)}, var(--color-accent) ${formatAngle(
                                    summary.formatCount,
                                    formatHealthTotal,
                                )} 360deg)`,
                            }}
                        >
                            <strong>{summary.formatCount}</strong>
                            <span>formats</span>
                        </div>
                        <ul className="dashboard-chart-legend">
                            {formatSegments.map((segment) => (
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
                    <div className="section-heading"><div><p className="eyebrow">Records</p><h2>Document mix</h2></div></div>
                    <div className="dashboard-chart-card__body">
                        <div className="dashboard-chart-stack" aria-label="Record status distribution">
                            {recordSegments.map((segment) => (
                                <span
                                    className={segment.className}
                                    key={segment.label}
                                    style={{
                                        width: `${String((segment.value / recordTotal) * 100)}%`,
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
                    <div className="section-heading"><div><p className="eyebrow">Operations</p><h2>People and backup</h2></div></div>
                    <div className="dashboard-chart-card__body">
                        <div
                            className="dashboard-chart-ring dashboard-chart-ring--secondary"
                            aria-label="Account activity chart"
                            style={{
                                background: `conic-gradient(var(--color-secondary) 0 ${formatAngle(
                                    summary.activeAccountCount,
                                    userTotal,
                                )}, var(--color-border) ${formatAngle(
                                    summary.activeAccountCount,
                                    userTotal,
                                )} 360deg)`,
                            }}
                        >
                            <strong>{summary.activeAccountCount}</strong>
                            <span>active users</span>
                        </div>
                        <ul className="dashboard-chart-legend">
                            {userSegments.map((segment) => (
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
                                        ? format(parseISO(summary.lastBackupAt), 'd MMM yyyy, HH:mm')
                                        : 'Never'}
                                </dd>
                            </div>
                        </dl>
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
