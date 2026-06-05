import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { FC } from 'react';

import { ActionBar } from '../../components/ActionBar';
import { AppConfirmDialog } from '../../components/AppConfirmDialog/AppConfirmDialog';
import { AppModal } from '../../components/AppModal/AppModal';
import { HorizontalProgress } from '../../components/HorizontalProgress/HorizontalProgress';
import { SearchableDropdown } from '../../components/SearchableDropdown/SearchableDropdown';
import { documentFormatSummaries } from '../../constants/PhaseFourFormats';
import { useSession } from '../auth/SessionContext';

const tabs = ['New', 'Drafts', 'Finalized', 'Cancelled', 'Reprint'] as const;

export const RecordsPage: FC = () => {
  const { operatorContext } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const [formatId, setFormatId] = useState(documentFormatSummaries[0]?.formatId ?? 'TaxInvoice');
  const [pendingFormatId, setPendingFormatId] = useState<string>();
  const [customerName, setCustomerName] = useState('');
  const [isFinalizeOpen, setIsFinalizeOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const activeTab = searchParams.get('tab') ?? 'new';
  const formatOptions = documentFormatSummaries.map((format) => ({
    value: format.formatId,
    label: format.formatName,
    description: format.description,
  }));
  const isDirty = customerName.trim().length > 0;

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
    setNotice(`${actionId === 'save-draft' ? 'Draft saved' : 'Output prepared'} successfully.`);
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
        <section className="empty-panel">
          <p className="eyebrow">{activeTab}</p>
          <h2>No matching records yet</h2>
          <p>Records in this category will appear here with search and filters.</p>
        </section>
      )}

      <AppModal
        isOpen={pendingFormatId !== undefined}
        onClose={() => {
          setPendingFormatId(undefined);
        }}
        title="Change document format?"
      >
        <p>You have unsaved values. Choose how VaultBill should handle them.</p>
        <div className="popup-actions popup-actions--stack">
          <button
            onClick={() => {
              if (pendingFormatId) setFormatId(pendingFormatId);
              setPendingFormatId(undefined);
            }}
            type="button"
          >
            Keep matching fields
          </button>
          <button
            onClick={() => {
              if (pendingFormatId) setFormatId(pendingFormatId);
              setCustomerName('');
              setPendingFormatId(undefined);
            }}
            type="button"
          >
            Clear form
          </button>
          <button
            onClick={() => {
              setPendingFormatId(undefined);
            }}
            type="button"
          >
            Cancel
          </button>
        </div>
      </AppModal>
      <AppConfirmDialog
        confirmLabel="Finalize"
        description="VaultBill will allocate the next document number and lock this record for editing."
        isOpen={isFinalizeOpen}
        onCancel={() => {
          setIsFinalizeOpen(false);
        }}
        onConfirm={() => {
          setIsFinalizeOpen(false);
          setNotice('Document finalized successfully.');
        }}
        title="Finalize this document?"
      />
    </div>
  );
};
