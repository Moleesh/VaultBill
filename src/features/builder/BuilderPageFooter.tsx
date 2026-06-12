/** @format */

import type { FC } from 'react';

type BuilderPageFooterProps = {
    readonly stepIndex: number;
    readonly stepCount: number;
    readonly validation: readonly string[];
    readonly importWarnings: readonly string[];
    readonly message: string;
    readonly onBack: () => void;
    readonly onContinue: () => void;
    readonly onPublish: () => void;
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
        <footer className="wizard-actions">
            <button disabled={stepIndex === 0} onClick={onBack} type="button">
                Back
            </button>
            {stepIndex < stepCount - 1 ? (
                <button className="button-primary" onClick={onContinue} type="button">
                    Continue
                </button>
            ) : (
                <button
                    className="button-primary"
                    disabled={validation.length > 0}
                    onClick={onPublish}
                    type="button"
                >
                    Publish format
                </button>
            )}
        </footer>
    </>
);
