/** @format */

import type { FC } from 'react';

import { BuilderDocumentLibrary } from './BuilderDocumentLibrary';
import { BuilderPageDrawer } from './BuilderPageDrawer';
import { BuilderPageHeader } from './BuilderPageHeader';
import { BuilderPageStepContent } from './BuilderPageStepContent';
import {
    defaultBuilderLayout,
    defaultBuilderPrintSettings,
} from './BuilderPageSupport';
import type { BuilderPageController } from './useBuilderPageController';

/** Coordinates the builder header, active step, and field drawer. */
export const BuilderPageWorkspace: FC<{ readonly controller: BuilderPageController }> = ({
    controller,
}) => {
    const { lineSection, referencedFieldIds } = controller;
    const layout = controller.config.Layout ?? defaultBuilderLayout;
    const printSettings = controller.config.Print ?? defaultBuilderPrintSettings;

    return (
        <div className="page-stack builder-page">
            <BuilderPageHeader
                activeStepIndex={controller.stepIndex}
                onExportJson={() => {
                    void controller.publish();
                }}
                onImportJson={(event) => {
                    void controller.importJson(event);
                }}
                onStepChange={controller.setStepIndex}
            />
            <BuilderDocumentLibrary
                currentFormatId={controller.config.FormatId}
                currentFormatName={controller.config.FormatName}
                inventory={controller.inventory}
                onCreateNew={controller.createNewDocument}
                onDuplicateCurrent={controller.duplicateCurrentDocument}
                onLoadDocument={controller.loadDocument}
            />
            <BuilderPageStepContent
                controller={controller}
                layout={layout}
                lineSection={lineSection}
                printSettings={printSettings}
                referencedFieldIds={referencedFieldIds}
            />
            <BuilderPageDrawer controller={controller} lineSection={lineSection} />
        </div>
    );
};
