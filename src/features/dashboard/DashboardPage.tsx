import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import type { FC } from 'react';

import { useSession } from '../auth/SessionContext';

const recentRecords = [
  { number: 'INV-1042', customer: 'Northstar Supplies', amount: '₹18,420.00' },
  { number: 'INV-1041', customer: 'Mango Street Retail', amount: '₹7,860.00' },
  { number: 'INV-1040', customer: 'Aster Works', amount: '₹12,300.00' },
] as const;

export const DashboardPage: FC = () => {
  const { operatorContext } = useSession();

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
        <Link to="/app/records?tab=drafts">
          <span>Continue drafts</span>
          <small>3 records need attention</small>
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
          <Link to="/app/records?tab=finalized">View all</Link>
        </div>
        <div className="record-list">
          {recentRecords.map((record) => (
            <article key={record.number}>
              <strong>{record.number}</strong>
              <span>{record.customer}</span>
              <span>{record.amount}</span>
              <button type="button">Reprint</button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
