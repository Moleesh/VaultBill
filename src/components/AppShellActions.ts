/** @format */

import type { NavigateFunction } from 'react-router-dom';

import { canUseLocalHostedApi, requestHostedWindowAction } from '../runtime/HostedApi';

type AppShellActionDependencies = {
    readonly navigate: NavigateFunction;
    readonly logout: () => void;
    readonly resetDemoData: () => void;
    readonly resetPassword: (userId: string, password: string) => Promise<unknown>;
    readonly setAccountPasswordMessage: (value: string) => void;
    readonly setActivationMessage: (value: string) => void;
    readonly setIsActivationOpen: (value: boolean) => void;
    readonly setIsPasswordOpen: (value: boolean) => void;
    readonly setIsResetOpen: (value: boolean) => void;
    readonly setTrialStatus: (
        value: Awaited<ReturnType<NonNullable<typeof window.vaultBillDesktop>['getTrialStatus']>>,
    ) => void;
    readonly accountUserId: string;
};

export const createAppShellActions = ({
    navigate,
    logout,
    resetDemoData,
    resetPassword,
    setAccountPasswordMessage,
    setActivationMessage,
    setIsActivationOpen,
    setIsPasswordOpen,
    setIsResetOpen,
    setTrialStatus,
    accountUserId,
}: AppShellActionDependencies) => {
    const openPasswordDialog = () => {
        setAccountPasswordMessage('');
        setIsPasswordOpen(true);
    };
    const openResetDialog = () => {
        setIsResetOpen(true);
    };
    const openActivationDialog = () => {
        setIsActivationOpen(true);
    };
    const closeWindow = () => {
        if (window.vaultBillDesktop?.closeWindow) {
            void window.vaultBillDesktop.closeWindow();
            return;
        }
        if (canUseLocalHostedApi()) void requestHostedWindowAction('close');
    };
    const minimizeWindow = () => {
        if (window.vaultBillDesktop?.minimizeWindow) {
            void window.vaultBillDesktop.minimizeWindow();
            return;
        }
        if (canUseLocalHostedApi()) void requestHostedWindowAction('minimize');
    };
    const logOut = () => {
        logout();
        void navigate('/login');
    };
    const resetDemo = () => {
        resetDemoData();
        setIsResetOpen(false);
        void navigate('/app/dashboard');
    };
    const submitActivation = (licenseKey: string) => {
        const activation = window.vaultBillDesktop
            ? window.vaultBillDesktop.activateLicense(licenseKey)
            : Promise.reject(new Error('Hosted activation is unavailable.'));
        void activation
            .then((status) => {
                setTrialStatus(status);
                setActivationMessage('VaultBill is activated.');
            })
            .catch((reason: unknown) => {
                setActivationMessage(
                    reason instanceof Error ? reason.message : 'Activation failed.',
                );
            });
    };
    const submitPassword = (accountPassword: string) => {
        void resetPassword(accountUserId, accountPassword)
            .then(() => {
                setAccountPasswordMessage('Your password has been updated.');
            })
            .catch((reason: unknown) => {
                setAccountPasswordMessage(
                    reason instanceof Error ? reason.message : 'Password could not be updated.',
                );
            });
    };

    return {
        closeWindow,
        logOut,
        minimizeWindow,
        openActivationDialog,
        openPasswordDialog,
        openResetDialog,
        resetDemo,
        submitActivation,
        submitPassword,
    } as const;
};
