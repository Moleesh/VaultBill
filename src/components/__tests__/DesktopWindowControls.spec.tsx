/** @format */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DesktopWindowControls } from '../DesktopWindowControls';

describe('DesktopWindowControls', () => {
    it('shows the close button even when minimize is unavailable', () => {
        render(<DesktopWindowControls isDesktop onCloseWindow={vi.fn()} />);

        expect(screen.getByRole('button', { name: 'Close to tray' })).toBeVisible();
    });
});
