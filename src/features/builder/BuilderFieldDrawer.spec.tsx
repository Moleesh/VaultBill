/** @format */

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BuilderFieldDrawer } from './BuilderFieldDrawer';

describe('BuilderFieldDrawer', () => {
    it('shows formula suggestions for calculated fields', () => {
        render(
            <BuilderFieldDrawer
                field={{
                    FieldId: 'Subtotal',
                    Label: 'Subtotal',
                    Type: 'Money',
                    Calculated: true,
                    Formula: 'SUMALL(Amount)',
                } as never}
                formulaSuggestions={['Quantity * Rate', 'SUMALL(Amount)', 'Secrets.CompanyName']}
                onChange={() => undefined}
            />,
        );

        const formulaInput = document.querySelector('input[list="formula-suggestions-Subtotal"]');
        expect(formulaInput).not.toBeNull();
        const suggestionList = document.querySelector('#formula-suggestions-Subtotal');
        const suggestionValues = [...(suggestionList?.querySelectorAll('option') ?? [])].map(
            (option) => option.value,
        );
        expect(suggestionValues).toEqual([
            'Quantity * Rate',
            'SUMALL(Amount)',
            'Secrets.CompanyName',
        ]);
    });
});
