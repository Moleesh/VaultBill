/** @format */

import type { Dispatch, FC, SetStateAction } from 'react';

import type { Role } from '../types/AppTypes';
import { AppShellDialogs } from './AppShellDialogs';

type AppShellManagedDialogsProps = {
    readonly accountPassword: string;
    readonly accountPasswordConfirmation: string;
    readonly accountPasswordMessage: string;
    readonly activationMessage: string;
    readonly isActivationOpen: boolean;
    readonly isHelpOpen: boolean;
    readonly isPasswordOpen: boolean;
    readonly isResetOpen: boolean;
    readonly licenseKey: string;
    readonly pageId: string;
    readonly role: Role;
    readonly setAccountPassword: Dispatch<SetStateAction<string>>;
    readonly setAccountPasswordConfirmation: Dispatch<SetStateAction<string>>;
    readonly setAccountPasswordMessage: Dispatch<SetStateAction<string>>;
    readonly setIsActivationOpen: Dispatch<SetStateAction<boolean>>;
    readonly setIsHelpOpen: Dispatch<SetStateAction<boolean>>;
    readonly setIsPasswordOpen: Dispatch<SetStateAction<boolean>>;
    readonly setIsResetOpen: Dispatch<SetStateAction<boolean>>;
    readonly setLicenseKey: Dispatch<SetStateAction<string>>;
    readonly onConfirmReset: () => void;
    readonly onSubmitActivation: () => void;
    readonly onSubmitPassword: () => void;
};

export const AppShellManagedDialogs: FC<AppShellManagedDialogsProps> = ({
    accountPassword,
    accountPasswordConfirmation,
    accountPasswordMessage,
    activationMessage,
    isActivationOpen,
    isHelpOpen,
    isPasswordOpen,
    isResetOpen,
    licenseKey,
    onConfirmReset,
    onSubmitActivation,
    onSubmitPassword,
    pageId,
    role,
    setAccountPassword,
    setAccountPasswordConfirmation,
    setAccountPasswordMessage,
    setIsActivationOpen,
    setIsHelpOpen,
    setIsPasswordOpen,
    setIsResetOpen,
    setLicenseKey,
}) => (
    <AppShellDialogs
        accountPassword={accountPassword}
        accountPasswordConfirmation={accountPasswordConfirmation}
        accountPasswordMessage={accountPasswordMessage}
        activationMessage={activationMessage}
        isActivationOpen={isActivationOpen}
        isHelpOpen={isHelpOpen}
        isPasswordOpen={isPasswordOpen}
        isResetOpen={isResetOpen}
        licenseKey={licenseKey}
        onAccountPasswordChange={(value) => {
            setAccountPassword(value);
            setAccountPasswordMessage('');
        }}
        onAccountPasswordConfirmationChange={(value) => {
            setAccountPasswordConfirmation(value);
            setAccountPasswordMessage('');
        }}
        onCloseActivation={() => {
            setIsActivationOpen(false);
        }}
        onCloseHelp={() => {
            setIsHelpOpen(false);
        }}
        onClosePassword={() => {
            setIsPasswordOpen(false);
        }}
        onCloseReset={() => {
            setIsResetOpen(false);
        }}
        onConfirmReset={onConfirmReset}
        onLicenseKeyChange={setLicenseKey}
        onOpenHelp={() => {
            setIsHelpOpen(true);
        }}
        onSubmitActivation={onSubmitActivation}
        onSubmitPassword={onSubmitPassword}
        pageId={pageId}
        role={role}
    />
);
