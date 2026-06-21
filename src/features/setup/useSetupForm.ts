/** @format */

import { useForm } from '@tanstack/react-form';

export type SetupFormValues = {
    readonly companyName: string;
    readonly address: string;
    readonly theme: string;
    readonly adminDisplayName: string;
    readonly adminUsername: string;
    readonly adminPassword: string;
};

type UseSetupFormOptions = {
    readonly defaultTheme: string;
    readonly onSubmit: (values: SetupFormValues) => Promise<void> | void;
};

/** Creates the first-run setup form state with TanStack Form. */
export const useSetupForm = ({ defaultTheme, onSubmit }: UseSetupFormOptions) =>
    useForm({
        defaultValues: {
            companyName: '',
            address: '',
            theme: defaultTheme,
            adminDisplayName: '',
            adminUsername: '',
            adminPassword: '',
        } satisfies SetupFormValues,
        onSubmit: async ({ value }) => {
            await onSubmit(value);
        },
    });

export type SetupFormApi = ReturnType<typeof useSetupForm>;
