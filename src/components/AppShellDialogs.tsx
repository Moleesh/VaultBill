/** @format */

import type { FC } from 'react';

import { AppConfirmDialog } from './AppConfirmDialog/AppConfirmDialog';
import { AppModal } from './AppModal/AppModal';
import { ContextualHelp } from './ContextualHelp';
import type { Role } from '../types/AppTypes';

type AppShellDialogsProps = {
    readonly isHelpOpen: boolean;
    readonly pageId: string;
    readonly role: Role;
    readonly onCloseHelp: () => void;
    readonly onOpenHelp: () => void;
    readonly isResetOpen: boolean;
    readonly onCloseReset: () => void;
    readonly onConfirmReset: () => void;
    readonly isPasswordOpen: boolean;
    readonly accountPassword: string;
    readonly accountPasswordConfirmation: string;
    readonly accountPasswordMessage: string;
    readonly onAccountPasswordChange: (value: string) => void;
    readonly onAccountPasswordConfirmationChange: (value: string) => void;
    readonly onClosePassword: () => void;
    readonly onSubmitPassword: () => void;
    readonly isActivationOpen: boolean;
    readonly activationMessage: string;
    readonly licenseKey: string;
    readonly onLicenseKeyChange: (value: string) => void;
    readonly onCloseActivation: () => void;
    readonly onSubmitActivation: () => void;
};

export const AppShellDialogs: FC<AppShellDialogsProps> = ({
    isHelpOpen,
    pageId,
    role,
    onCloseHelp,
    onOpenHelp,
    isResetOpen,
    onCloseReset,
    onConfirmReset,
    isPasswordOpen,
    accountPassword,
    accountPasswordConfirmation,
    accountPasswordMessage,
    onAccountPasswordChange,
    onAccountPasswordConfirmationChange,
    onClosePassword,
    onSubmitPassword,
    isActivationOpen,
    activationMessage,
    licenseKey,
    onLicenseKeyChange,
    onCloseActivation,
    onSubmitActivation,
}) => (
    <>
        <ContextualHelp
            isOpen={isHelpOpen}
            onClose={onCloseHelp}
            onOpen={onOpenHelp}
            page={pageId}
            role={role}
        />
        <AppConfirmDialog
            confirmLabel="Reset demo"
            description="This removes records created in this browser and restores the sample workspace."
            isOpen={isResetOpen}
            onCancel={onCloseReset}
            onConfirm={onConfirmReset}
            title="Reset demo data?"
        />
        <AppModal isOpen={isPasswordOpen} onClose={onClosePassword} title="Change my password">
            <p>Set the password used by this operator on desktop and hosted-web login.</p>
            <label>
                <span>New password</span>
                <input
                    autoComplete="new-password"
                    onChange={(event) => {
                        onAccountPasswordChange(event.currentTarget.value);
                    }}
                    type="password"
                    value={accountPassword}
                />
            </label>
            <label>
                <span>Confirm new password</span>
                <input
                    autoComplete="new-password"
                    onChange={(event) => {
                        onAccountPasswordConfirmationChange(event.currentTarget.value);
                    }}
                    type="password"
                    value={accountPasswordConfirmation}
                />
            </label>
            {accountPasswordMessage ? (
                <p className="feedback-info" role="status">
                    {accountPasswordMessage}
                </p>
            ) : null}
            <div className="popup-actions">
                <button onClick={onClosePassword} type="button">
                    Cancel
                </button>
                <button
                    className="button-primary"
                    disabled={
                        accountPassword.length < 8 ||
                        accountPassword !== accountPasswordConfirmation
                    }
                    onClick={onSubmitPassword}
                    type="button"
                >
                    Update password
                </button>
            </div>
        </AppModal>
        <AppModal isOpen={isActivationOpen} onClose={onCloseActivation} title="Activate VaultBill">
            <p>Enter the transferable key supplied with this packaged build.</p>
            <label>
                <span>License key</span>
                <input
                    value={licenseKey}
                    onChange={(event) => {
                        onLicenseKeyChange(event.currentTarget.value);
                    }}
                />
            </label>
            {activationMessage ? (
                <p className="feedback-info" role="status">
                    {activationMessage}
                </p>
            ) : null}
            <div className="popup-actions">
                <button onClick={onCloseActivation} type="button">
                    Cancel
                </button>
                <button className="button-primary" onClick={onSubmitActivation} type="button">
                    Activate
                </button>
            </div>
        </AppModal>
    </>
);
