/** @format */

import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import type { FC, PropsWithChildren } from 'react';

import { createVaultBillQueryClient } from '../query/QueryClient';

export const TestQueryProvider: FC<PropsWithChildren> = ({ children }) => {
    const [queryClient] = useState(createVaultBillQueryClient);

    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
