/** @format */

import type { FC } from 'react';

import { DesktopWindowControls } from '../../components/DesktopWindowControls';

export const SetupPageChrome: FC = () => (
    <div className="login-page-chrome setup-page-chrome">
        <DesktopWindowControls
            isDesktop
            onCloseWindow={() => {
                void window.vaultBillDesktop?.closeWindow();
            }}
            onMinimizeWindow={() => {
                void window.vaultBillDesktop?.minimizeWindow();
            }}
        />
    </div>
);
