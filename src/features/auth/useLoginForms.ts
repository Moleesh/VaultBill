/** @format */

import { useForm } from '@tanstack/react-form';

type UseLoginFormOptions = {
    readonly defaultSelectedAccountId: string;
    readonly onSubmit: (values: LoginFormValues) => Promise<void> | void;
};

export type LoginFormValues = {
    readonly password: string;
    readonly selectedAccountId: string;
};

export type ActivationFormValues = {
    readonly licenseKey: string;
};

/** Creates the sign-in form state used on the login screen. */
export const useLoginForm = ({ defaultSelectedAccountId, onSubmit }: UseLoginFormOptions) =>
    useForm({
        defaultValues: {
            password: '',
            selectedAccountId: defaultSelectedAccountId,
        } satisfies LoginFormValues,
        onSubmit: async ({ value }) => {
            await onSubmit(value);
        },
    });

/** Creates the desktop activation form state used from the login screen. */
export const useActivationForm = () =>
    useForm({
        defaultValues: {
            licenseKey: '',
        } satisfies ActivationFormValues,
    });

export type LoginFormApi = ReturnType<typeof useLoginForm>;
export type ActivationFormApi = ReturnType<typeof useActivationForm>;
