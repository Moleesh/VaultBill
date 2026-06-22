/** @format */

import type { FC } from 'react';

import { ActionButton } from '../../components/ActionButton';
import { useSetupPageContext } from './SetupPageContext';

type SetupPageActionsProps = {
    readonly isFinalStep: boolean;
    readonly showBack: boolean;
};

/** Renders the first-run wizard navigation actions with consistent validation gating. */
export const SetupPageActions: FC<SetupPageActionsProps> = ({ isFinalStep, showBack }) => {
    const { onContinue, onFinish, setStepIndex } = useSetupPageContext();

    return (
        <footer className="setup-card-actions">
            {showBack ? (
                <ActionButton
                    onClick={() => {
                        setStepIndex((current) => Math.max(0, current - 1));
                    }}
                >
                    Back
                </ActionButton>
            ) : (
                <span aria-hidden="true" />
            )}
            {isFinalStep ? (
                <ActionButton onClick={onFinish} variant="primary">
                    Start using VaultBill
                </ActionButton>
            ) : (
                <ActionButton onClick={onContinue} variant="primary">
                    Continue
                </ActionButton>
            )}
        </footer>
    );
};
