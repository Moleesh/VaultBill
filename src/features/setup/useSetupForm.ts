/** @format */

import { useForm } from '@tanstack/react-form';

export type SetupFormValues = {
    readonly companyName: string;
    readonly address: string;
    readonly theme: string;
    readonly adminDisplayName: string;
    readonly adminUsername: string;
    readonly adminPassword: string;
    readonly clearAdminPassword: boolean;
};

type UseSetupFormOptions = {
    readonly defaultTheme: string;
    readonly onSubmit: (values: SetupFormValues) => Promise<void> | void;
};

/** Creates the first-run setup form state with TanStack Form. */
export const useSetupForm = ({ defaultTheme, onSubmit }: UseSetupFormOptions) => {
    const defaultValues: SetupFormValues = {
        companyName: '',
        address: '',
        theme: defaultTheme,
        adminDisplayName: '',
        adminUsername: '',
        adminPassword: '',
        clearAdminPassword: false,
    };

    return useForm({
        defaultValues,
        onSubmit: async ({ value }) => {
            await onSubmit(value);
        },
    });
};

export type SetupFormApi = ReturnType<typeof useSetupForm>;
