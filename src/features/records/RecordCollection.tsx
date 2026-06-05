import type { FC } from 'react';

import type { WebRecord } from './useWebRecordStore';

type RecordCollectionProps = {
  readonly activeTab: string;
  readonly error: string;
  readonly isLoading: boolean;
  readonly records: readonly WebRecord[];
};

const matchesTab = (record: WebRecord, activeTab: string): boolean => {
  if (activeTab === 'reprint') {
    return record.status === 'Finalized' || record.status === 'Cancelled';
  }

  return record.status.toLocaleLowerCase() === activeTab.replace(/s$/u, '');
};

export const RecordCollection: FC<RecordCollectionProps> = ({
  activeTab,
  error,
  isLoading,
  records,
}) => {
  const matchingRecords = records.filter((record) => matchesTab(record, activeTab));

  if (isLoading) {
    return (
      <section aria-live="polite" className="empty-panel">
        <p className="eyebrow">{activeTab}</p>
        <h2>Loading hosted records…</h2>
      </section>
    );
  }

  if (matchingRecords.length === 0) {
    return (
      <section className="empty-panel">
        <p className="eyebrow">{activeTab}</p>
        <h2>No matching records yet</h2>
        <p>{error || 'Records in this category will appear here with search and filters.'}</p>
      </section>
    );
  }

  return (
    <section className="record-list" aria-label={`${activeTab} records`}>
      {error ? <p className="feedback-error">{error}</p> : null}
      {matchingRecords.map((record) => (
        <article key={record.recordId}>
          <div>
            <strong>{record.customerName || 'Unnamed customer'}</strong>
            <small>{record.formatName}</small>
          </div>
          <div>
            <span className="status-pill">{record.status}</span>
            <small>{new Date(record.updatedAt).toLocaleString()}</small>
          </div>
        </article>
      ))}
    </section>
  );
};
