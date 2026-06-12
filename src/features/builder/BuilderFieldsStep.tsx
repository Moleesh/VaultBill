/** @format */

import type { FC } from 'react';

import { BuilderFieldEditor } from './BuilderFieldEditor';
import type { FieldConfig } from './BuilderPageSupport';

type BuilderFieldsStepProps = {
    readonly fields: readonly FieldConfig[];
    readonly referencedFieldIds: ReadonlySet<string>;
    readonly onAdd: () => void;
    readonly onChange: (fields: readonly FieldConfig[]) => void;
    readonly onEdit: (index: number) => void;
};

/** Renders the document-field editor step. */
export const BuilderFieldsStep: FC<BuilderFieldsStepProps> = ({
    fields,
    referencedFieldIds,
    onAdd,
    onChange,
    onEdit,
}) => (
    <BuilderFieldEditor
        fields={fields}
        onAdd={onAdd}
        onChange={onChange}
        onEdit={onEdit}
        referencedFieldIds={referencedFieldIds}
    />
);
