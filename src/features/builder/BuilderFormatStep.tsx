/** @format */

import type { FC } from 'react';

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
        <label>
            <span>Document name</span>
            <input
                value={formatName}
                onChange={(event) => {
                    onFormatNameChange(event.currentTarget.value);
                }}
            />
        </label>
        <div className="helper-card span-2">
            This is the name operators see when they create a record.
        </div>
    </div>
);
