/* eslint-disable max-lines */
import { useRef, useState } from 'react';
import type { FC } from 'react';

import { AppDatePicker } from '../../components/AppDatePicker/AppDatePicker';
import { SearchableDropdown } from '../../components/SearchableDropdown/SearchableDropdown';
import { useRecordStore } from '../records/RecordStoreContext';

const reportOptions = [
  {
    value: 'sales-register',
    label: 'Sales register',
    description: 'Finalized and cancelled GST invoices.',
    keywords: ['invoice', 'gst', 'sales'],
  },
  {
    value: 'tax-summary',
    label: 'Tax summary',
    description: 'Taxable document totals by record.',
    keywords: ['gst', 'tax'],
  },
  {
    value: 'customer-ledger',
    label: 'Customer ledger',
    description: 'Latest customer billing activity.',
    keywords: ['customer', 'ledger'],
  },
] as const;

type BackgroundTask = {
  readonly kind: 'Export' | 'Print';
  readonly progress: number;
};

const escapeCsv = (value: string): string => `"${value.replaceAll('"', '""')}"`;

export const ReportsPage: FC = () => {
  const { error, isLoading, records } = useRecordStore();
  const [reportId, setReportId] = useState('sales-register');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [task, setTask] = useState<BackgroundTask>();
  const taskTimerRef = useRef<number | undefined>(undefined);
  const matchingRecords = records
    .filter((record) => record.status !== 'Draft')
    .filter((record) => !fromDate || record.invoiceDate >= fromDate)
    .filter((record) => !toDate || record.invoiceDate <= toDate)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

  const finishTask = (kind: BackgroundTask['kind']) => {
    if (kind === 'Export') {
      const csv = [
        ['Document', 'Date', 'Customer', 'GSTIN', 'Status', 'Amount'].map(escapeCsv).join(','),
        ...matchingRecords.map((record) =>
          [
            record.documentNumber ?? '',
            record.invoiceDate,
            record.customerName,
            record.gstin,
            record.status,
            record.grandTotal,
          ]
            .map(escapeCsv)
            .join(','),
        ),
      ].join('\n');
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${reportId}-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } else {
      window.print();
    }
    setTask(undefined);
  };

  const startTask = (kind: BackgroundTask['kind']) => {
    window.clearInterval(taskTimerRef.current);
    let progress = 12;
    setTask({ kind, progress });
    taskTimerRef.current = window.setInterval(() => {
      progress += 22;
      if (progress >= 100) {
        window.clearInterval(taskTimerRef.current);
        finishTask(kind);
        return;
      }
      setTask({ kind, progress });
    }, 90);
  };

  return (
    <div className="page-stack reports-page">
      <div className="operational-header">
        <div>
          <p className="eyebrow">Reports</p>
          <h1>Business reports</h1>
        </div>
        <SearchableDropdown
          label="Report"
          onChange={setReportId}
          options={reportOptions}
          value={reportId}
        />
      </div>
      <section className="data-panel">
        <div className="report-filters">
          <AppDatePicker label="From" onChange={setFromDate} value={fromDate} />
          <AppDatePicker label="To" onChange={setToDate} value={toDate} />
          <button
            onClick={() => {
              setFromDate('');
              setToDate('');
            }}
            type="button"
          >
            Reset filters
          </button>
        </div>
        <div className="report-toolbar">
          <div>
            <strong>{matchingRecords.length} matching records</strong>
            <small> Latest records appear first.</small>
          </div>
          <div>
            <button
              disabled={matchingRecords.length === 0 || task !== undefined}
              onClick={() => {
                startTask('Export');
              }}
              type="button"
            >
              Export all
            </button>
            <button
              className="button-primary"
              disabled={matchingRecords.length === 0 || task !== undefined}
              onClick={() => {
                startTask('Print');
              }}
              type="button"
            >
              Print all
            </button>
          </div>
        </div>
        {task ? (
          <div className="background-task" role="status">
            <div>
              <strong>{task.kind} in progress</strong>
              <span>{task.progress}%</span>
            </div>
            <progress max={100} value={task.progress} />
            <button
              onClick={() => {
                window.clearInterval(taskTimerRef.current);
                setTask(undefined);
              }}
              type="button"
            >
              Cancel
            </button>
          </div>
        ) : null}
        {error ? (
          <div className="feedback-error">
            <strong>Report data could not be loaded.</strong>
            <p>{error}</p>
          </div>
        ) : isLoading ? (
          <div className="empty-panel" aria-live="polite">
            <h2>Loading report data</h2>
            <div className="loading-skeleton" />
          </div>
        ) : matchingRecords.length === 0 ? (
          <div className="empty-panel">
            <p className="eyebrow">No results</p>
            <h2>No finalized records match this period</h2>
            <p>Adjust the date range or create and finalize a record first.</p>
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
                {matchingRecords.map((record) => (
                  <tr key={record.recordId}>
                    <td>{record.documentNumber ?? ''}</td>
                    <td>{record.invoiceDate}</td>
                    <td>{record.customerName}</td>
                    <td>{record.gstin}</td>
                    <td>
                      <span className="status-pill">{record.status}</span>
                    </td>
                    <td className="numeric-cell">₹{record.grandTotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
