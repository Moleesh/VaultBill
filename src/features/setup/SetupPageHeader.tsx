/** @format */

import { Check } from 'lucide-react';
import type { FC } from 'react';

import { AppBrandIcon } from '../../components/AppBrandIcon/AppBrandIcon';
import { HorizontalProgress } from '../../components/HorizontalProgress/HorizontalProgress';
import { setupSteps } from './SetupPageSupport';

type SetupPageHeaderProps = {
    readonly stepIndex: number;
    readonly onStepSelect: (index: number) => void;
};

/** Branded first-run setup header with wizard progress navigation. */
export const SetupPageHeader: FC<SetupPageHeaderProps> = ({ stepIndex, onStepSelect }) => (
    <>
        <header className="setup-card-header">
            <span className="setup-card-brand-mark">
                <AppBrandIcon size="medium" />
            </span>
            <div className="setup-card-title">
                <p className="eyebrow">First-run setup</p>
                <h1>Prepare VaultBill for your workspace</h1>
                <p>
                    Set the essentials once, then sign in to a workspace that already feels ready.
                </p>
            </div>
        </header>
        <HorizontalProgress
            activeIndex={stepIndex}
            className="setup-steps wizard-steps"
            label="Setup steps"
        >
            {setupSteps.map((step, index) => {
                const StepIcon = index < stepIndex ? Check : step.icon;

                return (
                    <button
                        aria-current={index === stepIndex ? 'step' : undefined}
                        className={index < stepIndex ? 'is-complete' : ''}
                        disabled={index > stepIndex}
                        key={step.label}
                        onClick={() => {
                            onStepSelect(index);
                        }}
                        type="button"
                    >
                        <span aria-hidden="true" className="wizard-step-icon">
                            <StepIcon size={18} />
                        </span>
                        <strong className="wizard-step-label">{step.label}</strong>
                    </button>
                );
            })}
        </HorizontalProgress>
    </>
);
