import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ActionBar } from './ActionBar';

describe('ActionBar accessibility', () => {
  it('renders keyboard shortcut metadata for enabled record actions', () => {
    render(<ActionBar role="SysAdmin" />);

    expect(screen.getByRole('button', { name: /Save draft/i })).toHaveAttribute(
      'aria-keyshortcuts',
      'Control+S',
    );
    expect(screen.getByText('Control+Enter')).toBeInTheDocument();
  });

  it('keeps inaccessible actions disabled for roles without capabilities', () => {
    render(<ActionBar role="User" />);

    expect(screen.getByRole('button', { name: /Finalize/i })).toBeEnabled();
  });
});
