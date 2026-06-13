/** @format */

import type { FC } from 'react';

import type { BuilderLayoutConfig, BuilderLayoutMode } from './BuilderPageSupport';

type BuilderLayoutStepProps = {
    readonly layout: BuilderLayoutConfig;
    readonly onLayoutChange: (layout: BuilderLayoutConfig) => void;
};

/** Renders the document flow controls for the builder wizard. */
export const BuilderLayoutStep: FC<BuilderLayoutStepProps> = ({ layout, onLayoutChange }) => (
    <div className="builder-layout-step">
        <div className="form-grid">
            <label>
                <span>Layout mode</span>
                <select
                    value={layout.Mode}
                    onChange={(event) => {
                        onLayoutChange({
                            ...layout,
                            Mode: event.currentTarget.value as BuilderLayoutMode,
                        });
                    }}
                >
                    <option value="Flow">Flow</option>
                    <option value="Split">Split</option>
                    <option value="Compact">Compact</option>
                </select>
            </label>
            <label>
                <span>Field columns</span>
                <input
                    min="1"
                    type="number"
                    value={layout.Columns}
                    onChange={(event) => {
                        onLayoutChange({
                            ...layout,
                            Columns: Number(event.currentTarget.value) || 1,
                        });
                    }}
                />
            </label>
        </div>
        <article className={`builder-layout-preview builder-layout-preview--${layout.Mode}`}>
            <div>
                <strong>Layout preview</strong>
                <p>
                    {layout.Mode} keeps the printable content area readable while the field columns
                    control the density.
                </p>
            </div>
            <div
                className="builder-layout-preview__grid"
                style={{
                    gridTemplateColumns: `repeat(${String(layout.Columns)}, minmax(0, 1fr))`,
                }}
            >
                {Array.from({ length: layout.Columns * 2 }, (_, cellIndex) => (
                    <span key={`cell-${String(cellIndex)}`}>
                        <i />
                    </span>
                ))}
            </div>
        </article>
    </div>
);
