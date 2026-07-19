/** @format */

import type { CSSProperties, FC } from 'react';

import { splitFieldsAroundLineItems } from '../builder/BuilderFieldFlowSupport';
import type { BuilderLayoutConfig } from '../builder/BuilderPageSupport';
import { RecordsFieldControl } from './RecordsFieldControl';
import { RecordsLineItemsSection } from './RecordsLineItemsSection';
import type { ConfiguredFieldDefinition } from './RecordsPageSupport';
import { RecordsStandardFields } from './RecordsStandardFields';
import type { AppRecord, EditableRecord, RecordLineItem } from './RecordStoreContext';

type RecordsFormSectionProps = {
    readonly configuredDocumentFields: readonly ConfiguredFieldDefinition[];
    readonly configuredLineFields: readonly ConfiguredFieldDefinition[];
    readonly isReadOnly: boolean;
    readonly layout: BuilderLayoutConfig;
    readonly onAddLineItem: () => void;
    readonly onRecordChange: (nextRecord: EditableRecord) => void;
    readonly onUpdateLineItem: (rowId: string, changes: Partial<RecordLineItem>) => void;
    readonly record: EditableRecord;
    readonly recordTotals: {
        readonly subtotal: string;
        readonly taxTotal: string;
        readonly roundOff: string;
        readonly grandTotal: string;
    };
    readonly selectedStoredRecord: AppRecord | undefined;
};

export const RecordsFormSection: FC<RecordsFormSectionProps> = ({
    configuredDocumentFields,
    configuredLineFields,
    isReadOnly,
    layout,
    onAddLineItem,
    onRecordChange,
    onUpdateLineItem,
    record,
    recordTotals,
    selectedStoredRecord,
}) => {
    const columns = Math.max(1, Math.min(5, layout.Columns));
    const gap = Math.min(28, Math.max(12, layout.Gap));
    const { afterLineItems, beforeLineItems } =
        splitFieldsAroundLineItems(configuredDocumentFields);
    const gridStyle = {
        gap: `${String(gap)}px`,
        '--records-layout-columns': String(columns),
    } as CSSProperties;
    const renderConfiguredDocumentField = (field: ConfiguredFieldDefinition) => (
        <RecordsFieldControl
            disabled={isReadOnly}
            field={field}
            key={field.FieldId}
            onChange={(value) => {
                onRecordChange({
                    ...record,
                    fieldValues: { ...(record.fieldValues ?? {}), [field.FieldId]: value },
                });
            }}
            value={record.fieldValues?.[field.FieldId] ?? ''}
        />
    );

    return (
        <>
            {selectedStoredRecord?.documentNumber ? (
                <div className="record-status-row">
                    <span className="status-pill">{selectedStoredRecord.status}</span>
                    <strong>{selectedStoredRecord.documentNumber}</strong>
                </div>
            ) : null}
            <div className="form-grid records-layout-grid" style={gridStyle}>
                <RecordsStandardFields
                    isReadOnly={isReadOnly}
                    onRecordChange={onRecordChange}
                    record={record}
                />
                {beforeLineItems.map(renderConfiguredDocumentField)}
            </div>
            <RecordsLineItemsSection
                configuredLineFields={configuredLineFields}
                isReadOnly={isReadOnly}
                onAddLineItem={onAddLineItem}
                onUpdateLineItem={onUpdateLineItem}
                record={record}
                recordTotals={recordTotals}
            >
                {afterLineItems.length > 0 ? (
                    <div
                        className="form-grid records-layout-grid records-layout-grid--after-line-items"
                        style={gridStyle}
                    >
                        {afterLineItems.map(renderConfiguredDocumentField)}
                    </div>
                ) : null}
            </RecordsLineItemsSection>
        </>
    );
};
