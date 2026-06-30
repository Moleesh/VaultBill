/** @format */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DesktopWindowControls } from '../DesktopWindowControls';

describe('DesktopWindowControls', () => {
    it('shows the close button even when minimize is unavailable', () => {
        render(<DesktopWindowControls isDesktop onCloseWindow={vi.fn()} />);

        expect(screen.getByRole('button', { name: 'Close to tray' })).toBeVisible();
    });

    it('shows and triggers the desktop-only refresh button', () => {
        const onRefreshWindow = vi.fn();
        render(<DesktopWindowControls isDesktop onRefreshWindow={onRefreshWindow} />);

        fireEvent.click(screen.getByRole('button', { name: 'Refresh window' }));

        expect(onRefreshWindow).toHaveBeenCalledTimes(1);
    });
});
