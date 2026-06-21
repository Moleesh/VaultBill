/** @format */

import { Check } from 'lucide-react';
import type { FC } from 'react';

import { ActionButton } from '../../components/ActionButton';
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
                <h1>Prepare your workspace</h1>
                <p>Set a few essentials once, then sign in to a workspace that feels ready.</p>
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
                    <ActionButton
                        aria-current={index === stepIndex ? 'step' : undefined}
                        className={index < stepIndex ? 'is-complete' : ''}
                        disabled={index > stepIndex}
                        key={step.label}
                        onClick={() => {
                            onStepSelect(index);
                        }}
                    >
                        <span aria-hidden="true" className="wizard-step-icon">
                            <StepIcon size={18} />
                        </span>
                        <strong className="wizard-step-label">{step.label}</strong>
                    </ActionButton>
                );
            })}
        </HorizontalProgress>
    </>
);
