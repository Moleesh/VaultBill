/** @format */

import type { NavigateFunction } from 'react-router-dom';

type AppShellActionDependencies = {
    readonly navigate: NavigateFunction;
    readonly logout: () => void;
    readonly resetDemoData: () => void;
    readonly resetPassword: (userId: string, password: string) => Promise<unknown>;
    readonly setAccountPassword: (value: string) => void;
    readonly setAccountPasswordConfirmation: (value: string) => void;
    readonly setAccountPasswordMessage: (value: string) => void;
    readonly setActivationMessage: (value: string) => void;
    readonly setIsActivationOpen: (value: boolean) => void;
    readonly setIsPasswordOpen: (value: boolean) => void;
    readonly setIsResetOpen: (value: boolean) => void;
    readonly setLicenseKey: (value: string) => void;
    readonly setTrialStatus: (
        value: Awaited<ReturnType<NonNullable<typeof window.vaultBillDesktop>['getTrialStatus']>>,
    ) => void;
    readonly accountUserId: string;
    readonly accountPassword: string;
    readonly accountPasswordConfirmation: string;
    readonly licenseKey: string;
};

export const createAppShellActions = ({
    navigate,
    logout,
    resetDemoData,
    resetPassword,
    setAccountPassword,
    setAccountPasswordConfirmation,
    setAccountPasswordMessage,
    setActivationMessage,
    setIsActivationOpen,
    setIsPasswordOpen,
    setIsResetOpen,
    setLicenseKey,
    setTrialStatus,
    accountUserId,
    accountPassword,
    licenseKey,
}: AppShellActionDependencies) => {
    const openPasswordDialog = () => {
        setAccountPassword('');
        setAccountPasswordConfirmation('');
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
        void window.vaultBillDesktop?.closeWindow();
    };
    const minimizeWindow = () => {
        void window.vaultBillDesktop?.minimizeWindow();
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
    const submitActivation = () => {
        const activation = window.vaultBillDesktop
            ? window.vaultBillDesktop.activateLicense(licenseKey)
            : Promise.reject(new Error('Hosted activation is unavailable.'));
        void activation
            .then((status) => {
                setTrialStatus(status);
                setActivationMessage('VaultBill is activated.');
                setLicenseKey('');
            })
            .catch((reason: unknown) => {
                setActivationMessage(
                    reason instanceof Error ? reason.message : 'Activation failed.',
                );
            });
    };
    const submitPassword = () => {
        void resetPassword(accountUserId, accountPassword)
            .then(() => {
                setAccountPassword('');
                setAccountPasswordConfirmation('');
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
