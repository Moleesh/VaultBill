/** @format */

import type { FC } from 'react';

import { FormField } from '../../components/FormFields';

type BuilderFormatStepProps = {
    readonly formatName: string;
    readonly onFormatNameChange: (value: string) => void;
};

/** Renders the first builder step where the document name is defined. */
export const BuilderFormatStep: FC<BuilderFormatStepProps> = ({
    formatName,
    onFormatNameChange,
}) => (
    <div className="form-grid">
        <FormField.TextField
            label="Document name"
            onChange={(event) => {
                onFormatNameChange(event.currentTarget.value);
            }}
            value={formatName}
        />
        <div className="helper-card span-2">
            This is the name operators see when they create a record.
        </div>
    </div>
);
