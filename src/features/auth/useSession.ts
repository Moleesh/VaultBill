/** @format */

import { useContext } from 'react';

import { SessionContext } from './SessionContextBase';
import type { SessionContextValue } from './SessionTypes';

export const useSession = (): SessionContextValue => {
    const session = useContext(SessionContext);

    if (!session) {
        throw new Error('SessionProvider is required.');
    }

    return session;
};
