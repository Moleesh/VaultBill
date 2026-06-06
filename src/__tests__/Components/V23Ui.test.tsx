import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';

import { CapabilityProvider } from '../../capability/CapabilityContext';
import type { CapabilityRegistry } from '../../capability/Capability.types';
import { ContextualHelp } from '../../components/ContextualHelp';
import { SearchableDropdown } from '../../components/SearchableDropdown/SearchableDropdown';
import { SessionProvider } from '../../features/auth/SessionContext';
import { BuilderPage } from '../../features/builder/BuilderPage';
import { RecordsPage } from '../../features/records/RecordsPage';
import { RecordStoreProvider } from '../../features/records/RecordStoreContext';
import { ReportsPage } from '../../features/reports/ReportsPage';
import { SettingsPage } from '../../features/settings/SettingsPage';

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

describe('v23 product UI', () => {
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

    expect(await screen.findByText('Aster Works')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /5 Print/u }));
    expect(screen.getByRole('heading', { name: 'Print' })).toBeVisible();
    expect(screen.getByText(/Remote assets and scripts are blocked/u)).toBeVisible();
  });

  it('shows capability-aware settings and help', () => {
    window.localStorage.setItem(
      'vaultbill.accounts',
      JSON.stringify([
        {
          userId: 'admin_1',
          username: 'admin',
          displayName: 'Operations Admin',
          role: 'Admin',
          isActive: true,
        },
      ]),
    );
    window.localStorage.setItem('vaultbill.operator', 'admin_1');
    const fullWebCapabilities = {
      ...webCapabilities,
      isDemoMode: false,
      isLanBrowser: true,
      canSmsIntegration: true,
      canGspIntegration: true,
    };
    renderPage(
      <>
        <SettingsPage />
        <ContextualHelp
          isOpen
          onClose={() => undefined}
          onOpen={() => undefined}
          page="records"
          role="SysAdmin"
        />
      </>,
      fullWebCapabilities,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Backup' }));
    expect(screen.getByText(/Backup creation is available in the desktop app/u)).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Branding' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Search actions and topics'), {
      target: { value: 'PDF' },
    });
    expect(screen.getByText('PDF output')).toBeVisible();
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
