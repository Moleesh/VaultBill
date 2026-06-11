/**
 * eslint-disable max-lines
 *
 * @format
 */

/** Reporting workspace for filtered, printable, and exportable business summaries. */

import { Printer, RotateCcw, Search, Sheet } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FC } from 'react';

import { useCapabilities } from '../../capability/CapabilityContext';
import { AppDatePicker } from '../../components/AppDatePicker/AppDatePicker';
import { AppModal } from '../../components/AppModal/AppModal';
import { SearchableDropdown } from '../../components/SearchableDropdown/SearchableDropdown';
import { requestHostedApi } from '../../runtime/HostedApi';
import {
    combineRecordHtml,
    escapePrintHtml,
    loadRecordPrintPackage,
    type RecordPrintPackage,
} from '../records/RecordPrintHtml';
import { AppRecordSchema, useRecordStore } from '../records/RecordStoreContext';
import type { AppRecord } from '../records/RecordStoreContext';

const pageSize = 50;
const printBatchSize = 10;
const reportOptions = [
    { value: 'sales-register', label: 'Sales register' },
    { value: 'tax-summary', label: 'Tax summary' },
    { value: 'customer-ledger', label: 'Customer ledger' },
];

type PrintTask = {
    readonly kind: 'report' | 'records';
    readonly completed: number;
    readonly total: number;
    readonly awaitingContinue?: boolean;
    readonly jobId?: string;
    readonly running?: boolean;
    readonly message?: string;
};

type ReportPage = {
    readonly rows: readonly AppRecord[];
    readonly total: number;
    readonly nextCursor?: string;
};

export const ReportsPage: FC = () => {
    const capabilities = useCapabilities();
    const { error, isLoading, records } = useRecordStore();
    const [reportId, setReportId] = useState('sales-register');
    const [customer, setCustomer] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [status, setStatus] = useState('All');
    const [preset, setPreset] = useState('All');
    const [visibleCount, setVisibleCount] = useState(pageSize);
    const [task, setTask] = useState<PrintTask>();
    const [serverRecords, setServerRecords] = useState<readonly AppRecord[]>([]);
    const [serverTotal, setServerTotal] = useState(0);
    const [nextCursor, setNextCursor] = useState<string>();
    const [pageLoading, setPageLoading] = useState(false);
    const [pageError, setPageError] = useState('');
    const [printSource, setPrintSource] = useState<readonly AppRecord[]>([]);
    const [trialExpired, setTrialExpired] = useState(false);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const usesServerPaging =
        !capabilities.isDemoMode &&
        (window.vaultBillDesktop !== undefined || capabilities.isLanBrowser);

    const browserMatchingRecords = useMemo(() => {
        const normalizedCustomer = customer.trim().toLocaleLowerCase();
        const normalizedInvoice = invoiceNumber.trim().toLocaleLowerCase();
        let result = records
            .filter((record) => record.status !== 'Draft' || status === 'Draft')
            .filter((record) => status === 'All' || record.status === status)
            .filter(
                (record) =>
                    !normalizedCustomer ||
                    record.customerName.toLocaleLowerCase().includes(normalizedCustomer),
            )
            .filter(
                (record) =>
                    !normalizedInvoice ||
                    record.documentNumber?.toLocaleLowerCase().includes(normalizedInvoice),
            )
            .filter((record) => !fromDate || record.invoiceDate >= fromDate)
            .filter((record) => !toDate || record.invoiceDate <= toDate)
            .sort(
                (left, right) =>
                    right.updatedAt.localeCompare(left.updatedAt) ||
                    left.recordId.localeCompare(right.recordId),
            );
        if (preset === 'Last100') result = result.slice(0, 100);
        return result;
    }, [customer, fromDate, invoiceNumber, preset, records, status, toDate]);

    const query = useMemo(
        () => ({
            reportId,
            customer,
            invoiceNumber,
            fromDate,
            toDate,
            status,
            preset,
            limit: pageSize,
        }),
        [customer, fromDate, invoiceNumber, preset, reportId, status, toDate],
    );
    const matchingRecords = usesServerPaging ? serverRecords : browserMatchingRecords;
    const totalRecords = usesServerPaging ? serverTotal : browserMatchingRecords.length;
    const visibleRecords = usesServerPaging
        ? matchingRecords
        : matchingRecords.slice(0, visibleCount);
    const customers = [
        ...new Set(records.map((record) => record.customerName).filter(Boolean)),
    ].sort();

    useEffect(() => {
        setVisibleCount(pageSize);
    }, [customer, invoiceNumber, fromDate, toDate, status, preset, reportId]);

    useEffect(() => {
        if (window.vaultBillDesktop) {
            void window.vaultBillDesktop.getTrialStatus().then((trial) => {
                setTrialExpired(trial.isExpired);
            });
        } else if (capabilities.isLanBrowser) {
            void requestHostedApi<{ readonly isExpired: boolean }>('/trial/status').then(
                (trial) => {
                    setTrialExpired(trial.isExpired);
                },
            );
        }
    }, [capabilities.isLanBrowser]);

    useEffect(() => {
        if (!usesServerPaging) return undefined;
        let active = true;
        setPageLoading(true);
        setPageError('');
        void requestReportPage(query)
            .then((page) => {
                if (!active) return;
                setServerRecords(page.rows);
                setServerTotal(page.total);
                setNextCursor(page.nextCursor);
            })
            .catch((reason: unknown) => {
                if (active)
                    setPageError(
                        reason instanceof Error
                            ? reason.message
                            : 'Report data could not be loaded.',
                    );
            })
            .finally(() => {
                if (active) setPageLoading(false);
            });
        return () => {
            active = false;
        };
    }, [query, usesServerPaging]);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (
            !sentinel ||
            pageLoading ||
            (usesServerPaging ? !nextCursor : visibleCount >= matchingRecords.length) ||
            typeof IntersectionObserver === 'undefined'
        )
            return undefined;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    if (usesServerPaging && nextCursor) {
                        setPageLoading(true);
                        void requestReportPage({ ...query, cursor: nextCursor })
                            .then((page) => {
                                setServerRecords((current) => [
                                    ...current,
                                    ...page.rows.filter(
                                        (record) =>
                                            !current.some(
                                                (candidate) =>
                                                    candidate.recordId === record.recordId,
                                            ),
                                    ),
                                ]);
                                setServerTotal(page.total);
                                setNextCursor(page.nextCursor);
                            })
                            .catch((reason: unknown) => {
                                setPageError(
                                    reason instanceof Error
                                        ? reason.message
                                        : 'More report rows could not be loaded.',
                                );
                            })
                            .finally(() => {
                                setPageLoading(false);
                            });
                    } else {
                        setVisibleCount((current) =>
                            Math.min(matchingRecords.length, current + pageSize),
                        );
                    }
                }
            },
            { rootMargin: '300px' },
        );
        observer.observe(sentinel);
        return () => {
            observer.disconnect();
        };
    }, [matchingRecords.length, nextCursor, pageLoading, query, usesServerPaging, visibleCount]);

    const reset = () => {
        setCustomer('');
        setInvoiceNumber('');
        setFromDate('');
        setToDate('');
        setStatus('All');
        setPreset('All');
    };

    const applyPreset = (value: string) => {
        setPreset(value);
        if (value === 'Last100' || value === 'All') {
            setFromDate('');
            setToDate('');
            return;
        }
        const now = new Date();
        const today = now.toISOString().slice(0, 10);
        if (value === 'Today') {
            setFromDate(today);
            setToDate(today);
        }
        if (value === 'ThisMonth') {
            setFromDate(`${today.slice(0, 7)}-01`);
            setToDate(today);
        }
        if (value === 'FinancialYear') {
            const year = now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear();
            setFromDate(`${String(year)}-04-01`);
            setToDate(today);
        }
    };

    const loadCompleteResult = async (): Promise<readonly AppRecord[]> => {
        if (!usesServerPaging) return browserMatchingRecords;
        const complete: AppRecord[] = [];
        let cursor: string | undefined;
        do {
            const page = await requestReportPage({ ...query, ...(cursor ? { cursor } : {}) });
            complete.push(...page.rows);
            cursor = page.nextCursor;
        } while (cursor);
        return complete;
    };

    const exportAll = () => {
        setTask({
            kind: 'report',
            completed: 0,
            total: totalRecords,
            running: true,
            message: 'Loading the complete filtered result for export.',
        });
        void loadCompleteResult()
            .then((completeRecords) => {
                const csv = buildReportCsv(reportId, completeRecords);
                const url = URL.createObjectURL(
                    new Blob([csv], { type: 'text/csv;charset=utf-8' }),
                );
                const anchor = document.createElement('a');
                anchor.href = url;
                anchor.download = `${reportId}-${new Date().toISOString().slice(0, 10)}.csv`;
                anchor.click();
                URL.revokeObjectURL(url);
                setTask({
                    kind: 'report',
                    completed: completeRecords.length,
                    total: completeRecords.length,
                    running: false,
                    message: 'Export completed.',
                });
            })
            .catch((reason: unknown) => {
                setTask({
                    kind: 'report',
                    completed: 0,
                    total: totalRecords,
                    running: false,
                    message: reason instanceof Error ? reason.message : 'Export failed.',
                });
            });
    };

    const runOutput = async (html: string, jobId: string) => {
        if (window.vaultBillDesktop) {
            const result = await window.vaultBillDesktop.printHtml({ html, jobId });
            if (!result.success) throw new Error(result.warning ?? 'Printing failed.');
            return;
        }
        if (capabilities.isLanBrowser) {
            const result = await requestHostedApi<{ success: boolean; warning?: string }>(
                '/print/html',
                'POST',
                { html, jobId },
            );
            if (!result.success) throw new Error(result.warning ?? 'Host printing failed.');
            return;
        }
        window.print();
    };

    const runReportPrint = () => {
        const jobId = crypto.randomUUID();
        setTask({
            kind: 'report',
            completed: 0,
            total: totalRecords,
            jobId,
            running: true,
            message: 'Preparing the complete filtered report.',
        });
        void loadCompleteResult()
            .then(async (completeRecords) => {
                await runOutput(renderReportHtml(reportId, completeRecords), jobId);
                return completeRecords;
            })
            .then((completeRecords) => {
                setTask({
                    kind: 'report',
                    completed: completeRecords.length,
                    total: completeRecords.length,
                    running: false,
                    message: 'Report printing completed.',
                });
            })
            .catch((reason: unknown) => {
                setTask({
                    kind: 'report',
                    completed: 0,
                    total: totalRecords,
                    running: false,
                    message: reason instanceof Error ? reason.message : 'Report printing failed.',
                });
            });
    };

    const runNextRecordBatch = (startAt = 0, suppliedRecords?: readonly AppRecord[]) => {
        const prepare =
            suppliedRecords ?? (startAt > 0 && printSource.length > 0 ? printSource : undefined);
        void (prepare ? Promise.resolve(prepare) : loadCompleteResult())
            .then((completeRecords) => {
                const printable = completeRecords.filter(
                    (record) => record.status === 'Finalized' || record.status === 'Cancelled',
                );
                if (printable.length === 0)
                    throw new Error('No finalized or cancelled records match.');
                setPrintSource(printable);
                const nextCompleted = Math.min(printable.length, startAt + printBatchSize);
                const batch = printable.slice(startAt, nextCompleted);
                const jobId = crypto.randomUUID();
                setTask({
                    kind: 'records',
                    completed: startAt,
                    total: printable.length,
                    jobId,
                    running: true,
                    message: `Printing records ${String(startAt + 1)}-${String(nextCompleted)} in report order.`,
                });
                return loadPrintPackages(batch, capabilities.isLanBrowser)
                    .then((packages) => runOutput(combineRecordHtml(batch, packages), jobId))
                    .then(() => ({
                        nextCompleted,
                        printable,
                    }));
            })
            .then(({ nextCompleted, printable }) => {
                setTask({
                    kind: 'records',
                    completed: nextCompleted,
                    total: printable.length,
                    awaitingContinue: nextCompleted < printable.length,
                    running: false,
                    message:
                        nextCompleted < printable.length
                            ? 'This batch completed. Continue with the next records?'
                            : 'All matching records printed.',
                });
                if (nextCompleted >= printable.length) setPrintSource([]);
            })
            .catch((reason: unknown) => {
                setTask({
                    kind: 'records',
                    completed: startAt,
                    total: totalRecords,
                    running: false,
                    message: reason instanceof Error ? reason.message : 'Record printing failed.',
                });
            });
    };

    return (
        <div className="page-stack reports-page">
            <div className="operational-header">
                <div>
                    <p className="eyebrow">Reports</p>
                    <h1>Business reports</h1>
                    <p>
                        Search the complete record history, then export or print exactly what
                        matches.
                    </p>
                </div>
                <SearchableDropdown
                    label="Report"
                    onChange={setReportId}
                    options={reportOptions}
                    value={reportId}
                />
            </div>
            <section className="data-panel">
                <div className="report-filter-grid">
                    <label>
                        <span>Customer</span>
                        <input
                            list="report-customers"
                            placeholder="Any customer"
                            value={customer}
                            onChange={(event) => {
                                setCustomer(event.currentTarget.value);
                            }}
                        />
                        <datalist id="report-customers">
                            {customers.map((name) => (
                                <option key={name} value={name} />
                            ))}
                        </datalist>
                    </label>
                    <label>
                        <span>Invoice number</span>
                        <input
                            placeholder="Full or partial number"
                            value={invoiceNumber}
                            onChange={(event) => {
                                setInvoiceNumber(event.currentTarget.value);
                            }}
                        />
                    </label>
                    <AppDatePicker label="From" onChange={setFromDate} value={fromDate} />
                    <AppDatePicker label="To" onChange={setToDate} value={toDate} />
                    <SearchableDropdown
                        label="Status"
                        value={status}
                        onChange={setStatus}
                        options={['All', 'Draft', 'Finalized', 'Cancelled'].map((value) => ({
                            value,
                            label: value,
                        }))}
                    />
                    <SearchableDropdown
                        label="Quick range"
                        value={preset}
                        onChange={applyPreset}
                        options={[
                            { value: 'All', label: 'All time' },
                            { value: 'Today', label: 'Today' },
                            { value: 'ThisMonth', label: 'This month' },
                            { value: 'FinancialYear', label: 'Financial year' },
                            { value: 'Last100', label: 'Last 100' },
                        ]}
                    />
                </div>
                <div className="filter-chips" aria-label="Active filters">
                    {customer ? (
                        <button
                            onClick={() => {
                                setCustomer('');
                            }}
                            type="button"
                        >
                            Customer: {customer} ×
                        </button>
                    ) : null}
                    {invoiceNumber ? (
                        <button
                            onClick={() => {
                                setInvoiceNumber('');
                            }}
                            type="button"
                        >
                            Invoice: {invoiceNumber} ×
                        </button>
                    ) : null}
                    {fromDate || toDate ? (
                        <button
                            onClick={() => {
                                setFromDate('');
                                setToDate('');
                            }}
                            type="button"
                        >
                            Date range ×
                        </button>
                    ) : null}
                    {status !== 'All' ? (
                        <button
                            onClick={() => {
                                setStatus('All');
                            }}
                            type="button"
                        >
                            Status: {status} ×
                        </button>
                    ) : null}
                    <button onClick={reset} type="button">
                        <RotateCcw aria-hidden="true" size={16} /> Clear all
                    </button>
                </div>
                <div className="report-toolbar">
                    <div>
                        <strong>
                            {visibleRecords.length} of {totalRecords} records loaded
                        </strong>
                        <small> Latest records appear first.</small>
                    </div>
                    <div>
                        <button
                            disabled={totalRecords === 0 || trialExpired}
                            onClick={exportAll}
                            type="button"
                        >
                            <Sheet aria-hidden="true" size={17} /> Export
                        </button>
                        <button
                            disabled={totalRecords === 0 || trialExpired}
                            onClick={runReportPrint}
                            type="button"
                        >
                            <Printer aria-hidden="true" size={17} /> Print report
                        </button>
                        <button
                            className="button-primary"
                            disabled={
                                totalRecords === 0 ||
                                trialExpired ||
                                status === 'Draft' ||
                                (!usesServerPaging &&
                                    !matchingRecords.some(
                                        (record) =>
                                            record.status === 'Finalized' ||
                                            record.status === 'Cancelled',
                                    ))
                            }
                            onClick={() => {
                                runNextRecordBatch();
                            }}
                            type="button"
                        >
                            <Printer aria-hidden="true" size={17} /> Print records
                        </button>
                    </div>
                </div>
                {trialExpired ? (
                    <p className="feedback-info">
                        The trial is read-only. Reports remain viewable, but export and printing
                        require activation.
                    </p>
                ) : null}
                {error || pageError ? (
                    <div className="feedback-error">
                        <strong>Report data could not be loaded.</strong>
                        <p>{error || pageError}</p>
                    </div>
                ) : null}
                {isLoading || (pageLoading && visibleRecords.length === 0) ? (
                    <div className="empty-panel">Loading report data…</div>
                ) : null}
                {!isLoading && !pageLoading && totalRecords === 0 ? (
                    <div className="empty-panel">
                        <Search aria-hidden="true" />
                        <h2>No matching records</h2>
                        <p>Adjust the filters or finalize a document first.</p>
                    </div>
                ) : (
                    <div className="product-table-wrap">
                        <ReportResults records={visibleRecords} reportId={reportId} />
                        <div className="report-sentinel" ref={sentinelRef}>
                            {usesServerPaging
                                ? nextCursor
                                    ? pageLoading
                                        ? 'Loading more…'
                                        : 'Scroll for more'
                                    : 'End of results'
                                : visibleRecords.length < matchingRecords.length
                                  ? 'Loading more…'
                                  : 'End of results'}
                        </div>
                    </div>
                )}
            </section>
            <AppModal
                isOpen={Boolean(task)}
                onClose={() => {
                    if (!task?.running) setTask(undefined);
                }}
                title={task?.kind === 'records' ? 'Printing records' : 'Printing report'}
            >
                {task ? (
                    <div className="print-progress">
                        <div>
                            <strong>
                                {task.completed} of {task.total}
                            </strong>
                            <span>
                                {task.total > 0
                                    ? Math.round((task.completed / task.total) * 100)
                                    : 0}
                                %
                            </span>
                        </div>
                        <progress max={Math.max(task.total, 1)} value={task.completed} />
                        {task.message ? <p>{task.message}</p> : null}
                        {task.awaitingContinue ? (
                            <div className="popup-actions">
                                <button
                                    onClick={() => {
                                        setTask(undefined);
                                    }}
                                    type="button"
                                >
                                    Stop
                                </button>
                                <button
                                    className="button-primary"
                                    onClick={() => {
                                        runNextRecordBatch(task.completed, printSource);
                                    }}
                                    type="button"
                                >
                                    Print next 10
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => {
                                    if (!task.running || !task.jobId) {
                                        setTask(undefined);
                                        return;
                                    }
                                    const cancel = window.vaultBillDesktop
                                        ? window.vaultBillDesktop.cancelOutput(task.jobId)
                                        : capabilities.isLanBrowser
                                          ? requestHostedApi('/print/cancel', 'POST', {
                                                jobId: task.jobId,
                                            })
                                          : Promise.resolve(false);
                                    void cancel.finally(() => {
                                        setTask(undefined);
                                    });
                                }}
                                type="button"
                            >
                                {task.running ? 'Cancel output' : 'Close'}
                            </button>
                        )}
                    </div>
                ) : null}
            </AppModal>
        </div>
    );
};

const loadPrintPackages = async (
    records: readonly AppRecord[],
    isLanBrowser: boolean,
): Promise<ReadonlyMap<string, RecordPrintPackage>> => {
    const formatIds = [...new Set(records.map((record) => record.formatId))];
    const loaded = await Promise.all(
        formatIds.map(async (formatId) => ({
            formatId,
            package: await loadRecordPrintPackage(formatId, isLanBrowser).catch(() => undefined),
        })),
    );
    return new Map(
        loaded.flatMap((item) => (item.package ? [[item.formatId, item.package] as const] : [])),
    );
};

const requestReportPage = async (query: Readonly<Record<string, unknown>>): Promise<ReportPage> => {
    const rawPage = window.vaultBillDesktop
        ? await window.vaultBillDesktop.queryReport(query)
        : await requestHostedApi<{
              readonly rows: readonly unknown[];
              readonly total: number;
              readonly nextCursor?: string;
          }>('/reports/query', 'POST', query);
    return {
        rows: rawPage.rows.map((row) => AppRecordSchema.parse(row)),
        total: rawPage.total,
        ...(rawPage.nextCursor ? { nextCursor: rawPage.nextCursor } : {}),
    };
};

const ReportRow: FC<{ readonly record: AppRecord }> = ({ record }) => (
    <tr>
        <td>{record.documentNumber ?? 'Draft'}</td>
        <td>{record.invoiceDate}</td>
        <td>{record.customerName}</td>
        <td>{record.gstin}</td>
        <td>
            <span className="status-pill">{record.status}</span>
        </td>
        <td className="numeric-cell">₹{record.grandTotal}</td>
    </tr>
);

const escapeCsv = (value: string): string => `"${value.replaceAll('"', '""')}"`;

const ReportResults: FC<{
    readonly reportId: string;
    readonly records: readonly AppRecord[];
}> = ({ reportId, records }) => {
    if (reportId === 'tax-summary') {
        const rows = buildTaxSummary(records);
        return (
            <table className="product-table">
                <thead>
                    <tr>
                        <th>Tax rate</th>
                        <th className="numeric-cell">Taxable value</th>
                        <th className="numeric-cell">Tax amount</th>
                        <th className="numeric-cell">Finalized lines</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.rate}>
                            <td>{row.rate}%</td>
                            <td className="numeric-cell">₹{row.taxable.toFixed(2)}</td>
                            <td className="numeric-cell">₹{row.tax.toFixed(2)}</td>
                            <td className="numeric-cell">{row.count}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }
    if (reportId === 'customer-ledger') {
        const rows = buildCustomerLedger(records);
        return (
            <table className="product-table">
                <thead>
                    <tr>
                        <th>Customer</th>
                        <th>GSTIN</th>
                        <th>Latest document</th>
                        <th className="numeric-cell">Documents</th>
                        <th className="numeric-cell">Cancelled</th>
                        <th className="numeric-cell">Finalized revenue</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={`${row.customer}:${row.gstin}`}>
                            <td>{row.customer}</td>
                            <td>{row.gstin}</td>
                            <td>{row.latestDate}</td>
                            <td className="numeric-cell">{row.documents}</td>
                            <td className="numeric-cell">{row.cancelled}</td>
                            <td className="numeric-cell">₹{row.revenue.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }
    return (
        <table className="product-table">
            <thead>
                <tr>
                    <th>Document</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>GSTIN</th>
                    <th>Status</th>
                    <th className="numeric-cell">Amount</th>
                </tr>
            </thead>
            <tbody>
                {records.map((record) => (
                    <ReportRow key={record.recordId} record={record} />
                ))}
            </tbody>
        </table>
    );
};

const buildTaxSummary = (records: readonly AppRecord[]) => {
    const summary = new Map<
        string,
        { rate: string; taxable: number; tax: number; count: number }
    >();
    for (const record of records.filter((item) => item.status === 'Finalized')) {
        for (const line of record.lineItems) {
            const rateNumber = Number.parseFloat(line.taxPercent) || 0;
            const gross = Number.parseFloat(line.amount) || 0;
            const taxable = rateNumber === 0 ? gross : gross / (1 + rateNumber / 100);
            const current = summary.get(line.taxPercent) ?? {
                rate: line.taxPercent,
                taxable: 0,
                tax: 0,
                count: 0,
            };
            current.taxable += taxable;
            current.tax += gross - taxable;
            current.count += 1;
            summary.set(line.taxPercent, current);
        }
    }
    return [...summary.values()].sort(
        (left, right) => Number.parseFloat(left.rate) - Number.parseFloat(right.rate),
    );
};

const buildCustomerLedger = (records: readonly AppRecord[]) => {
    const ledger = new Map<
        string,
        {
            customer: string;
            gstin: string;
            latestDate: string;
            documents: number;
            cancelled: number;
            revenue: number;
        }
    >();
    for (const record of records) {
        const key = `${record.customerName.toLocaleLowerCase()}:${record.gstin.toLocaleLowerCase()}`;
        const current = ledger.get(key) ?? {
            customer: record.customerName,
            gstin: record.gstin,
            latestDate: record.invoiceDate,
            documents: 0,
            cancelled: 0,
            revenue: 0,
        };
        current.documents += 1;
        current.latestDate =
            current.latestDate > record.invoiceDate ? current.latestDate : record.invoiceDate;
        if (record.status === 'Cancelled') current.cancelled += 1;
        if (record.status === 'Finalized')
            current.revenue += Number.parseFloat(record.grandTotal) || 0;
        ledger.set(key, current);
    }
    return [...ledger.values()].sort(
        (left, right) =>
            right.revenue - left.revenue || left.customer.localeCompare(right.customer),
    );
};

const buildReportCsv = (reportId: string, records: readonly AppRecord[]): string => {
    let rows: readonly (readonly string[])[];
    if (reportId === 'tax-summary') {
        rows = [
            ['Tax rate', 'Taxable value', 'Tax amount', 'Finalized lines'],
            ...buildTaxSummary(records).map((row) => [
                row.rate,
                row.taxable.toFixed(2),
                row.tax.toFixed(2),
                String(row.count),
            ]),
        ];
    } else if (reportId === 'customer-ledger') {
        rows = [
            ['Customer', 'GSTIN', 'Latest document', 'Documents', 'Cancelled', 'Finalized revenue'],
            ...buildCustomerLedger(records).map((row) => [
                row.customer,
                row.gstin,
                row.latestDate,
                String(row.documents),
                String(row.cancelled),
                row.revenue.toFixed(2),
            ]),
        ];
    } else {
        rows = [
            ['Document', 'Date', 'Customer', 'GSTIN', 'Status', 'Amount'],
            ...records.map((record) => [
                record.documentNumber ?? '',
                record.invoiceDate,
                record.customerName,
                record.gstin,
                record.status,
                record.grandTotal,
            ]),
        ];
    }
    return rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
};

const renderReportHtml = (reportId: string, records: readonly AppRecord[]): string => `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>${escapePrintHtml(reportId)}</title>
    <style>
      body { font-family: sans-serif; margin: 32px; color: #102f2b; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border-bottom: 1px solid #c7d9d5; padding: 8px; text-align: left; }
      th:last-child, td:last-child { text-align: right; }
    </style>
  </head>
  <body>
    <h1>${escapePrintHtml(reportId.replaceAll('-', ' '))}</h1>
    <p>${records.length.toLocaleString()} matching records</p>
    ${renderReportTable(reportId, records)}
  </body>
</html>`;

const renderReportTable = (reportId: string, records: readonly AppRecord[]): string => {
    if (reportId === 'tax-summary') {
        return `<table><thead><tr><th>Tax rate</th><th>Taxable value</th><th>Tax amount</th><th>Lines</th></tr></thead><tbody>${buildTaxSummary(
            records,
        )
            .map(
                (row) =>
                    `<tr><td>${escapePrintHtml(row.rate)}%</td><td>${row.taxable.toFixed(2)}</td><td>${row.tax.toFixed(2)}</td><td>${String(row.count)}</td></tr>`,
            )
            .join('')}</tbody></table>`;
    }
    if (reportId === 'customer-ledger') {
        return `<table><thead><tr><th>Customer</th><th>GSTIN</th><th>Documents</th><th>Cancelled</th><th>Revenue</th></tr></thead><tbody>${buildCustomerLedger(
            records,
        )
            .map(
                (row) =>
                    `<tr><td>${escapePrintHtml(row.customer)}</td><td>${escapePrintHtml(row.gstin)}</td><td>${String(row.documents)}</td><td>${String(row.cancelled)}</td><td>${row.revenue.toFixed(2)}</td></tr>`,
            )
            .join('')}</tbody></table>`;
    }
    return `<table><thead><tr><th>Document</th><th>Date</th><th>Customer</th><th>Status</th><th>Amount</th></tr></thead><tbody>${records
        .map(
            (record) =>
                `<tr><td>${escapePrintHtml(record.documentNumber ?? 'Draft')}</td><td>${escapePrintHtml(record.invoiceDate)}</td><td>${escapePrintHtml(record.customerName)}</td><td>${record.status}</td><td>${record.status === 'Cancelled' ? 'Excluded' : escapePrintHtml(record.grandTotal)}</td></tr>`,
        )
        .join('')}</tbody></table>`;
};
