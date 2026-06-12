/** @format */

import { format, parseISO } from 'date-fns';
import { FileCheck2, FileCog, Printer, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { FC } from 'react';

import { useCapabilities } from '../../capability/CapabilityContext';
import { requestHostedApi } from '../../runtime/HostedApi';
import { DashboardMetric } from './DashboardMetric';

type InventoryItem = {
    readonly formatId: string;
    readonly formatName: string;
    readonly isDefault: boolean;
    readonly updatedAt: string;
    readonly templateName?: string;
    readonly assetCount: number;
    readonly isValid: boolean;
};

/**
 * SysAdmin dashboard surfaces document-format inventory and readiness.
 */
export const SysAdminDashboard: FC = () => {
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
                <DashboardMetric label="Document formats" value={String(inventory.length)} />
                <DashboardMetric
                    label="Default formats"
                    value={String(inventory.filter((item) => item.isDefault).length)}
                />
                <DashboardMetric
                    label="Print templates"
                    value={String(inventory.filter((item) => item.templateName).length)}
                />
                <DashboardMetric label="Incomplete formats" value={String(attentionCount)} />
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
