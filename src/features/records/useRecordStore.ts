/** @format */

import { useContext } from 'react';

import { RecordStoreContext } from './RecordStoreContextBase';
import type { RecordStoreContextValue } from './RecordStoreTypes';

export const useRecordStore = (): RecordStoreContextValue => {
    const context = useContext(RecordStoreContext);

    if (!context) {
        throw new Error('RecordStoreProvider is required.');
    }

    return context;
};
