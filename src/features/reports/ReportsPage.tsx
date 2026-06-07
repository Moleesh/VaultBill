/* eslint-disable max-lines */
import { Printer, RotateCcw, Search, Sheet } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FC } from 'react';

import { AppDatePicker } from '../../components/AppDatePicker/AppDatePicker';
import { AppModal } from '../../components/AppModal/AppModal';
import { SearchableDropdown } from '../../components/SearchableDropdown/SearchableDropdown';
import type { AppRecord } from '../records/RecordStoreContext';
import { useRecordStore } from '../records/RecordStoreContext';

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
};

export const ReportsPage: FC = () => {
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
  const sentinelRef = useRef<HTMLDivElement>(null);

  const matchingRecords = useMemo(() => {
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

  const visibleRecords = matchingRecords.slice(0, visibleCount);
  const customers = [
    ...new Set(records.map((record) => record.customerName).filter(Boolean)),
  ].sort();

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [customer, invoiceNumber, fromDate, toDate, status, preset, reportId]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (
      !sentinel ||
      visibleCount >= matchingRecords.length ||
      typeof IntersectionObserver === 'undefined'
    )
      return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleCount((current) => Math.min(matchingRecords.length, current + pageSize));
        }
      },
      { rootMargin: '300px' },
    );
    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [matchingRecords.length, visibleCount]);

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

  const exportAll = () => {
    const header = ['Document', 'Date', 'Customer', 'GSTIN', 'Status', 'Amount'];
    const rows = matchingRecords.map((record) => [
      record.documentNumber ?? '',
      record.invoiceDate,
      record.customerName,
      record.gstin,
      record.status,
      record.grandTotal,
    ]);
    const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${reportId}-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const runReportPrint = () => {
    setTask({ kind: 'report', completed: 0, total: matchingRecords.length });
    window.setTimeout(() => {
      setTask({ kind: 'report', completed: matchingRecords.length, total: matchingRecords.length });
      window.print();
      window.setTimeout(() => {
        setTask(undefined);
      }, 250);
    }, 250);
  };

  const runNextRecordBatch = (startAt = 0) => {
    const printable = matchingRecords.filter((record) => record.status === 'Finalized');
    const nextCompleted = Math.min(printable.length, startAt + printBatchSize);
    setTask({ kind: 'records', completed: startAt, total: printable.length });
    let completed = startAt;
    const timer = window.setInterval(() => {
      completed += 1;
      if (completed >= nextCompleted) {
        window.clearInterval(timer);
        window.print();
        setTask({
          kind: 'records',
          completed: nextCompleted,
          total: printable.length,
          awaitingContinue: nextCompleted < printable.length,
        });
        return;
      }
      setTask({ kind: 'records', completed, total: printable.length });
    }, 140);
  };

  return (
    <div className="page-stack reports-page">
      <div className="operational-header">
        <div>
          <p className="eyebrow">Reports</p>
          <h1>Business reports</h1>
          <p>Search the complete record history, then export or print exactly what matches.</p>
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
              {visibleRecords.length} of {matchingRecords.length} records loaded
            </strong>
            <small> Latest records appear first.</small>
          </div>
          <div>
            <button disabled={matchingRecords.length === 0} onClick={exportAll} type="button">
              <Sheet aria-hidden="true" size={17} /> Export
            </button>
            <button disabled={matchingRecords.length === 0} onClick={runReportPrint} type="button">
              <Printer aria-hidden="true" size={17} /> Print report
            </button>
            <button
              className="button-primary"
              disabled={!matchingRecords.some((record) => record.status === 'Finalized')}
              onClick={() => {
                runNextRecordBatch();
              }}
              type="button"
            >
              <Printer aria-hidden="true" size={17} /> Print records
            </button>
          </div>
        </div>
        {error ? (
          <div className="feedback-error">
            <strong>Report data could not be loaded.</strong>
            <p>{error}</p>
          </div>
        ) : null}
        {isLoading ? <div className="empty-panel">Loading report data…</div> : null}
        {!isLoading && matchingRecords.length === 0 ? (
          <div className="empty-panel">
            <Search aria-hidden="true" />
            <h2>No matching records</h2>
            <p>Adjust the filters or finalize a document first.</p>
          </div>
        ) : (
          <div className="product-table-wrap">
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
                {visibleRecords.map((record) => (
                  <ReportRow key={record.recordId} record={record} />
                ))}
              </tbody>
            </table>
            <div className="report-sentinel" ref={sentinelRef}>
              {visibleRecords.length < matchingRecords.length ? 'Loading more…' : 'End of results'}
            </div>
          </div>
        )}
      </section>
      <AppModal
        isOpen={Boolean(task)}
        onClose={() => {
          setTask(undefined);
        }}
        title={task?.kind === 'records' ? 'Printing records' : 'Printing report'}
      >
        {task ? (
          <div className="print-progress">
            <div>
              <strong>
                {task.completed} of {task.total}
              </strong>
              <span>{task.total > 0 ? Math.round((task.completed / task.total) * 100) : 0}%</span>
            </div>
            <progress max={Math.max(task.total, 1)} value={task.completed} />
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
                    runNextRecordBatch(task.completed);
                  }}
                  type="button"
                >
                  Print next 10
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setTask(undefined);
                }}
                type="button"
              >
                Cancel
              </button>
            )}
          </div>
        ) : null}
      </AppModal>
    </div>
  );
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
