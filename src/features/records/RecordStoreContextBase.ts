/** @format */

import { createContext } from 'react';

import type { RecordStoreContextValue } from './RecordStoreTypes';

export const RecordStoreContext = createContext<RecordStoreContextValue | undefined>(undefined);
