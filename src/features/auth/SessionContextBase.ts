/** @format */

import { createContext } from 'react';

import type { SessionContextValue } from './SessionTypes';

export const SessionContext = createContext<SessionContextValue | undefined>(undefined);
