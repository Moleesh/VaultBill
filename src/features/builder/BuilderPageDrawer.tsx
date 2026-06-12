/** @format */

import { AppDrawer } from '../../components/AppDrawer/AppDrawer';
import { BuilderFieldDrawer } from './BuilderFieldDrawer';
import type { BuilderPageController } from './useBuilderPageController';

type BuilderPageDrawerProps = {
    readonly controller: BuilderPageController;
    readonly lineSection: BuilderPageController['lineSection'];
};

/** Renders the field editor drawer for the active builder step. */
export const BuilderPageDrawer = ({ controller, lineSection }: BuilderPageDrawerProps) => (
    <AppDrawer
        isOpen={Boolean(controller.editingField)}
        onClose={() => {
            controller.setEditing(undefined);
        }}
        title={controller.editingField ? `Edit ${controller.editingField.Label}` : 'Edit field'}
    >
        {controller.editingField && controller.editing ? (
            <BuilderFieldDrawer
                field={controller.editingField}
                onChange={(field) => {
                    const { editing } = controller;
                    if (!editing) return;
                    const fields =
                        editing.kind === 'document'
                            ? controller.config.Fields
                            : (lineSection?.Fields ?? []);
                    controller.updateFields(
                        editing.kind,
                        fields.map((candidate, index) =>
                            index === editing.index ? field : candidate,
                        ),
                    );
                }}
            />
        ) : null}
    </AppDrawer>
);
