/** @format */

import { QueryClient } from '@tanstack/react-query';

export const createVaultBillQueryClient = (): QueryClient =>
    new QueryClient({
        defaultOptions: {
            queries: {
                refetchOnWindowFocus: false,
                refetchOnReconnect: false,
                retry: false,
                staleTime: 15_000,
            },
            mutations: {
                retry: false,
            },
        },
    });
