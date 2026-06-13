/** @format */

import type { FC } from 'react';

import type { BuilderLayoutConfig } from './BuilderPageSupport';

type BuilderLayoutStepProps = {
    readonly layout: BuilderLayoutConfig;
    readonly onLayoutChange: (layout: BuilderLayoutConfig) => void;
};

/** Renders the single-flow layout controls for the builder wizard. */
export const BuilderLayoutStep: FC<BuilderLayoutStepProps> = ({ layout, onLayoutChange }) => (
    <div className="builder-layout-step">
        <div className="form-grid">
            <label>
                <span>Column count</span>
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
            <label>
                <span>Gap</span>
                <input
                    min="0"
                    type="number"
                    value={layout.Gap}
                    onChange={(event) => {
                        onLayoutChange({
                            ...layout,
                            Gap: Number(event.currentTarget.value) || 0,
                        });
                    }}
                />
            </label>
        </div>
        <article className="builder-layout-preview builder-layout-preview--Flow" data-layout-mode="Flow">
            <div>
                <strong>Layout preview</strong>
                <p>Use the column count and gap to shape a simple page flow for the form.</p>
            </div>
            <div
                className="builder-layout-preview__grid"
                style={{
                    gap: `${String(Math.max(0, layout.Gap))}px`,
                    gridTemplateColumns: `repeat(${String(Math.max(1, layout.Columns))}, minmax(0, 1fr))`,
                }}
            >
                {Array.from({ length: Math.max(4, layout.Columns * 2) }, (_, cellIndex) => (
                    <span key={`cell-${String(cellIndex)}`} className="layout-preview-flow">
                        <i />
                    </span>
                ))}
            </div>
        </article>
    </div>
);
