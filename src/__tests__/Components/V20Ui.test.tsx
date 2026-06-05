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
import { ReportsPage } from '../../features/reports/ReportsPage';
import { SettingsPage } from '../../features/settings/SettingsPage';

const webCapabilities: CapabilityRegistry = {
  isDesktop: false,
  isLanBrowser: false,
  isWebOnly: true,
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

const renderPage = (children: ReactNode) =>
  render(
    <MemoryRouter>
      <CapabilityProvider value={webCapabilities}>
        <SessionProvider>{children}</SessionProvider>
      </CapabilityProvider>
    </MemoryRouter>,
  );

describe('v20 product UI', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="portal-root"></div>';
    window.localStorage.setItem('vaultbill.operator', 'sysadmin_1');
  });

  it('protects unsaved record values and confirms finalization', () => {
    renderPage(<RecordsPage />);

    fireEvent.change(screen.getByPlaceholderText('Business or customer name'), {
      target: { value: 'Aster Works' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Document format/u }));
    fireEvent.click(screen.getByRole('option', { name: /Bill/u }));

    expect(screen.getByRole('dialog', { name: 'Change document format?' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Clear form' }));
    expect(screen.getByPlaceholderText('Business or customer name')).toHaveValue('');

    fireEvent.click(screen.getByTitle(/Finalize the current draft/u));
    expect(screen.getByRole('dialog', { name: 'Finalize this document?' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /^Finalize$/u }));
    expect(screen.getByText('Document finalized successfully.')).toBeVisible();
  });

  it('switches report and builder tabs', () => {
    renderPage(
      <>
        <ReportsPage />
        <BuilderPage />
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Print' }));
    expect(screen.getByText('No finalized records match this period')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /Print Templates/u }));
    expect(screen.getByRole('heading', { name: 'Configure print templates' })).toBeVisible();
  });

  it('shows capability-aware settings and help', () => {
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
    );

    fireEvent.click(screen.getByRole('button', { name: 'Backup' }));
    expect(screen.getByText(/desktop-only/u)).toBeVisible();
    expect(screen.getByText(/Exact printer selection/u)).toBeVisible();
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
