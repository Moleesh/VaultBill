/** @format */

import type { OperatorContext } from '../auth/AccountTypes';
import type { AppRecord, EditableRecord } from './RecordStoreSupport';

export type RecordStoreContextValue = {
    readonly records: readonly AppRecord[];
    readonly isLoading: boolean;
    readonly error: string;
    readonly saveDraft: (
        record: EditableRecord,
        operatorContext: OperatorContext,
    ) => Promise<AppRecord>;
    readonly finalizeRecord: (
        record: EditableRecord,
        operatorContext: OperatorContext,
    ) => Promise<AppRecord>;
    readonly cancelRecord: (
        recordId: string,
        reason: string,
        operatorContext: OperatorContext,
    ) => Promise<AppRecord>;
    readonly resetDemoData: () => void;
};
