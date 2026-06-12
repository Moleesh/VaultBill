/** @format */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ActionBar } from '../ActionBar';

describe('ActionBar accessibility', () => {
    it('renders keyboard shortcut metadata for enabled record actions', () => {
        render(<ActionBar onAction={() => undefined} state="New" />);

        expect(screen.getByRole('button', { name: /^Draft Control\+S$/i })).toHaveAttribute(
            'aria-keyshortcuts',
            'Control+S',
        );
    });

    it('enables only actions valid for the current record state', () => {
        render(<ActionBar onAction={() => undefined} state="DraftSaved" />);

        expect(screen.getByRole('button', { name: /Finalize/i })).toBeEnabled();
        expect(screen.getByRole('button', { name: /^Draft Control\+S$/i })).toHaveAttribute(
            'aria-disabled',
            'true',
        );
        expect(screen.getByRole('button', { name: /^Draft Control\+S$/i })).not.toBeDisabled();
        expect(screen.getByRole('button', { name: /Draft Print/i })).toBeEnabled();
    });
});
