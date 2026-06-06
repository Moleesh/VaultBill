import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import type { FC } from 'react';

import { useSession } from '../auth/SessionContext';
import { useRecordStore } from '../records/RecordStoreContext';

export const DashboardPage: FC = () => {
  const { operatorContext } = useSession();
  const { records } = useRecordStore();
  const draftCount = records.filter((record) => record.status === 'Draft').length;
  const recentRecords = records.filter((record) => record.status !== 'Draft').slice(0, 3);

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <p className="eyebrow">{format(new Date(), 'EEEE, d MMMM')}</p>
          <h1>Welcome back, {operatorContext?.account.displayName}.</h1>
          <p>Start a document, continue a draft, or review today’s activity.</p>
        </div>
        <Link className="button-primary" to="/app/records/new">
          Create document
        </Link>
      </section>

      <section className="dashboard-actions" aria-label="Quick actions">
        <Link to="/app/records/new">
          <span>New document</span>
          <small>Choose a format and begin entry</small>
        </Link>
        <Link to="/app/records">
          <span>Continue drafts</span>
          <small>
            {draftCount === 0
              ? 'No drafts need attention'
              : `${String(draftCount)} draft${draftCount === 1 ? '' : 's'} need attention`}
          </small>
        </Link>
        <Link to="/app/reports">
          <span>Open reports</span>
          <small>Filter, export, and print results</small>
        </Link>
      </section>

      <section className="data-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Recent activity</p>
            <h2>Finalized records</h2>
          </div>
          <Link to="/app/records?tab=reprint">View all</Link>
        </div>
        {recentRecords.length === 0 ? (
          <div className="empty-panel">
            <h3>No finalized records yet</h3>
            <p>Finalized documents will appear here for quick reprint access.</p>
          </div>
        ) : (
          <div className="record-list">
            {recentRecords.map((record) => (
              <article key={record.recordId}>
                <strong>{record.documentNumber ?? ''}</strong>
                <span>{record.customerName}</span>
                <span>₹{record.grandTotal}</span>
                <Link to={`/app/records?tab=reprint&record=${record.recordId}`}>Reprint</Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
