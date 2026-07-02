/** @format */

import type { FC } from 'react';

import type { Role } from '../../types/AppTypes';
import {
    useCreateSecurityOperatorForm,
    useCreateSecurityPasswordForm,
    type CreateOperatorFormValues,
    type OperatorAccount,
    type PasswordFormValues,
} from './SettingsSecurityAccountsSupport';
import { SettingsSecurityOperatorPanel } from './SettingsSecurityOperatorPanel';
import { SettingsSecurityPasswordPanel } from './SettingsSecurityPasswordPanel';

type SettingsSecurityAccountsProps = {
    readonly operatorRole: Role;
    readonly manageableAccounts: readonly OperatorAccount[];
    readonly onCreateOperator: (input: {
        readonly username: string;
        readonly displayName: string;
        readonly password: string;
        readonly role: Role;
    }) => Promise<void> | void;
    readonly onChangePassword: (input: {
        readonly password: string;
        readonly userId: string;
    }) => Promise<void> | void;
    readonly onArchiveAccount: (userId: string) => void;
    readonly onSetAccountActive: (account: OperatorAccount, isActive: boolean) => void;
};

/** Renders operator creation and password management controls. */
export const SettingsSecurityAccounts: FC<SettingsSecurityAccountsProps> = ({
    operatorRole,
    manageableAccounts,
    onCreateOperator,
    onChangePassword,
    onArchiveAccount,
    onSetAccountActive,
}) => {
    const createOperatorForm = useCreateSecurityOperatorForm(
        async ({ value }: { readonly value: CreateOperatorFormValues }) => {
            await onCreateOperator(value);
        },
    );
    const passwordForm = useCreateSecurityPasswordForm(
        manageableAccounts,
        ({ value }: { readonly value: PasswordFormValues }) => {
            void onChangePassword(value);
        },
    );

    return (
        <>
            <SettingsSecurityOperatorPanel
                createOperatorForm={createOperatorForm}
                manageableAccounts={manageableAccounts}
                onArchiveAccount={onArchiveAccount}
                onSetAccountActive={onSetAccountActive}
                operatorRole={operatorRole}
            />
            <SettingsSecurityPasswordPanel
                manageableAccounts={manageableAccounts}
                passwordForm={passwordForm}
            />
        </>
    );
};
