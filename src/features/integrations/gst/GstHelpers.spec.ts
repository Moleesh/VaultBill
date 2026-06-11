/** @format */

import { describe, expect, it } from 'vitest';

import {
    calculateStateGst,
    lookupHsnSac,
    sanitizeGstrExportCell,
    validateGstin,
} from './GstHelpers';

describe('GstHelpers', () => {
    it('validates GSTIN format and checksum with clear failures', () => {
        expect(validateGstin('29ABCDE1234F1ZW')).toMatchObject({
            isValid: true,
            normalizedGstin: '29ABCDE1234F1ZW',
        });
        expect(validateGstin('29ABCDE1234F1Z5')).toMatchObject({
            isValid: false,
            userMessage: 'GSTIN checksum does not match.',
        });
    });

    it('looks up HSN/SAC entries and protects GSTR export cells', () => {
        expect(
            lookupHsnSac(' 9983 ', [
                { Code: '9983', Description: 'Professional services', TaxRatePercent: '18' },
            ]),
        ).toMatchObject({ Description: 'Professional services' });
        expect(sanitizeGstrExportCell('=IMPORTXML("x")')).toBe('\'=IMPORTXML("x")');
    });

    it('splits same-state tax and uses IGST for interstate tax', () => {
        expect(calculateStateGst('1000', '18', '29', '29')).toMatchObject({
            cgst: '90.00',
            sgst: '90.00',
            igst: '0.00',
            totalTax: '180.00',
            taxMode: 'IntraState',
        });
        expect(calculateStateGst('1000', '18', '29', '27')).toMatchObject({
            cgst: '0.00',
            sgst: '0.00',
            igst: '180.00',
            taxMode: 'InterState',
        });
    });
});
