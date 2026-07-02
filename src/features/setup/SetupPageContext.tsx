/** @format */

import type { Dispatch, FC, PropsWithChildren, SetStateAction } from 'react';
import { createContext, useContext } from 'react';

import type { SetupFormApi } from './useSetupForm';

type SetupPageContextValue = {
    readonly form: SetupFormApi;
    readonly stepIndex: number;
    readonly setStepIndex: Dispatch<SetStateAction<number>>;
    readonly clearMessage: () => void;
    readonly showBusinessProfileValidation: boolean;
    readonly setShowBusinessProfileValidation: Dispatch<SetStateAction<boolean>>;
    readonly showAdminUserValidation: boolean;
    readonly setShowAdminUserValidation: Dispatch<SetStateAction<boolean>>;
    readonly isBusinessProfileInvalid: boolean;
    readonly isAdminUserInvalid: boolean;
    readonly handleThemeChange: (value: string) => void;
    readonly onContinue: () => void;
    readonly onFinish: () => void;
};

const SetupPageContext = createContext<SetupPageContextValue | null>(null);

export const SetupPageProvider: FC<
    PropsWithChildren<{ readonly value: SetupPageContextValue }>
> = ({ children, value }) => (
    <SetupPageContext.Provider value={value}>{children}</SetupPageContext.Provider>
);

export const useSetupPageContext = (): SetupPageContextValue => {
    const context = useContext(SetupPageContext);
    if (!context) {
        throw new Error('useSetupPageContext must be used within a SetupPageProvider.');
    }
    return context;
};
