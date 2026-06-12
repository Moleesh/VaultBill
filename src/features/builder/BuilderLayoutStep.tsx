/** @format */

import type { FC } from 'react';

import type { BuilderLayoutConfig } from './BuilderPageSupport';

type BuilderLayoutStepProps = {
    readonly layout: BuilderLayoutConfig;
    readonly onLayoutChange: (layout: BuilderLayoutConfig) => void;
};

/** Renders the document grid controls for the builder wizard. */
export const BuilderLayoutStep: FC<BuilderLayoutStepProps> = ({ layout, onLayoutChange }) => (
    <div className="form-grid">
        <label>
            <span>Rows</span>
            <input
                min="1"
                type="number"
                value={layout.Rows}
                onChange={(event) => {
                    onLayoutChange({ ...layout, Rows: Number(event.currentTarget.value) || 1 });
                }}
            />
        </label>
        <label>
            <span>Columns</span>
            <input
                min="1"
                type="number"
                value={layout.Columns}
                onChange={(event) => {
                    onLayoutChange({ ...layout, Columns: Number(event.currentTarget.value) || 1 });
                }}
            />
        </label>
    </div>
);
