import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { FC } from 'react';

import { ActionBar } from '../../components/ActionBar';
import { HorizontalProgress } from '../../components/HorizontalProgress/HorizontalProgress';
import { SearchableDropdown } from '../../components/SearchableDropdown/SearchableDropdown';
import { documentFormatSummaries } from '../../constants/PhaseFourFormats';
import { useSession } from '../auth/SessionContext';
import { RecordCollection } from './RecordCollection';
import { RecordDialogs } from './RecordDialogs';
import { useWebRecordStore } from './useWebRecordStore';

const tabs = ['New', 'Drafts', 'Finalized', 'Cancelled', 'Reprint'] as const;

export const RecordsPage: FC = () => {
  const { operatorContext } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const [formatId, setFormatId] = useState(documentFormatSummaries[0]?.formatId ?? 'TaxInvoice');
  const [pendingFormatId, setPendingFormatId] = useState<string>();
  const [customerName, setCustomerName] = useState('');
  const [recordId] = useState(() => crypto.randomUUID());
  const [isFinalizeOpen, setIsFinalizeOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const webRecordStore = useWebRecordStore();
  const activeTab = searchParams.get('tab') ?? 'new';
  const formatOptions = documentFormatSummaries.map((format) => ({
    value: format.formatId,
    label: format.formatName,
    description: format.description,
  }));
  const isDirty = customerName.trim().length > 0;
  const activeFormat = documentFormatSummaries.find((format) => format.formatId === formatId);

  const selectFormat = (nextFormatId: string) => {
    if (isDirty) {
      setPendingFormatId(nextFormatId);
      return;
    }
    setFormatId(nextFormatId);
  };

  const runAction = (actionId: string) => {
    if (actionId === 'finalize') {
      setIsFinalizeOpen(true);
      return;
    }

    if (actionId === 'save-draft') {
      setNotice('Draft saved successfully.');
      void persistRecord('Draft');
      return;
    }

    setNotice('Output prepared successfully.');
  };

  const persistRecord = async (status: 'Draft' | 'Finalized') => {
    const stored = await webRecordStore.saveRecord({
      recordId,
      formatId,
      formatName: activeFormat?.formatName ?? formatId,
      status,
      customerName: customerName.trim(),
      updatedAt: new Date().toISOString(),
    });

    if (stored) {
      setNotice(`${status} saved to hosted web storage.`);
    }
  };

  return (
    <div className="page-stack records-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Records</p>
          <h1>Documents that move with your work.</h1>
        </div>
        <SearchableDropdown
          label="Document format"
          onChange={selectFormat}
          options={formatOptions}
          value={formatId}
        />
      </div>
      <HorizontalProgress className="page-tabs" label="Record tabs">
        {tabs.map((tab) => (
          <button
            aria-pressed={activeTab === tab.toLocaleLowerCase()}
            key={tab}
            onClick={() => {
              setSearchParams({ tab: tab.toLocaleLowerCase() });
            }}
            type="button"
          >
            {tab}
          </button>
        ))}
      </HorizontalProgress>

      {activeTab === 'new' ? (
        <section className="record-workspace">
          <div className="record-workspace__form">
            <div className="section-heading">
              <div>
                <p className="eyebrow">New document</p>
                <h2>Customer and billing details</h2>
              </div>
              <span className="status-pill">Draft by {operatorContext?.CreatedByName}</span>
            </div>
            <div className="form-grid">
              <label>
                <span>Invoice date</span>
                <input defaultValue="2026-06-05" type="date" />
              </label>
              <label>
                <span>Customer name</span>
                <input
                  onChange={(event) => {
                    setCustomerName(event.currentTarget.value);
                  }}
                  placeholder="Business or customer name"
                  value={customerName}
                />
              </label>
              <label>
                <span>GSTIN</span>
                <input placeholder="Optional GST number" />
              </label>
              <label>
                <span>State</span>
                <input placeholder="Select state" />
              </label>
              <label className="span-2">
                <span>Billing address</span>
                <textarea placeholder="Address shown on the document" />
              </label>
            </div>
            <HorizontalProgress className="line-item-grid" label="Line item columns">
              <div className="line-item-grid__row line-item-grid__header">
                <span>Item</span>
                <span>HSN/SAC</span>
                <span>Quantity</span>
                <span>Rate</span>
                <span>Tax</span>
                <span>Amount</span>
              </div>
              <div className="line-item-grid__row">
                <input aria-label="Item name" placeholder="Item or service" />
                <input aria-label="HSN or SAC" placeholder="Code" />
                <input aria-label="Quantity" defaultValue="1" />
                <input aria-label="Rate" placeholder="0.00" />
                <input aria-label="Tax" placeholder="0%" />
                <output aria-label="Amount">₹0.00</output>
              </div>
            </HorizontalProgress>
          </div>
          {notice ? (
            <p className="feedback-success" role="status">
              {notice}
            </p>
          ) : null}
          <ActionBar onAction={runAction} role={operatorContext?.role ?? 'User'} />
        </section>
      ) : (
        <RecordCollection
          activeTab={activeTab}
          error={webRecordStore.error}
          isLoading={webRecordStore.isLoading}
          records={webRecordStore.records}
        />
      )}

      <RecordDialogs
        isFinalizeOpen={isFinalizeOpen}
        onCancelFormat={() => {
          setPendingFormatId(undefined);
        }}
        onClearAndChangeFormat={() => {
          if (pendingFormatId) setFormatId(pendingFormatId);
          setCustomerName('');
          setPendingFormatId(undefined);
        }}
        onFinalize={() => {
          setIsFinalizeOpen(false);
          setNotice('Document finalized successfully.');
          void persistRecord('Finalized');
        }}
        onKeepAndChangeFormat={() => {
          if (pendingFormatId) setFormatId(pendingFormatId);
          setPendingFormatId(undefined);
        }}
        onSetFinalizeOpen={setIsFinalizeOpen}
        pendingFormatId={pendingFormatId}
      />
    </div>
  );
};
