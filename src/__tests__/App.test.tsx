import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import { App } from '../App';

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear();
    const portalRoot = document.createElement('div');
    portalRoot.id = 'portal-root';
    document.body.append(portalRoot);
  });

  it('starts at operator login and enters the business dashboard', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'VaultBill' })).toBeVisible();
    expect(screen.getByText(/Operator account/u)).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(
      screen.getByRole('heading', { name: /Welcome back, System Administrator/u }),
    ).toBeVisible();
    expect(screen.queryByText(/Phase \d/u)).not.toBeInTheDocument();
  });
});
