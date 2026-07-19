/** @format */

import type { FC } from 'react';

import { BuilderCalculationsStep } from './BuilderCalculationsStep';
import { BuilderFieldPreviewStep } from './BuilderFieldPreviewStep';
import { BuilderFieldsStep } from './BuilderFieldsStep';
import { BuilderFormatStep } from './BuilderFormatStep';
import { BuilderLayoutStep } from './BuilderLayoutStep';
import { BuilderLineItemsStep } from './BuilderLineItemsStep';
import { newField, type BuilderLayoutConfig, type BuilderPrintConfig } from './BuilderPageSupport';
import { BuilderPrintPreviewStep } from './BuilderPrintPreviewStep';
import { BuilderPrintStep } from './BuilderPrintStep';
import { BuilderSummaryStep } from './BuilderSummaryStep';

import type { BuilderPageController } from './useBuilderPageController';

type BuilderPageStepSectionsProps = {
    readonly controller: BuilderPageController;
    readonly layout: BuilderLayoutConfig;
    readonly printSettings: BuilderPrintConfig;
    readonly lineSection: BuilderPageController['lineSection'];
    readonly referencedFieldIds: ReadonlySet<string>;
};

/** Renders the active builder step section before the shared footer actions. */
export const BuilderPageStepSections: FC<BuilderPageStepSectionsProps> = ({
    controller,
    layout,
    printSettings,
    lineSection,
    referencedFieldIds,
}) => (
    <>
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
                fields={controller.config.Fields}
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
        {controller.activeStep === 'Line Items' && lineSection ? (
            <BuilderLineItemsStep
                lineSection={lineSection}
                enabled={lineSection.Enabled !== false}
                onPrevious={() => {
                    controller.setStepIndex((current) => Math.max(0, current - 1));
                }}
                onEnabledChange={(value) => {
                    if (!value) controller.setEditing(undefined);
                    controller.setConfig({
                        ...controller.config,
                        LineItemSections: [{ ...lineSection, Enabled: value }],
                    });
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
        {controller.activeStep === 'Summary' ? (
            <BuilderSummaryStep
                fields={controller.config.Fields}
                onChange={(fields) => {
                    controller.updateFields('document', fields);
                }}
                onEdit={(index) => {
                    controller.setEditing({ kind: 'document', index });
                }}
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
                onImportAssets={controller.importAssets}
                onImportHtml={controller.importHtml}
                onRemoveAsset={(assetName) => {
                    controller.setAssets((current) =>
                        current.filter((asset) => asset.name !== assetName),
                    );
                }}
                onRemoveTemplate={controller.removeSavedTemplate}
                onSelectTemplate={controller.setActiveTemplateName}
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
    </>
);
