/** @format */
import type { FC } from 'react';

import { BuilderPageFooter } from './BuilderPageFooter';
import { BuilderPageStepSections } from './BuilderPageStepSections';
import {
    helperFor,
    steps,
    type BuilderLayoutConfig,
    type BuilderPrintConfig,
} from './BuilderPageSupport';

import type { BuilderPageController } from './useBuilderPageController';
export type BuilderPageStepContentProps = {
    readonly controller: BuilderPageController;
    readonly layout: BuilderLayoutConfig;
    readonly printSettings: BuilderPrintConfig;
    readonly lineSection: BuilderPageController['lineSection'];
    readonly referencedFieldIds: ReadonlySet<string>;
};
export const BuilderPageStepContentOutlet: FC<BuilderPageStepContentProps> = ({
    controller,
    layout,
    printSettings,
    lineSection,
    referencedFieldIds,
}) => (
    <>
        <header className="builder-step-header">
            <div>
                <p className="eyebrow">{controller.activeStep}</p>
                <h2>{controller.activeStep}</h2>
            </div>
            <p>{helperFor(controller.activeStep)}</p>
        </header>
        <BuilderPageStepSections
            controller={controller}
            layout={layout}
            lineSection={lineSection}
            printSettings={printSettings}
            referencedFieldIds={referencedFieldIds}
        />
        <BuilderPageFooter
            importWarnings={controller.importWarnings}
            message={controller.message}
            onBack={() => {
                controller.setStepIndex((current) => Math.max(0, current - 1));
            }}
            onContinue={() => {
                controller.setStepIndex((current) => Math.min(steps.length - 1, current + 1));
            }}
            onPublish={controller.publish}
            stepCount={steps.length}
            stepIndex={controller.stepIndex}
            validation={controller.validation}
        />
    </>
);
