/** @format */

import { useEffect } from 'react';

import { canUseLocalHostedApi, requestHostedWindowAction } from '../../runtime/HostedApi';
import type { ActivationFormApi } from './useLoginForms';

export const getLoginFooterCopy = (input: {
    readonly isDemoMode: boolean;
    readonly isDesktop: boolean;
    readonly isHostedWeb: boolean;
}): { readonly primary: string; readonly secondary: string } => {
    if (input.isDemoMode) {
        return {
            primary: 'Interactive demo workspace',
            secondary: 'Explore the flow before setting up a live workspace',
        };
    }

    if (input.isDesktop) {
        return {
            primary: 'Local-first desktop workspace',
            secondary: 'Ready for private, focused day-to-day work',
        };
    }

    if (input.isHostedWeb) {
        return {
            primary: 'Browser workspace connected to the desktop host',
            secondary: 'Open in the browser while the desktop host keeps the local session active',
        };
    }

    return {
        primary: 'Secure billing workspace',
        secondary: 'Designed for calm, focused work',
    };
};

/** Opens a confirmation flow when the setup shortcut is used on the sign-in page. */
export const useSetupShortcutConfirmation = (
    onOpenSetupWizard: (() => void) | undefined,
    onOpenConfirm: () => void,
): void => {
    useEffect(() => {
        if (!onOpenSetupWizard) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'F9') return;
            event.preventDefault();
            onOpenConfirm();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onOpenConfirm, onOpenSetupWizard]);
};

/** Requests the desktop close action from the most capable runtime available. */
export const requestLoginCloseWindow = (isDesktop: boolean): void => {
    if (!isDesktop) return;
    if (window.vaultBillDesktop?.closeWindow) {
        void window.vaultBillDesktop.closeWindow();
        return;
    }
    if (canUseLocalHostedApi()) void requestHostedWindowAction('close');
};

/** Requests the desktop minimize action from the most capable runtime available. */
export const requestLoginMinimizeWindow = (isDesktop: boolean): void => {
    if (!isDesktop) return;
    if (window.vaultBillDesktop?.minimizeWindow) {
        void window.vaultBillDesktop.minimizeWindow();
        return;
    }
    if (canUseLocalHostedApi()) void requestHostedWindowAction('minimize');
};

/** Submits the desktop license activation dialog and reports the outcome. */
export const activateLoginLicense = (
    activationForm: ActivationFormApi,
    setActivationMessage: (message: string) => void,
): void => {
    void window.vaultBillDesktop
        ?.activateLicense(activationForm.state.values.licenseKey)
        .then(() => {
            activationForm.reset();
            setActivationMessage('VaultBill is activated. You can now log in.');
        })
        .catch((reason: unknown) => {
            setActivationMessage(reason instanceof Error ? reason.message : 'Activation failed.');
        });
};
