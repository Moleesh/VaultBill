/** @format */

import type { FC } from 'react';

import { ActionButton } from '../../components/ActionButton';
import { DialogActions } from '../../components/DialogActions';
import { FormField } from '../../components/FormFields';

type BuilderFieldFormulaSectionProps = {
    readonly fieldId: string;
    readonly formula: string;
    readonly formulaSuggestions: readonly string[];
    readonly onFormulaChange: (value: string) => void;
};

export const BuilderFieldFormulaSection: FC<BuilderFieldFormulaSectionProps> = ({
    fieldId,
    formula,
    formulaSuggestions,
    onFormulaChange,
}) => (
    <>
        <FormField.TextField
            label="Formula"
            list={`formula-suggestions-${fieldId}`}
            note="Examples: Quantity * Rate, SUMALL(Amount), SUM(Items.Amount), COUNT(Items), Secrets.Key"
            onChange={(event) => {
                onFormulaChange(event.currentTarget.value);
            }}
            value={formula}
            wrapperClassName="span-2"
        />
        <datalist id={`formula-suggestions-${fieldId}`}>
            {formulaSuggestions.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
            ))}
        </datalist>
    </>
);

type BuilderFieldDrawerActionsProps = {
    readonly onCancel: () => void;
};

/** Shared drawer footer actions for field editing. */
export const BuilderFieldDrawerActions: FC<BuilderFieldDrawerActionsProps> = ({ onCancel }) => (
    <DialogActions className="span-2">
        <ActionButton onClick={onCancel} variant="secondary">
            Cancel
        </ActionButton>
        <ActionButton type="submit" variant="primary">
            Save field
        </ActionButton>
    </DialogActions>
);

type BuilderFieldTogglesProps = {
    readonly isCalculated: boolean;
    readonly isReadOnly: boolean;
    readonly isRequired: boolean;
    readonly isVisible: boolean;
    readonly onCalculatedChange: (checked: boolean) => void;
    readonly onReadOnlyChange: (checked: boolean) => void;
    readonly onRequiredChange: (checked: boolean) => void;
    readonly onVisibleChange: (checked: boolean) => void;
};

/** Shared toggle cluster for field-level visibility and calculation flags. */
export const BuilderFieldToggles: FC<BuilderFieldTogglesProps> = ({
    isCalculated,
    isReadOnly,
    isRequired,
    isVisible,
    onCalculatedChange,
    onReadOnlyChange,
    onRequiredChange,
    onVisibleChange,
}) => (
    <>
        <FormField.CheckboxField
            checked={isRequired}
            label="Required"
            onChange={(event) => {
                onRequiredChange(event.currentTarget.checked);
            }}
        />
        <FormField.CheckboxField
            checked={isVisible}
            label="Visible"
            onChange={(event) => {
                onVisibleChange(event.currentTarget.checked);
            }}
        />
        <FormField.CheckboxField
            checked={isReadOnly}
            label="Read only"
            onChange={(event) => {
                onReadOnlyChange(event.currentTarget.checked);
            }}
        />
        <FormField.CheckboxField
            checked={isCalculated}
            label="Calculated"
            onChange={(event) => {
                onCalculatedChange(event.currentTarget.checked);
            }}
        />
    </>
);
