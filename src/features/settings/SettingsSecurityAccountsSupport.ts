/** @format */

import { useForm } from '@tanstack/react-form';

import type { Role } from '../../types/AppTypes';

/** Minimal account shape needed by the settings security account panels. */
export type OperatorAccount = {
    readonly userId: string;
    readonly username: string;
    readonly displayName: string;
    readonly role: Role;
    readonly isActive: boolean;
};

/** Form values used when creating a new operator account. */
export type CreateOperatorFormValues = {
    readonly displayName: string;
    readonly password: string;
    readonly role: Role;
    readonly username: string;
};

/** Form values used when setting or replacing an operator password. */
export type PasswordFormValues = {
    readonly password: string;
    readonly userId: string;
};

type CreateOperatorSubmit = (input: {
    readonly value: CreateOperatorFormValues;
}) => Promise<void> | void;
type PasswordSubmit = (input: { readonly value: PasswordFormValues }) => Promise<void> | void;

const createOperatorDefaultValues: CreateOperatorFormValues = {
    displayName: '',
    password: '',
    role: 'User',
    username: '',
};

const useCreateOperatorForm = (onSubmit: CreateOperatorSubmit) =>
    useForm({
        defaultValues: createOperatorDefaultValues,
        onSubmit,
    });

const usePasswordForm = (
    manageableAccounts: readonly OperatorAccount[],
    onSubmit: PasswordSubmit,
) => {
    const passwordDefaultValues: PasswordFormValues = {
        password: '',
        userId: manageableAccounts[0]?.userId ?? '',
    };

    return useForm({
        defaultValues: passwordDefaultValues,
        onSubmit,
    });
};

export type CreateOperatorFormApi = ReturnType<typeof useCreateOperatorForm>;
export type PasswordFormApi = ReturnType<typeof usePasswordForm>;

/** Creates the operator-creation form state for the security accounts screen. */
export const useCreateSecurityOperatorForm = (onSubmit: CreateOperatorSubmit) =>
    useCreateOperatorForm(onSubmit);

/** Creates the password-update form state for the security accounts screen. */
export const useCreateSecurityPasswordForm = (
    manageableAccounts: readonly OperatorAccount[],
    onSubmit: PasswordSubmit,
) => usePasswordForm(manageableAccounts, onSubmit);

/** Returns whether the operator-creation form currently satisfies local enablement rules. */
export const canSubmitOperatorCreation = ({
    manageableAccounts,
    operatorRole,
    values,
}: {
    readonly manageableAccounts: readonly OperatorAccount[];
    readonly operatorRole: Role;
    readonly values: CreateOperatorFormValues;
}): boolean =>
    values.username.trim().length > 0 &&
    values.displayName.trim().length > 0 &&
    !(
        values.role === 'User' &&
        operatorRole === 'SysAdmin' &&
        manageableAccounts.filter((account) => account.role === 'User' && account.isActive)
            .length >= 5
    );

/** Returns the role choices available while creating an operator account. */
export const securityOperatorRoleOptions = [
    { value: 'Admin', label: 'Admin' },
    { value: 'User', label: 'User' },
] as const;
