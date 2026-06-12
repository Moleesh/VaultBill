/** @format */

import { Download, Upload } from 'lucide-react';
import type { FC } from 'react';

import { HorizontalProgress } from '../../components/HorizontalProgress/HorizontalProgress';
import { steps } from './BuilderPageSupport';

type BuilderPageHeaderProps = {
    readonly activeStepIndex: number;
    readonly onStepChange: (index: number) => void;
    readonly onImportJson: (event: React.ChangeEvent<HTMLInputElement>) => void;
    readonly onExportJson: () => void;
};

/** Renders the builder title, file actions, and step navigation. */
export const BuilderPageHeader: FC<BuilderPageHeaderProps> = ({
    activeStepIndex,
    onStepChange,
    onImportJson,
    onExportJson,
}) => (
    <>
        <div className="operational-header">
            <div>
                <p className="eyebrow">Builder</p>
                <h1>Document format builder</h1>
                <p>
                    Build fields and calculations first. Preview the finished document at the end.
                </p>
            </div>
            <div className="builder-header-actions">
                <label className="button-file">
                    <Upload aria-hidden="true" size={18} /> Import JSON
                    <input accept=".json,application/json" onChange={onImportJson} type="file" />
                </label>
                <button onClick={onExportJson} type="button">
                    <Download aria-hidden="true" size={18} /> Export JSON
                </button>
            </div>
        </div>
        <HorizontalProgress className="page-tabs builder-steps" label="Builder steps">
            {steps.map((step, index) => (
                <button
                    aria-pressed={activeStepIndex === index}
                    key={step}
                    onClick={() => {
                        onStepChange(index);
                    }}
                    type="button"
                >
                    <small>{index + 1}</small>
                    {step}
                </button>
            ))}
        </HorizontalProgress>
    </>
);
