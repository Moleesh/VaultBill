/** @format */

import { Check, ChevronRight, Download, Upload, X } from 'lucide-react';
import type { FC } from 'react';

import { HorizontalProgress } from '../../components/HorizontalProgress/HorizontalProgress';
import { steps } from './BuilderPageSupport';

type BuilderPageHeaderProps = {
    readonly activeStepIndex: number;
    readonly onStepChange: (index: number) => void;
    readonly onImportJson: (event: React.ChangeEvent<HTMLInputElement>) => void;
    readonly onExportJson: () => void;
    readonly onClose?: () => void;
};

/** Renders the builder title, file actions, and step navigation. */
export const BuilderPageHeader: FC<BuilderPageHeaderProps> = ({
    activeStepIndex,
    onStepChange,
    onImportJson,
    onExportJson,
    onClose,
}) => (
    <>
        <div className="operational-header">
            <div>
                <p className="eyebrow">Builder</p>
                <h1>Document builder</h1>
                <p>Build the document structure, preview it, and publish when it is ready.</p>
            </div>
            <div className="builder-header-actions">
                {onClose ? (
                    <button className="button-secondary" onClick={onClose} type="button">
                        <X aria-hidden="true" size={18} /> Close
                    </button>
                ) : null}
                <label className="button-file">
                    <Upload aria-hidden="true" size={18} /> Import JSON
                    <input accept=".json,application/json" onChange={onImportJson} type="file" />
                </label>
                <button onClick={onExportJson} type="button">
                    <Download aria-hidden="true" size={18} /> Export JSON
                </button>
            </div>
        </div>
        <HorizontalProgress
            activeIndex={activeStepIndex}
            className="page-tabs builder-steps"
            label="Builder steps"
        >
            {steps.map((step, index) => (
                <button
                    className={
                        activeStepIndex === index
                            ? 'is-active'
                            : index < activeStepIndex
                              ? 'is-complete'
                              : ''
                    }
                    aria-pressed={activeStepIndex === index}
                    aria-current={activeStepIndex === index ? 'step' : undefined}
                    key={step}
                    onClick={() => {
                        onStepChange(index);
                    }}
                    type="button"
                >
                    <span aria-hidden="true" className="builder-step-icon">
                        {index < activeStepIndex ? <Check size={14} /> : <ChevronRight size={14} />}
                    </span>
                    {step}
                </button>
            ))}
        </HorizontalProgress>
    </>
);
