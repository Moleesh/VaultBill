/** @format */

/**
 * Dashboard view that switches between SysAdmin inventory cards and role-aware
 * business metrics.
 */

import type { FC } from 'react';

import { format, parseISO } from 'date-fns';

import { ActionLink } from '../../components/ActionLink';
import { useSession } from '../auth/SessionContext';
import { useRecordStore } from '../records/RecordStoreContext';
import { DashboardMetric } from './DashboardMetric';
import { SysAdminDashboard } from './SysAdminDashboard';

/** Renders the dashboard experience for the current operator role. */
export const DashboardPage: FC = () => {
    const { operatorContext } = useSession();
    const { records } = useRecordStore();

    if (operatorContext?.role === 'SysAdmin') {
        return <SysAdminDashboard />;
    }

    const finalized = records.filter((record) => record.status === 'Finalized');
    const draftCount = records.filter((record) => record.status === 'Draft').length;
    const cancelledCount = records.filter((record) => record.status === 'Cancelled').length;
    const revenue = finalized.reduce(
        (total, record) => total + (Number.parseFloat(record.grandTotal) || 0),
        0,
    );
    const customers = Object.entries(
        finalized.reduce<Record<string, number>>((totals, record) => {
            totals[record.customerName] =
                (totals[record.customerName] ?? 0) + (Number.parseFloat(record.grandTotal) || 0);
            return totals;
        }, {}),
    )
        .sort((left, right) => right[1] - left[1])
        .slice(0, 5);
    const revenueByDay = finalized.reduce<Record<string, number>>((totals, record) => {
        totals[record.invoiceDate] =
            (totals[record.invoiceDate] ?? 0) + (Number.parseFloat(record.grandTotal) || 0);
        return totals;
    }, {});
    const trend = Object.entries(revenueByDay)
        .sort(([left], [right]) => left.localeCompare(right))
        .slice(-7);
    const maximumRevenue = Math.max(...trend.map(([, value]) => value), 1);
    const maximumCustomer = Math.max(...customers.map(([, value]) => value), 1);

    return (
        <div className="page-stack">
            <section className="page-hero page-hero--compact">
                <div>
                    <p className="eyebrow">{format(new Date(), 'EEEE, d MMMM')}</p>
                    <h1>Welcome back, {operatorContext?.account.displayName}.</h1>
                    <p>Invoices, customers, and the numbers worth noticing today.</p>
                </div>
                <ActionLink to="/app/records/new" variant="primary">
                    Create document
                </ActionLink>
            </section>

            <section className="dashboard-metrics" aria-label="Business summary">
                <DashboardMetric label="Finalized revenue" value={`₹${revenue.toFixed(2)}`} />
                <DashboardMetric label="Finalized records" value={String(finalized.length)} />
                <DashboardMetric label="Drafts" value={String(draftCount)} />
                <DashboardMetric label="Cancelled" value={String(cancelledCount)} />
            </section>

            <section className="dashboard-grid">
                <article className="data-panel dashboard-chart">
                    <div className="section-heading">
                        <div>
                            <p className="eyebrow">Revenue</p>
                            <h2>Recent trend</h2>
                        </div>
                    </div>
                    {trend.length === 0 ? (
                        <div className="empty-panel">
                            <p>Finalize an invoice to start the chart.</p>
                        </div>
                    ) : (
                        <div className="bar-chart" aria-label="Revenue by invoice date">
                            {trend.map(([date, value]) => (
                                <div className="bar-chart-item" key={date}>
                                    <span
                                        style={{
                                            height: `${String(Math.max(8, (value / maximumRevenue) * 100))}%`,
                                        }}
                                    />
                                    <small>{format(parseISO(date), 'd MMM')}</small>
                                    <strong>₹{value.toFixed(0)}</strong>
                                </div>
                            ))}
                        </div>
                    )}
                </article>
                <article className="data-panel">
                    <div className="section-heading">
                        <div>
                            <p className="eyebrow">Customers</p>
                            <h2>Top revenue</h2>
                        </div>
                        <ActionLink to="/app/reports">Reports</ActionLink>
                    </div>
                    {customers.length === 0 ? (
                        <div className="empty-panel">
                            <p>Customer totals appear after finalization.</p>
                        </div>
                    ) : (
                        <div className="rank-list">
                            {customers.map(([name, value]) => (
                                <div key={name}>
                                    <span>{name}</span>
                                    <span className="rank-list-bar">
                                        <i
                                            style={{
                                                width: `${String((value / maximumCustomer) * 100)}%`,
                                            }}
                                        />
                                    </span>
                                    <strong>₹{value.toFixed(2)}</strong>
                                </div>
                            ))}
                        </div>
                    )}
                </article>
            </section>

            <section className="data-panel">
                <div className="section-heading">
                    <div>
                        <p className="eyebrow">Recent activity</p>
                        <h2>Latest records</h2>
                    </div>
                    <ActionLink to="/app/records?tab=reprint">View all</ActionLink>
                </div>
                <div className="record-list">
                    {records.slice(0, 5).map((record) => (
                        <article key={record.recordId}>
                            <strong>{record.documentNumber ?? 'Draft'}</strong>
                            <span>{record.customerName || 'Customer not entered'}</span>
                            <span>₹{record.grandTotal}</span>
                            <span className="status-pill">{record.status}</span>
                        </article>
                    ))}
                </div>
            </section>
        </div>
    );
};
