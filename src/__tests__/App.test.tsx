import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from '../App';

describe('App', () => {
  it('renders the Phase 1 VaultBill shell', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', {
        name: /Configure once\. Bill, print, and report anywhere\./u,
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Document format/u)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Finalize/u })).toBeVisible();
  });
});
