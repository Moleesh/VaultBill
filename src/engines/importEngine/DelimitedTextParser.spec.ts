/** @format */

import { describe, expect, it } from 'vitest';

import { parseDelimitedText } from './DelimitedTextParser';

describe('DelimitedTextParser', () => {
    it('parses quoted CSV cells without modifying saved data', () => {
        expect(parseDelimitedText('"Item, One",2,"500.00"\nPlain,1,10')).toEqual({
            delimiter: ',',
            rows: [
                ['Item, One', '2', '500.00'],
                ['Plain', '1', '10'],
            ],
        });
    });

    it('detects tab-delimited spreadsheet paste data', () => {
        expect(parseDelimitedText('Item Name\tQuantity\nSample\t2')).toEqual({
            delimiter: '\t',
            rows: [
                ['Item Name', 'Quantity'],
                ['Sample', '2'],
            ],
        });
    });
});
