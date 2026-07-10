/** @format */

import type { FC } from 'react';

import { PopupBase } from '../../components/PopupBase';
import { BuilderDocumentLibrary } from './BuilderDocumentLibrary';
import { BuilderPageDrawer } from './BuilderPageDrawer';
import { BuilderPageHeader } from './BuilderPageHeader';
import { BuilderPageStepContent } from './BuilderPageStepContent';
import { defaultBuilderLayout, defaultBuilderPrintSettings } from './BuilderPageSupport';

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
            <BuilderDocumentLibrary
                currentFormatId={controller.config.FormatId}
                currentFormatName={controller.config.FormatName}
                inventory={controller.inventory}
                onCreateNew={controller.createNewDocument}
                onDeleteDocument={controller.deleteDocument}
                onDuplicateDocument={controller.duplicateDocument}
                onEditDocument={controller.loadDocument}
                onOpenFormatPreview={(formatId) => {
                    void controller.openDocumentAtStep(formatId, 6);
                }}
                onOpenPrintPreview={(formatId) => {
                    void controller.openDocumentAtStep(formatId, 7);
                }}
                onReorderDocuments={controller.reorderDocuments}
                onSetDefaultDocument={controller.setDefaultDocument}
                onSetDocumentEnabled={controller.setDocumentEnabled}
                onTestPrintDocument={controller.testPrintDocument}
            />
            <PopupBase
                className="builder-modal"
                closeOnBackdrop={false}
                isOpen={controller.viewMode === 'builder'}
                label="Document builder"
                onClose={controller.closeBuilder}
            >
                <div className="builder-modal-shell">
                    <BuilderPageHeader
                        activeStepIndex={controller.stepIndex}
                        onClose={controller.closeBuilder}
                        onExportJson={() => {
                            void controller.publish();
                        }}
                        onImportJson={(event) => {
                            void controller.importJson(event);
                        }}
                        onStepChange={controller.setStepIndex}
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
            </PopupBase>
        </div>
    );
};
