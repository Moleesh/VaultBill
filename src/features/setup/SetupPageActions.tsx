/** @format */

import type { FC } from 'react';

import { ActionButton } from '../../components/ActionButton';

type SetupPageActionsProps = {
    readonly isAdminUserInvalid: boolean;
    readonly isBusinessProfileInvalid: boolean;
    readonly isFinalStep: boolean;
    readonly onBack: () => void;
    readonly onContinue: () => void;
    readonly onFinish: () => void;
    readonly showBack: boolean;
};

/** Renders the first-run wizard navigation actions with consistent validation gating. */
export const SetupPageActions: FC<SetupPageActionsProps> = ({
    isAdminUserInvalid,
    isBusinessProfileInvalid,
    isFinalStep,
    onBack,
    onContinue,
    onFinish,
    showBack,
}) => (
    <footer className="setup-card-actions">
        {showBack ? (
            <ActionButton onClick={onBack}>Back</ActionButton>
        ) : (
            <span aria-hidden="true" />
        )}
        {isFinalStep ? (
            <ActionButton
                onClick={() => {
                    if (isAdminUserInvalid) {
                        onFinish();
                        return;
                    }
                    onFinish();
                }}
                variant="primary"
            >
                Start using VaultBill
            </ActionButton>
        ) : (
            <ActionButton
                onClick={() => {
                    if (isBusinessProfileInvalid) {
                        onContinue();
                        return;
                    }
                    onContinue();
                }}
                variant="primary"
            >
                Continue
            </ActionButton>
        )}
    </footer>
);
