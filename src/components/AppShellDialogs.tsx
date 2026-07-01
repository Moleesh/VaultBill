/** @format */

import { useForm } from '@tanstack/react-form';
import type { FC } from 'react';
import { useEffect } from 'react';

import { ActionButton } from './ActionButton';
import { AppConfirmDialog } from './AppConfirmDialog/AppConfirmDialog';
import { AppModal } from './AppModal/AppModal';
import { ContextualHelp } from './ContextualHelp';
import { DialogActions } from './DialogActions';
import { FormField } from './FormFields';
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
    readonly accountPasswordMessage: string;
    readonly onClosePassword: () => void;
    readonly onSubmitPassword: (password: string) => void;
    readonly isActivationOpen: boolean;
    readonly activationMessage: string;
    readonly onCloseActivation: () => void;
    readonly onSubmitActivation: (licenseKey: string) => void;
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
    accountPasswordMessage,
    onClosePassword,
    onSubmitPassword,
    isActivationOpen,
    activationMessage,
    onCloseActivation,
    onSubmitActivation,
}) => {
    const passwordForm = useForm({
        defaultValues: {
            accountPassword: '',
            accountPasswordConfirmation: '',
        },
    });
    const activationForm = useForm({
        defaultValues: {
            licenseKey: '',
        },
    });

    useEffect(() => {
        if (isPasswordOpen) {
            passwordForm.reset({
                accountPassword: '',
                accountPasswordConfirmation: '',
            });
        }
    }, [isPasswordOpen, passwordForm]);

    useEffect(() => {
        if (isActivationOpen) {
            activationForm.reset({
                licenseKey: '',
            });
        }
    }, [activationForm, isActivationOpen]);

    return (
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
                <passwordForm.Field name="accountPassword">
                    {(field) => (
                        <FormField.PasswordField
                            autoComplete="new-password"
                            label="New password"
                            onChange={(event) => {
                                field.handleChange(event.currentTarget.value);
                            }}
                            value={field.state.value}
                        />
                    )}
                </passwordForm.Field>
                <passwordForm.Field name="accountPasswordConfirmation">
                    {(field) => (
                        <FormField.PasswordField
                            autoComplete="new-password"
                            label="Confirm new password"
                            onChange={(event) => {
                                field.handleChange(event.currentTarget.value);
                            }}
                            value={field.state.value}
                        />
                    )}
                </passwordForm.Field>
                {accountPasswordMessage ? (
                    <p className="feedback-info" role="status">
                        {accountPasswordMessage}
                    </p>
                ) : null}
                <DialogActions>
                    <ActionButton onClick={onClosePassword}>Cancel</ActionButton>
                    <ActionButton
                        disabled={
                            passwordForm.state.values.accountPassword.length < 8 ||
                            passwordForm.state.values.accountPassword !==
                                passwordForm.state.values.accountPasswordConfirmation
                        }
                        onClick={() => {
                            onSubmitPassword(passwordForm.state.values.accountPassword);
                        }}
                        variant="primary"
                    >
                        Update password
                    </ActionButton>
                </DialogActions>
            </AppModal>
            <AppModal
                isOpen={isActivationOpen}
                onClose={onCloseActivation}
                title="Activate VaultBill"
            >
                <p>Enter the transferable key supplied with this packaged build.</p>
                <activationForm.Field name="licenseKey">
                    {(field) => (
                        <FormField.TextField
                            label="License key"
                            onChange={(event) => {
                                field.handleChange(event.currentTarget.value);
                            }}
                            value={field.state.value}
                        />
                    )}
                </activationForm.Field>
                {activationMessage ? (
                    <p className="feedback-info" role="status">
                        {activationMessage}
                    </p>
                ) : null}
                <DialogActions>
                    <ActionButton onClick={onCloseActivation}>Cancel</ActionButton>
                    <ActionButton
                        onClick={() => {
                            onSubmitActivation(activationForm.state.values.licenseKey);
                        }}
                        variant="primary"
                    >
                        Activate
                    </ActionButton>
                </DialogActions>
            </AppModal>
        </>
    );
};
