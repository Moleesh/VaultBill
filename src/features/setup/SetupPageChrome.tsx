/** @format */

import type { FC } from 'react';

import { DesktopWindowControls } from '../../components/DesktopWindowControls';
import { canUseLocalHostedApi, requestHostedWindowAction } from '../../runtime/HostedApi';

export const SetupPageChrome: FC = () => (
    <div className="login-page-chrome setup-page-chrome">
        <DesktopWindowControls
            isDesktop
            onCloseWindow={() => {
                if (window.vaultBillDesktop?.closeWindow) {
                    void window.vaultBillDesktop.closeWindow();
                    return;
                }
                if (canUseLocalHostedApi()) void requestHostedWindowAction('close');
            }}
            onMinimizeWindow={() => {
                if (window.vaultBillDesktop?.minimizeWindow) {
                    void window.vaultBillDesktop.minimizeWindow();
                    return;
                }
                if (canUseLocalHostedApi()) void requestHostedWindowAction('minimize');
            }}
            onRefreshWindow={() => {
                window.location.reload();
            }}
        />
    </div>
);
