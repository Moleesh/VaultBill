/** @format */

import { Check, ChevronRight, Download, Upload, X } from 'lucide-react';
import type { FC } from 'react';

import { ActionButton } from '../../components/ActionButton';
import { FileSelectButton } from '../../components/FileSelectButton';
import { HorizontalProgress } from '../../components/HorizontalProgress/HorizontalProgress';
import { IconButton } from '../../components/IconButton';
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
                    <IconButton
                        icon={<X aria-hidden="true" size={18} />}
                        onClick={onClose}
                        variant="secondary"
                    >
                        Close
                    </IconButton>
                ) : null}
                <FileSelectButton accept=".json,application/json" onChange={onImportJson}>
                    <Upload aria-hidden="true" size={18} /> Import JSON
                </FileSelectButton>
                <IconButton icon={<Download aria-hidden="true" size={18} />} onClick={onExportJson}>
                    Export JSON
                </IconButton>
            </div>
        </div>
        <HorizontalProgress
            activeIndex={activeStepIndex}
            className="page-tabs builder-steps"
            label="Builder steps"
        >
            {steps.map((step, index) => (
                <ActionButton
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
                >
                    <span aria-hidden="true" className="builder-step-icon">
                        {index < activeStepIndex ? <Check size={14} /> : <ChevronRight size={14} />}
                    </span>
                    {step}
                </ActionButton>
            ))}
        </HorizontalProgress>
    </>
);
