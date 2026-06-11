/**
 * eslint-disable max-lines
 *
 * @format
 */

import { format, parseISO } from 'date-fns';
import { FileCheck2, FileCog, Printer, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { FC } from 'react';

import { useCapabilities } from '../../capability/CapabilityContext';
import { requestHostedApi } from '../../runtime/HostedApi';
import { useSession } from '../auth/SessionContext';
import { useRecordStore } from '../records/RecordStoreContext';

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
                <Link className="button-primary" to="/app/records/new">
                    Create document
                </Link>
            </section>

            <section className="dashboard-metrics" aria-label="Business summary">
                <Metric label="Finalized revenue" value={`₹${revenue.toFixed(2)}`} />
                <Metric label="Finalized documents" value={String(finalized.length)} />
                <Metric label="Drafts" value={String(draftCount)} />
                <Metric label="Cancelled" value={String(cancelledCount)} />
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
                                <div className="bar-chart__item" key={date}>
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
                        <Link to="/app/reports">Reports</Link>
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
                                    <span className="rank-list__bar">
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
                    <Link to="/app/records?tab=reprint">View all</Link>
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

const Metric: FC<{ readonly label: string; readonly value: string }> = ({ label, value }) => (
    <article>
        <small>{label}</small>
        <strong>{value}</strong>
    </article>
);

type InventoryItem = {
    readonly formatId: string;
    readonly formatName: string;
    readonly isDefault: boolean;
    readonly updatedAt: string;
    readonly templateName?: string;
    readonly assetCount: number;
    readonly isValid: boolean;
};

const SysAdminDashboard: FC = () => {
    const capabilities = useCapabilities();
    const [inventory, setInventory] = useState<readonly InventoryItem[]>([]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const request = window.vaultBillDesktop
            ? window.vaultBillDesktop.listBuilderInventory()
            : capabilities.isLanBrowser
              ? requestHostedApi<readonly InventoryItem[]>('/builder/inventory')
              : Promise.resolve([]);
        void request.then(setInventory).catch((reason: unknown) => {
            setMessage(
                reason instanceof Error ? reason.message : 'Builder inventory could not load.',
            );
        });
    }, [capabilities.isLanBrowser]);

    const attentionCount = inventory.filter((item) => !item.isValid || !item.templateName).length;
    return (
        <div className="page-stack">
            <section className="page-hero page-hero--compact">
                <div>
                    <p className="eyebrow">System administration</p>
                    <h1>Configuration control centre</h1>
                    <p>Review document formats, print readiness, and installation health.</p>
                </div>
                <Link className="button-primary" to="/app/builder">
                    Create format
                </Link>
            </section>
            <section className="dashboard-metrics">
                <Metric label="Document formats" value={String(inventory.length)} />
                <Metric
                    label="Default formats"
                    value={String(inventory.filter((item) => item.isDefault).length)}
                />
                <Metric
                    label="Print templates"
                    value={String(inventory.filter((item) => item.templateName).length)}
                />
                <Metric label="Incomplete formats" value={String(attentionCount)} />
            </section>
            <section className="configuration-grid">
                {inventory.map((item) => (
                    <article className="data-panel configuration-card" key={item.formatId}>
                        <header>
                            <FileCog aria-hidden="true" />
                            <div>
                                <p className="eyebrow">Document format</p>
                                <h2>{item.formatName}</h2>
                            </div>
                        </header>
                        <dl>
                            <div>
                                <dt>Status</dt>
                                <dd>
                                    {item.isValid ? (
                                        <FileCheck2 aria-hidden="true" size={17} />
                                    ) : null}
                                    {item.isValid ? 'Valid' : 'Needs attention'}
                                </dd>
                            </div>
                            <div>
                                <dt>Default</dt>
                                <dd>{item.isDefault ? 'Yes' : 'No'}</dd>
                            </div>
                            <div>
                                <dt>Print template</dt>
                                <dd>
                                    <Printer aria-hidden="true" size={17} />{' '}
                                    {item.templateName ?? 'Missing template'}
                                </dd>
                            </div>
                            <div>
                                <dt>Shared assets</dt>
                                <dd>{item.assetCount}</dd>
                            </div>
                            <div>
                                <dt>Last updated</dt>
                                <dd>{format(parseISO(item.updatedAt), 'd MMM yyyy')}</dd>
                            </div>
                        </dl>
                        <div className="configuration-card__actions">
                            <Link to={`/app/builder?format=${item.formatId}`}>Edit</Link>
                            <Link to={`/app/builder?format=${item.formatId}&step=preview`}>
                                Preview
                            </Link>
                        </div>
                    </article>
                ))}
                {inventory.length === 0 ? (
                    <article className="data-panel configuration-card">
                        <header>
                            <FileCog aria-hidden="true" />
                            <div>
                                <p className="eyebrow">Builder</p>
                                <h2>No published document format</h2>
                            </div>
                        </header>
                        <p>
                            Publish a document format and HTML print template before operators begin
                            work.
                        </p>
                        <Link to="/app/builder">Open Builder</Link>
                    </article>
                ) : null}
                <article className="data-panel configuration-card">
                    <header>
                        <ShieldCheck aria-hidden="true" />
                        <div>
                            <p className="eyebrow">Security</p>
                            <h2>Backup readiness</h2>
                        </div>
                    </header>
                    <p>
                        Confirm the backup password and create a verified backup before production
                        use.
                    </p>
                    <Link to="/app/settings#security">Review security</Link>
                </article>
            </section>
            {message ? <p className="feedback-error">{message}</p> : null}
        </div>
    );
};
