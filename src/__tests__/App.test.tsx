import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import { App } from '../App';

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem('vaultbill.setup.complete', 'true');
    const portalRoot = document.createElement('div');
    portalRoot.id = 'portal-root';
    document.body.append(portalRoot);
  });

  it('starts at login and enters the configured workspace', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'VaultBill' })).toBeVisible();

    if (import.meta.env.VITE_DEMO_MODE === 'true') {
      expect(screen.getByText('Demo User')).toBeVisible();
      fireEvent.click(screen.getByRole('button', { name: 'Start demo' }));

      expect(screen.getByRole('heading', { name: 'Create GST Invoice' })).toBeVisible();
    } else {
      expect(screen.getByText(/Operator account/u)).toBeVisible();
      fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

      expect(
        screen.getByRole('heading', { name: /Welcome back, System Administrator/u }),
      ).toBeVisible();
    }

    expect(screen.queryByText(/Phase \d/u)).not.toBeInTheDocument();
  });
});
