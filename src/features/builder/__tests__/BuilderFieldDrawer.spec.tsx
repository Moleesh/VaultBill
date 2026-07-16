/** @format */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BuilderFieldDrawer } from '../BuilderFieldDrawer';

describe('BuilderFieldDrawer', () => {
    it('updates checkbox state immediately when field toggles change', () => {
        render(
            <BuilderFieldDrawer
                field={
                    {
                        FieldId: 'InvoiceDate',
                        Label: 'Invoice Date',
                        Type: 'Date',
                        Required: false,
                        Visible: true,
                        ReadOnly: false,
                        Calculated: false,
                    } as never
                }
                formulaSuggestions={[]}
                onCancel={() => undefined}
                onSave={() => undefined}
            />,
        );

        const required = screen.getByLabelText('Required');
        const visible = screen.getByLabelText('Visible');
        const readOnly = screen.getByLabelText('Read only');
        const calculated = screen.getByLabelText('Calculated');

        fireEvent.click(required);
        fireEvent.click(visible);
        fireEvent.click(readOnly);
        fireEvent.click(calculated);

        expect(required).toBeChecked();
        expect(visible).not.toBeChecked();
        expect(readOnly).toBeChecked();
        expect(calculated).toBeChecked();
        expect(screen.getByLabelText('Formula')).toBeVisible();
    });

    it('shows formula examples for calculated fields without a native datalist dropdown', () => {
        render(
            <BuilderFieldDrawer
                field={
                    {
                        FieldId: 'Subtotal',
                        Label: 'Subtotal',
                        Type: 'Money',
                        Calculated: true,
                        Formula: 'SUMALL(Amount)',
                    } as never
                }
                formulaSuggestions={['Quantity * Rate', 'SUMALL(Amount)', 'Secrets.CompanyName']}
                onCancel={() => undefined}
                onSave={() => undefined}
            />,
        );

        expect(screen.getByLabelText('Formula')).not.toHaveAttribute('list');
        expect(
            screen.getByText('Examples: Quantity * Rate, SUMALL(Amount), Secrets.CompanyName'),
        ).toBeVisible();
        expect(document.querySelector('datalist')).toBeNull();
    });
});
