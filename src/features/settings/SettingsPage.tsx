import { useState } from 'react';
import type { FC } from 'react';

import { useCapabilities } from '../../capability/CapabilityContext';
import { HorizontalProgress } from '../../components/HorizontalProgress/HorizontalProgress';

const tabs = [
  'Branding',
  'Themes',
  'Operators',
  'Printers',
  'Backup',
  'Security',
  'Network',
  'Help',
] as const;

export const SettingsPage: FC = () => {
  const capabilities = useCapabilities();
  const [activeTab, setActiveTab] = useState('Branding');
  const unavailable =
    (activeTab === 'Printers' && !capabilities.canListPrinters) ||
    (activeTab === 'Backup' && !capabilities.canBackup) ||
    (activeTab === 'Network' && !capabilities.canLanServer);

  return (
    <div className="page-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>Make VaultBill fit the way you operate.</h1>
        </div>
      </div>
      <HorizontalProgress className="page-tabs" label="Settings tabs">
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
      <section className="settings-panel">
        <div>
          <p className="eyebrow">{activeTab}</p>
          <h2>{activeTab} settings</h2>
          <p>Changes here are permission-aware and use the current platform capabilities.</p>
        </div>
        {unavailable ? (
          <div className="feedback-warning">
            This setting is desktop-only. Use the VaultBill desktop application to manage it.
          </div>
        ) : (
          <div className="form-grid">
            <label>
              <span>Display name</span>
              <input defaultValue="VaultBill" />
            </label>
            <label>
              <span>Company name</span>
              <input placeholder="Your business name" />
            </label>
          </div>
        )}
      </section>
    </div>
  );
};
