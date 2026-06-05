import { useState } from 'react';
import type { FC } from 'react';

import { HorizontalProgress } from '../../components/HorizontalProgress/HorizontalProgress';
import { SearchableDropdown } from '../../components/SearchableDropdown/SearchableDropdown';

const tabs = ['Reports', 'Preview', 'Export', 'Print'] as const;
const reportOptions = [
  { value: 'sales-register', label: 'Sales register', keywords: ['invoice', 'gst'] },
  { value: 'tax-summary', label: 'Tax summary', keywords: ['gst', 'tax'] },
  { value: 'customer-ledger', label: 'Customer ledger', keywords: ['customer'] },
] as const;

export const ReportsPage: FC = () => {
  const [activeTab, setActiveTab] = useState('Reports');
  const [reportId, setReportId] = useState('sales-register');

  return (
    <div className="page-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Reports</p>
          <h1>Answers without the spreadsheet chase.</h1>
        </div>
        <SearchableDropdown
          label="Report"
          onChange={setReportId}
          options={reportOptions}
          value={reportId}
        />
      </div>
      <HorizontalProgress className="page-tabs" label="Report tabs">
        {tabs.map((tab) => (
          <button
            aria-pressed={activeTab === tab}
            key={tab}
            onClick={() => {
              setActiveTab(tab);
            }}
            type="button"
          >
            {tab}
          </button>
        ))}
      </HorizontalProgress>
      <section className="data-panel">
        <div className="report-filters">
          <label>
            <span>From</span>
            <input type="date" />
          </label>
          <label>
            <span>To</span>
            <input type="date" />
          </label>
          <button className="button-primary" type="button">
            Apply filters
          </button>
        </div>
        <div className="empty-panel">
          <p className="eyebrow">{activeTab}</p>
          <h2>No finalized records match this period</h2>
          <p>Adjust the date range or choose another report. Exports include all matching rows.</p>
        </div>
      </section>
    </div>
  );
};
