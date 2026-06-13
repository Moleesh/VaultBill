/** @format */

import { format, parseISO } from 'date-fns';
import { FileCheck2, FileCog, Printer, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { FC } from 'react';

import { DashboardMetric } from './DashboardMetric';
import { useSysAdminDashboardState } from './SysAdminDashboardSupport';

/**
 * SysAdmin dashboard surfaces document-format inventory and readiness.
 */
export const SysAdminDashboard: FC = () => {
    const { inventory, summary, message } = useSysAdminDashboardState();

    const attentionCount = summary.incompleteFormatCount;
    const trialLabel = summary.isFullVersion
        ? 'Full version active'
        : summary.isTrialExpired
          ? 'Trial expired'
          : `${String(Math.ceil(summary.trialRemainingSeconds / 3600))}h remaining`;

    return (
        <div className="page-stack">
            <section className="page-hero page-hero--compact">
                <div>
                    <p className="eyebrow">System administration</p>
                    <h1>Configuration control centre</h1>
                    <p>Review document formats, print readiness, and installation health.</p>
                </div>
                <div className="dashboard-hero-stack">
                    <div className="dashboard-hero-stack__stat">
                        <span>Trial countdown</span>
                        <strong>{trialLabel}</strong>
                    </div>
                    <Link className="button-primary" to="/app/builder">
                        Create format
                    </Link>
                </div>
            </section>
            <section className="dashboard-metrics dashboard-metrics--wide">
                <DashboardMetric label="Formats published" value={String(summary.formatCount)} />
                <DashboardMetric
                    label="Templates published"
                    value={String(summary.templateCount)}
                />
                <DashboardMetric label="Formats needing attention" value={String(attentionCount)} />
                <DashboardMetric label="Records total" value={String(summary.recordCount)} />
                <DashboardMetric label="Draft records" value={String(summary.draftCount)} />
                <DashboardMetric label="Finalized records" value={String(summary.finalizedCount)} />
                <DashboardMetric label="Cancelled records" value={String(summary.cancelledCount)} />
                <DashboardMetric label="Users created" value={String(summary.accountCount)} />
            </section>
            <section className="dashboard-metrics">
                <DashboardMetric
                    label="Default formats"
                    value={String(summary.defaultFormatCount)}
                />
                <DashboardMetric
                    label="Active operators"
                    value={String(summary.activeAccountCount)}
                />
                <DashboardMetric label="Trial time left" value={trialLabel} />
                <DashboardMetric
                    label="Last backup"
                    value={
                        summary.lastBackupAt
                            ? format(parseISO(summary.lastBackupAt), 'd MMM yyyy, HH:mm')
                            : 'No backup yet'
                    }
                />
            </section>
            <section className="configuration-grid">
                <article className="data-panel configuration-card">
                    <header>
                        <ShieldCheck aria-hidden="true" />
                        <div>
                            <p className="eyebrow">Runtime</p>
                            <h2>Host health</h2>
                        </div>
                    </header>
                    <dl>
                        <div>
                            <dt>Active operators</dt>
                            <dd>{summary.activeAccountCount}</dd>
                        </div>
                        <div>
                            <dt>Draft records</dt>
                            <dd>{summary.draftCount}</dd>
                        </div>
                        <div>
                            <dt>Finalized records</dt>
                            <dd>{summary.finalizedCount}</dd>
                        </div>
                        <div>
                            <dt>Last backup</dt>
                            <dd>
                                {summary.lastBackupAt
                                    ? format(parseISO(summary.lastBackupAt), 'd MMM yyyy, HH:mm')
                                    : 'No backup yet'}
                            </dd>
                        </div>
                    </dl>
                    <div className="configuration-card__actions">
                        <Link to="/app/settings#backup">Review backup</Link>
                        <Link to="/app/settings#security">Security</Link>
                    </div>
                </article>
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
