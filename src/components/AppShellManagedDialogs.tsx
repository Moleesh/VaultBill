/** @format */

import type { Dispatch, FC, SetStateAction } from 'react';

import type { Role } from '../types/AppTypes';
import { AppShellDialogs } from './AppShellDialogs';

type AppShellManagedDialogsProps = {
    readonly accountPasswordMessage: string;
    readonly activationMessage: string;
    readonly isActivationOpen: boolean;
    readonly isHelpOpen: boolean;
    readonly isPasswordOpen: boolean;
    readonly isResetOpen: boolean;
    readonly pageId: string;
    readonly role: Role;
    readonly setAccountPasswordMessage: Dispatch<SetStateAction<string>>;
    readonly setIsActivationOpen: Dispatch<SetStateAction<boolean>>;
    readonly setIsHelpOpen: Dispatch<SetStateAction<boolean>>;
    readonly setIsPasswordOpen: Dispatch<SetStateAction<boolean>>;
    readonly setIsResetOpen: Dispatch<SetStateAction<boolean>>;
    readonly onConfirmReset: () => void;
    readonly onSubmitActivation: (licenseKey: string) => void;
    readonly onSubmitPassword: (password: string) => void;
};

export const AppShellManagedDialogs: FC<AppShellManagedDialogsProps> = ({
    accountPasswordMessage,
    activationMessage,
    isActivationOpen,
    isHelpOpen,
    isPasswordOpen,
    isResetOpen,
    onConfirmReset,
    onSubmitActivation,
    onSubmitPassword,
    pageId,
    role,
    setAccountPasswordMessage,
    setIsActivationOpen,
    setIsHelpOpen,
    setIsPasswordOpen,
    setIsResetOpen,
}) => (
    <AppShellDialogs
        accountPasswordMessage={accountPasswordMessage}
        activationMessage={activationMessage}
        isActivationOpen={isActivationOpen}
        isHelpOpen={isHelpOpen}
        isPasswordOpen={isPasswordOpen}
        isResetOpen={isResetOpen}
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
        onOpenHelp={() => {
            setIsHelpOpen(true);
        }}
        onSubmitActivation={onSubmitActivation}
        onSubmitPassword={(password) => {
            setAccountPasswordMessage('');
            onSubmitPassword(password);
        }}
        pageId={pageId}
        role={role}
    />
);
