/** @format */

import type { FC, PropsWithChildren } from 'react';
import { useState } from 'react';

import { QueryClientProvider } from '@tanstack/react-query';

import { createVaultBillQueryClient } from './QueryClient';

export const VaultBillQueryProvider: FC<PropsWithChildren> = ({ children }) => {
    const [queryClient] = useState(createVaultBillQueryClient);

    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
