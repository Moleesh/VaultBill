/** @format */

import type { FC } from 'react';

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
    <label className="span-2">
        <span>Formula</span>
        <input
            list={`formula-suggestions-${fieldId}`}
            value={formula}
            onChange={(event) => {
                onFormulaChange(event.currentTarget.value);
            }}
        />
        <small>
            Examples: Quantity * Rate, SUMALL(Amount), SUM(Items.Amount), COUNT(Items), Secrets.Key
        </small>
        <datalist id={`formula-suggestions-${fieldId}`}>
            {formulaSuggestions.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
            ))}
        </datalist>
    </label>
);
