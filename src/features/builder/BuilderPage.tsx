import { useState } from 'react';
import type { FC } from 'react';

import { HorizontalProgress } from '../../components/HorizontalProgress/HorizontalProgress';

const tabs = [
  'Formats',
  'Fields',
  'Line Items',
  'Calculations',
  'Print Templates',
  'Report Setup',
] as const;

export const BuilderPage: FC = () => {
  const [activeTab, setActiveTab] = useState('Formats');

  return (
    <div className="page-stack">
      <section className="page-hero page-hero--compact">
        <div>
          <p className="eyebrow">Builder</p>
          <h1>Shape every document from one guided workspace.</h1>
          <p>
            Validate changes, review affected references, and restore the previous configuration
            when needed.
          </p>
        </div>
        <button className="button-primary" type="button">
          Validate configuration
        </button>
      </section>
      <HorizontalProgress className="page-tabs" label="Builder steps">
        {tabs.map((tab, index) => (
          <button
            aria-pressed={activeTab === tab}
            key={tab}
            onClick={() => {
              setActiveTab(tab);
            }}
            type="button"
          >
            <small>{index + 1}</small>
            {tab}
          </button>
        ))}
      </HorizontalProgress>
      <section className="builder-panel">
        <aside>
          <p className="eyebrow">Active format</p>
          <h2>GST Invoice</h2>
          <span className="status-pill">Default</span>
        </aside>
        <div>
          <p className="eyebrow">{activeTab}</p>
          <h2>Configure {activeTab.toLocaleLowerCase()}</h2>
          <p>
            The editor for this step uses validated JSON contracts and shows affected references
            before saving.
          </p>
          <div className="feedback-info">No unsaved configuration changes.</div>
        </div>
      </section>
    </div>
  );
};
