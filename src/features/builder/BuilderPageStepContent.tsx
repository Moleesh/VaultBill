/** @format */

import type { FC } from 'react';

import { BuilderCalculationsStep } from './BuilderCalculationsStep';
import { BuilderFieldPreviewStep } from './BuilderFieldPreviewStep';
import { BuilderFieldsStep } from './BuilderFieldsStep';
import { BuilderFormatStep } from './BuilderFormatStep';
import { BuilderLayoutStep } from './BuilderLayoutStep';
import { BuilderLineItemsStep } from './BuilderLineItemsStep';
import { BuilderPageFooter } from './BuilderPageFooter';
import { BuilderPrintStep } from './BuilderPrintStep';
import { BuilderPrintPreviewStep } from './BuilderPrintPreviewStep';
import { helperFor, newField, steps, type BuilderLayoutConfig, type BuilderPrintConfig } from './BuilderPageSupport';
import type { BuilderPageController } from './useBuilderPageController';

type BuilderPageStepContentProps = {
    readonly controller: BuilderPageController;
    readonly layout: BuilderLayoutConfig;
    readonly printSettings: BuilderPrintConfig;
    readonly lineSection: BuilderPageController['lineSection'];
    readonly referencedFieldIds: ReadonlySet<string>;
};

/** Renders the active builder step and footer actions. */
export const BuilderPageStepContent: FC<BuilderPageStepContentProps> = ({
    controller,
    layout,
    printSettings,
    lineSection,
    referencedFieldIds,
}) => (
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
        {controller.activeStep === 'Fields' ? (
            <BuilderFieldsStep
                fields={controller.config.Fields}
                onAdd={() => {
                    const fields = [...controller.config.Fields, newField(controller.config.Fields.length)];
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
        {controller.activeStep === 'Line Items' && lineSection ? (
            <BuilderLineItemsStep
                lineSection={lineSection}
                onPrevious={() => {
                    controller.setStepIndex((current) => Math.max(0, current - 1));
                }}
                onAdd={() => {
                    const fields = [...lineSection.Fields, newField(lineSection.Fields.length)];
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
                calculationTargets={controller.calculationTargets}
                allFields={controller.allFields}
                currencyPolicy={controller.config.CalculationPolicy}
                secretValues={controller.secretValues}
                onOrderChange={controller.updateCalculationOrder}
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
                activeTemplateName={controller.activeTemplateName}
                onImportAssets={(event) => {
                    void controller.importAssets(event);
                }}
                onImportHtml={(event) => {
                    void controller.importHtml(event);
                }}
                onRemoveAsset={(assetName) => {
                    controller.setAssets((current) => current.filter((asset) => asset.name !== assetName));
                }}
                onRemoveTemplate={(templateName) => {
                    controller.removeSavedTemplate(templateName);
                }}
                onSelectTemplate={(templateName) => {
                    controller.setActiveTemplateName(templateName);
                }}
                savedTemplates={controller.savedTemplates}
                templateHtml={controller.templateHtml}
            />
        ) : null}
        {controller.activeStep === 'Field Preview' ? (
            <BuilderFieldPreviewStep
                config={controller.config}
                fields={controller.config.Fields}
                layout={layout}
                lineSection={lineSection}
            />
        ) : null}
        {controller.activeStep === 'Print Preview' ? (
            <BuilderPrintPreviewStep
                assets={controller.assets}
                config={controller.config}
                onPrintSettingsChange={(nextPrint) => {
                    controller.setConfig({
                        ...controller.config,
                        Print: nextPrint,
                    });
                }}
                printSettings={printSettings}
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
                controller.setStepIndex((current) => Math.min(steps.length - 1, current + 1));
            }}
            onPublish={() => {
                void controller.publish();
            }}
            stepCount={steps.length}
            stepIndex={controller.stepIndex}
            validation={controller.validation}
        />
    </section>
);
