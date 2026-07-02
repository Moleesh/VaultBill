/** @format */

import type { FC, PropsWithChildren } from 'react';
import { createContext, useContext } from 'react';

import type { CapabilityRegistry } from './Capability.types';
import { buildCapabilities } from './CapabilityRegistry';

const CapabilityContext = createContext<CapabilityRegistry | undefined>(undefined);

type CapabilityProviderProps = PropsWithChildren<{
    readonly value?: CapabilityRegistry;
}>;

export const CapabilityProvider: FC<CapabilityProviderProps> = ({
    children,
    value = buildCapabilities(),
}) => <CapabilityContext.Provider value={value}>{children}</CapabilityContext.Provider>;

export const useCapabilities = (): CapabilityRegistry => {
    const capabilities = useContext(CapabilityContext);

    if (!capabilities) {
        throw new Error('CapabilityProvider is required.');
    }

    return capabilities;
};
