/** @format */

import type { CSSProperties, FC } from 'react';

import type { BuilderLayoutConfig } from './BuilderPageSupport';

type BuilderLayoutStepProps = {
    readonly layout: BuilderLayoutConfig;
    readonly onLayoutChange: (layout: BuilderLayoutConfig) => void;
};

/** Renders the single-flow layout controls for the builder wizard. */
export const BuilderLayoutStep: FC<BuilderLayoutStepProps> = ({ layout, onLayoutChange }) => {
    const columns = Math.max(1, Math.min(5, layout.Columns));
    const gap = Math.max(0, layout.Gap);
    const cellBasis = `calc((100% - ${String((columns - 1) * gap)}px) / ${String(columns)})`;

    return (
        <div className="builder-layout-step">
            <div className="form-grid">
                <label>
                    <span>Columns</span>
                    <input
                        min="1"
                        max="5"
                        type="number"
                        value={columns}
                        onChange={(event) => {
                            onLayoutChange({
                                ...layout,
                                Columns: Math.min(
                                    5,
                                    Math.max(1, Number(event.currentTarget.value) || 1),
                                ),
                            });
                        }}
                    />
                </label>
                <label>
                    <span>Gap</span>
                    <input
                        min="0"
                        type="number"
                        value={gap}
                        onChange={(event) => {
                            onLayoutChange({
                                ...layout,
                                Gap: Number(event.currentTarget.value) || 0,
                            });
                        }}
                    />
                </label>
            </div>
            <article className="builder-layout-preview" data-layout-mode="Flex">
                <div>
                    <strong>Layout preview</strong>
                    <p>Use columns and gap to shape a simple page flow for the form.</p>
                </div>
                <div
                    className="builder-layout-preview-grid builder-layout-preview-grid--flex"
                    style={
                        {
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'stretch',
                            alignContent: 'flex-start',
                            '--builder-layout-columns': String(columns),
                            '--builder-layout-gap': `${String(gap)}px`,
                            gap: `${String(gap)}px`,
                        } as CSSProperties
                    }
                >
                    {Array.from({ length: Math.max(2, columns * 2) }, (_, cellIndex) => (
                        <span
                            key={`cell-${String(cellIndex)}`}
                            className="layout-preview-flow"
                            style={{
                                flex: `1 1 ${cellBasis}`,
                                minWidth: columns > 1 ? '12rem' : '100%',
                                minHeight: '7rem',
                            }}
                        >
                            <i />
                            <small>{`Field ${String(cellIndex + 1)}`}</small>
                        </span>
                    ))}
                </div>
            </article>
        </div>
    );
};
