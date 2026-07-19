/** @format */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BuilderLineItemPreview } from '../BuilderLineItemPreview';

describe('BuilderLineItemPreview', () => {
    it('renders line-item detail fields as row sub-fields', () => {
        render(
            <BuilderLineItemPreview
                label="Items"
                lineItemColumns={[
                    {
                        FieldId: 'ItemName',
                        Label: 'Item Name',
                        Type: 'Text',
                        SampleValue: 'Consulting service',
                    },
                    {
                        FieldId: 'Quantity',
                        Label: 'Quantity',
                        Type: 'Quantity',
                        SampleValue: '5.000',
                    },
                ]}
                lineItemDetails={[
                    {
                        FieldId: 'ItemDescription',
                        Label: 'Item Description',
                        Type: 'Textarea',
                        SampleValue: 'Implementation and support',
                    },
                ]}
            />,
        );

        expect(screen.getAllByText('Sub fields')).toHaveLength(2);
        expect(screen.getAllByText('Item Description')[0]).toBeVisible();
        expect(screen.getAllByText('Implementation and support')[0]).toBeVisible();
    });
});
