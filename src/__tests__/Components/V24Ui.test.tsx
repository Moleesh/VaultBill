import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';

import { CapabilityProvider } from '../../capability/CapabilityContext';
import type { CapabilityRegistry } from '../../capability/Capability.types';
import { SearchableDropdown } from '../../components/SearchableDropdown/SearchableDropdown';
import { SessionProvider } from '../../features/auth/SessionContext';
import { BuilderPage } from '../../features/builder/BuilderPage';
import { RecordsPage } from '../../features/records/RecordsPage';
import { RecordStoreProvider } from '../../features/records/RecordStoreContext';
import { ReportsPage } from '../../features/reports/ReportsPage';

const webCapabilities: CapabilityRegistry = {
  isDesktop: false,
  isLanBrowser: false,
  isDemoMode: true,
  canListPrinters: false,
  canSelectExactPrinter: false,
  canBrowserPrint: true,
  canDownloadPdf: false,
  canBackup: false,
  canRestore: false,
  canUsbSignaturePad: false,
  canLanServer: false,
  canSmsIntegration: false,
  canGspIntegration: false,
  hasLocalDb: false,
};

const renderPage = (children: ReactNode, capabilities = webCapabilities) =>
  render(
    <MemoryRouter>
      <CapabilityProvider value={capabilities}>
        <SessionProvider>
          <RecordStoreProvider>{children}</RecordStoreProvider>
        </SessionProvider>
      </CapabilityProvider>
    </MemoryRouter>,
  );

describe('v24 product UI', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="portal-root"></div>';
    window.localStorage.clear();
    window.localStorage.setItem('vaultbill.operator', 'demo_user');
  });

  it('moves a new record into the saved Draft state', async () => {
    renderPage(<RecordsPage />);

    fireEvent.change(screen.getByPlaceholderText('Business or customer name'), {
      target: { value: 'Aster Works' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Draft Control\+S$/u }));

    expect(
      await screen.findByText('Draft saved. Draft Print and Finalize are now available.'),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: /Finalize/u })).toBeEnabled();
  });

  it('shows demo report data and the six Builder steps', async () => {
    renderPage(
      <>
        <ReportsPage />
        <BuilderPage />
      </>,
    );

    expect((await screen.findAllByText('Aster Works')).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: /5 Print/u }));
    expect(screen.getByRole('heading', { name: 'Print' })).toBeVisible();
    expect(
      screen.getByText(/Unsafe scripts, frames, forms, and remote URLs are removed/u),
    ).toBeVisible();
  });

  it('shows the document name field without exposing the internal format ID', () => {
    renderPage(<BuilderPage />);

    expect(screen.getByRole('heading', { name: 'Format' })).toBeVisible();
    expect(screen.getByText('Document name')).toBeVisible();
    expect(screen.queryByText('Format ID')).not.toBeInTheDocument();
  });

  it('hides sample value editing in the field drawer', () => {
    render(
      <MemoryRouter initialEntries={['/app/builder?step=fields']}>
        <CapabilityProvider value={webCapabilities}>
          <SessionProvider>
            <RecordStoreProvider>
              <BuilderPage />
            </RecordStoreProvider>
          </SessionProvider>
        </CapabilityProvider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /2 Fields/u }));
    const [invoiceDateButton] = screen.getAllByRole('button', { name: /Invoice Date/u });
    if (!invoiceDateButton) {
      throw new Error('Invoice Date field button was not found.');
    }
    fireEvent.click(invoiceDateButton);

    expect(screen.getByRole('dialog', { name: /Edit Invoice Date/u })).toBeVisible();
    expect(screen.getAllByText('Edit Invoice Date').length).toBeGreaterThan(1);
    expect(screen.queryByText('Sample value')).not.toBeInTheDocument();
  });

  it('shows field and print previews in the final builder step', () => {
    render(
      <MemoryRouter initialEntries={['/app/builder?step=preview']}>
        <CapabilityProvider value={webCapabilities}>
          <SessionProvider>
            <RecordStoreProvider>
              <BuilderPage />
            </RecordStoreProvider>
          </SessionProvider>
        </CapabilityProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /Field preview/u })).toBeVisible();
    expect(screen.getByRole('heading', { name: /Print preview/u })).toBeVisible();
    expect(screen.getByLabelText('Invoice Date')).toBeVisible();
    expect(screen.getByText('Item Name')).toBeVisible();
  });

  it('filters long dropdown options through its portal', () => {
    const options = Array.from({ length: 9 }, (_, index) => ({
      value: `state-${String(index)}`,
      label: `State ${String(index)}`,
      keywords: [`region-${String(index)}`],
    }));

    renderPage(
      <SearchableDropdown
        label="State"
        onChange={() => undefined}
        options={options}
        value="state-0"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /State State 0/u }));
    fireEvent.change(screen.getByPlaceholderText('Search options'), {
      target: { value: 'region-8' },
    });
    expect(screen.getByRole('option', { name: 'State 8' })).toBeVisible();
    expect(screen.queryByRole('option', { name: 'State 1' })).not.toBeInTheDocument();
  });
});
