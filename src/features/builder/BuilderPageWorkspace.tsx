/** @format */

import { BuilderPageDrawer } from './BuilderPageDrawer';
import { BuilderCalculationsStep } from './BuilderCalculationsStep';
import { BuilderFieldsStep } from './BuilderFieldsStep';
import { BuilderFormatStep } from './BuilderFormatStep';
import { BuilderLayoutStep } from './BuilderLayoutStep';
import { BuilderLineItemsStep } from './BuilderLineItemsStep';
import { BuilderPageFooter } from './BuilderPageFooter';
import { BuilderPageHeader } from './BuilderPageHeader';
import { BuilderPreviewStep } from './BuilderPreviewStep';
import { BuilderPrintStep } from './BuilderPrintStep';
import { helperFor, newField, steps, type BuilderLayoutConfig } from './BuilderPageSupport';
import type { FC } from 'react';
import type { BuilderPageController } from './useBuilderPageController';

export const BuilderPageWorkspace: FC<{ readonly controller: BuilderPageController }> = ({
    controller,
}) => {
    const { lineSection, referencedFieldIds } = controller;
    const layout = controller.config.Layout ?? { Rows: 1, Columns: 2 };

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
            <section className="builder-workspace builder-workspace--single">
                <header className="builder-step-header">
                    <div>
                        <p className="eyebrow">{controller.activeStep}</p>
                        <h2>{controller.activeStep}</h2>
                    </div>
                    <p>{helperFor(controller.activeStep)}</p>
                </header>
                {controller.activeStep === 'Format' ? (
                    <BuilderFormatStep
                        formatName={controller.config.FormatName}
                        onFormatNameChange={(value) => {
                            controller.setConfig({ ...controller.config, FormatName: value });
                        }}
                    />
                ) : null}
                {controller.activeStep === 'Fields' ? (
                    <BuilderFieldsStep
                        fields={controller.config.Fields}
                        onAdd={() => {
                            const fields = [
                                ...controller.config.Fields,
                                newField(controller.config.Fields.length),
                            ];
                            controller.updateFields('document', fields);
                            controller.setEditing({ kind: 'document', index: fields.length - 1 });
                        }}
                        onChange={(fields) => {
                            controller.updateFields('document', fields);
                        }}
                        onEdit={(index) => {
                            controller.setEditing({ kind: 'document', index });
                        }}
                        referencedFieldIds={referencedFieldIds}
                    />
                ) : null}
                {controller.activeStep === 'Layout' ? (
                    <BuilderLayoutStep
                        layout={layout}
                        onLayoutChange={(nextLayout: BuilderLayoutConfig) => {
                            controller.setConfig({
                                ...controller.config,
                                Layout: nextLayout,
                            });
                        }}
                    />
                ) : null}
                {controller.activeStep === 'Line Items' && lineSection ? (
                    <BuilderLineItemsStep
                        lineSection={lineSection}
                        onAdd={() => {
                            const fields = [
                                ...lineSection.Fields,
                                newField(lineSection.Fields.length),
                            ];
                            controller.updateFields('line', fields);
                            controller.setEditing({ kind: 'line', index: fields.length - 1 });
                        }}
                        onChange={(fields) => {
                            controller.updateFields('line', fields);
                        }}
                        onEdit={(index) => {
                            controller.setEditing({ kind: 'line', index });
                        }}
                        onLabelChange={(value) => {
                            controller.setConfig({
                                ...controller.config,
                                LineItemSections: [{ ...lineSection, Label: value }],
                            });
                        }}
                        onMaxRowsChange={(value) => {
                            controller.setConfig({
                                ...controller.config,
                                LineItemSections: [{ ...lineSection, MaxRows: value }],
                            });
                        }}
                        referencedFieldIds={referencedFieldIds}
                    />
                ) : null}
                {controller.activeStep === 'Calculations' ? (
                    <BuilderCalculationsStep
                        allFields={controller.allFields}
                        currencyPolicy={controller.config.CalculationPolicy}
                        fields={[...controller.config.Fields, ...(lineSection?.Fields ?? [])]}
                        onEditFormula={(fieldId) => {
                            const documentIndex = controller.config.Fields.findIndex(
                                (candidate) => candidate.FieldId === fieldId,
                            );
                            controller.setEditing(
                                documentIndex >= 0
                                    ? { kind: 'document', index: documentIndex }
                                    : {
                                          kind: 'line',
                                          index:
                                              lineSection?.Fields.findIndex(
                                                  (candidate) => candidate.FieldId === fieldId,
                                              ) ?? 0,
                                      },
                            );
                        }}
                    />
                ) : null}
                {controller.activeStep === 'Print' ? (
                    <BuilderPrintStep
                        assets={controller.assets}
                        onImportAssets={(event) => {
                            void controller.importAssets(event);
                        }}
                        onImportHtml={(event) => {
                            void controller.importHtml(event);
                        }}
                        onRemoveAsset={(assetName) => {
                            controller.setAssets((current) =>
                                current.filter((asset) => asset.name !== assetName),
                            );
                        }}
                        onRenameAsset={(asset) => {
                            const nextName = window.prompt('Asset name', asset.name)?.trim();
                            if (!nextName || nextName === asset.name) return;
                            controller.setAssets((current) =>
                                current.map((candidate) =>
                                    candidate.name === asset.name
                                        ? { ...candidate, name: nextName }
                                        : candidate,
                                ),
                            );
                        }}
                        templateHtml={controller.templateHtml}
                    />
                ) : null}
                {controller.activeStep === 'Preview & Save' ? (
                    <BuilderPreviewStep
                        assets={controller.assets}
                        config={controller.config}
                        fields={controller.config.Fields}
                        lineSection={lineSection}
                        templateHtml={controller.templateHtml}
                        validation={controller.validation}
                    />
                ) : null}
                <BuilderPageFooter
                    importWarnings={controller.importWarnings}
                    message={controller.message}
                    onBack={() => {
                        controller.setStepIndex((current) => Math.max(0, current - 1));
                    }}
                    onContinue={() => {
                        controller.setStepIndex((current) =>
                            Math.min(steps.length - 1, current + 1),
                        );
                    }}
                    onPublish={() => {
                        void controller.publish();
                    }}
                    stepCount={steps.length}
                    stepIndex={controller.stepIndex}
                    validation={controller.validation}
                />
            </section>
            <BuilderPageDrawer controller={controller} lineSection={lineSection} />
        </div>
    );
};
