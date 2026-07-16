/** @format */

import type { FC } from 'react';

import { ActionButton } from '../../components/ActionButton';

type BuilderPageFooterProps = {
    readonly stepIndex: number;
    readonly stepCount: number;
    readonly validation: readonly string[];
    readonly importWarnings: readonly string[];
    readonly message: string;
    readonly onBack: () => void;
    readonly onContinue: () => void;
    readonly onPublish: () => Promise<void> | void;
};

/** Renders the builder status messages and step actions. */
export const BuilderPageFooter: FC<BuilderPageFooterProps> = ({
    stepIndex,
    stepCount,
    validation,
    importWarnings,
    message,
    onBack,
    onContinue,
    onPublish,
}) => (
    <>
        {importWarnings.map((warning) => (
            <p className="feedback-info" key={warning}>
                {warning}
            </p>
        ))}
        {message ? (
            <p className="feedback-info" role="status">
                {message}
            </p>
        ) : null}
        <footer className="wizard-actions builder-wizard-actions">
            <ActionButton disabled={stepIndex === 0} onClick={onBack}>
                Back
            </ActionButton>
            {stepIndex < stepCount - 1 ? (
                <ActionButton onClick={onContinue} variant="primary">
                    Continue
                </ActionButton>
            ) : (
                <ActionButton
                    disabled={validation.length > 0}
                    onClick={() => {
                        void onPublish();
                    }}
                    variant="primary"
                >
                    Publish format
                </ActionButton>
            )}
        </footer>
    </>
);
