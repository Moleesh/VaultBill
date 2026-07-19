/** @format */

import type { FC } from 'react';

import { AppModal } from '../../components/AppModal/AppModal';
import { BuilderDocumentLibrary } from './BuilderDocumentLibrary';
import { BuilderFieldPreviewStep } from './BuilderFieldPreviewStep';
import { BuilderPageDrawer } from './BuilderPageDrawer';
import { BuilderPageHeader } from './BuilderPageHeader';
import { BuilderPageStepContent } from './BuilderPageStepContent';
import { defaultBuilderLayout, normalizePrintSettings } from './BuilderPageSupport';
import { BuilderPrintPreviewStep } from './BuilderPrintPreviewStep';

import type { BuilderPageController } from './useBuilderPageController';

/** Coordinates the builder header, active step, and field drawer. */
export const BuilderPageWorkspace: FC<{ readonly controller: BuilderPageController }> = ({
    controller,
}) => {
    const { lineSection, printPreviewPackage, referencedFieldIds } = controller;
    const layout = controller.config.Layout ?? defaultBuilderLayout;
    const printSettings = normalizePrintSettings(controller.config.Print);

    return (
        <div className="page-stack builder-page">
            {controller.viewMode === 'library' ? (
                <BuilderDocumentLibrary
                    currentFormatId={controller.config.FormatId}
                    currentFormatName={controller.config.FormatName}
                    inventory={controller.inventory}
                    onCreateNew={() => {
                        void controller.createNewDocument();
                    }}
                    onDeleteDocument={controller.deleteDocument}
                    onDuplicateDocument={controller.duplicateDocument}
                    onEditDocument={controller.loadDocument}
                    onOpenFormatPreview={(formatId) => {
                        void controller.openFieldPreview(formatId);
                    }}
                    onOpenPrintPreview={(formatId) => {
                        void controller.openPrintPreview(formatId);
                    }}
                    onReorderDocuments={controller.reorderDocuments}
                    onSetDefaultDocument={controller.setDefaultDocument}
                    onSetDocumentEnabled={controller.setDocumentEnabled}
                    onTestPrintDocument={controller.testPrintDocument}
                />
            ) : (
                <>
                    <BuilderPageHeader
                        activeStepIndex={controller.stepIndex}
                        onClose={controller.closeBuilder}
                        onExportJson={() => {
                            controller.exportJson();
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
                </>
            )}
            <AppModal
                className="builder-field-preview-modal-frame"
                isOpen={Boolean(controller.fieldPreviewPackage)}
                onClose={controller.closeFieldPreview}
                showScrollProgress
                title="Field preview"
            >
                {controller.fieldPreviewPackage ? (
                    <div className="builder-field-preview-modal">
                        <BuilderFieldPreviewStep
                            config={controller.fieldPreviewPackage.config}
                            fields={controller.fieldPreviewPackage.config.Fields}
                            layout={
                                controller.fieldPreviewPackage.config.Layout ?? defaultBuilderLayout
                            }
                            lineSection={controller.fieldPreviewPackage.config.LineItemSections[0]}
                        />
                    </div>
                ) : null}
            </AppModal>
            <AppModal
                className="builder-field-preview-modal-frame"
                isOpen={Boolean(printPreviewPackage)}
                onClose={controller.closePrintPreview}
                showScrollProgress
                title="Print preview"
            >
                {printPreviewPackage ? (
                    <div className="builder-field-preview-modal">
                        <BuilderPrintPreviewStep
                            assets={printPreviewPackage.assets}
                            config={printPreviewPackage.config}
                            onPrintSettingsChange={(nextPrint) => {
                                controller.setPrintPreviewPackage({
                                    ...printPreviewPackage,
                                    config: {
                                        ...printPreviewPackage.config,
                                        Print: nextPrint,
                                    },
                                });
                            }}
                            printSettings={normalizePrintSettings(printPreviewPackage.config.Print)}
                            templateHtml={printPreviewPackage.templateHtml}
                            validation={[]}
                        />
                    </div>
                ) : null}
            </AppModal>
        </div>
    );
};
