/** @format */

import type { FC } from 'react';

import { DesktopWindowControls } from './DesktopWindowControls';

type AppShellWindowChromeProps = {
    readonly onCloseWindow: () => void;
    readonly onMinimizeWindow: () => void;
};

export const AppShellWindowChrome: FC<AppShellWindowChromeProps> = ({
    onCloseWindow,
    onMinimizeWindow,
}) => (
    <div className="app-shell-window-chrome" aria-label="Window controls">
        <DesktopWindowControls
            className="app-shell-window-controls"
            isDesktop
            onCloseWindow={onCloseWindow}
            onMinimizeWindow={onMinimizeWindow}
        />
    </div>
);
