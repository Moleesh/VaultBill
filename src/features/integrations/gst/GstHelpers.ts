import {
  decimalFromInteger,
  divideDecimal,
  formatDecimal,
  multiplyDecimal,
  parseDecimal,
} from '../../../engines/formulaEngine/DecimalMath';

export type GstValidationResult = {
  readonly isValid: boolean;
  readonly normalizedGstin: string;
  readonly userMessage: string;
};

export type HsnSacEntry = {
  readonly Code: string;
  readonly Description: string;
  readonly TaxRatePercent: string;
};

export type GstTaxBreakup = {
  readonly taxableAmount: string;
  readonly ratePercent: string;
  readonly cgst: string;
  readonly sgst: string;
  readonly igst: string;
  readonly totalTax: string;
  readonly taxMode: 'IntraState' | 'InterState';
};

const gstinPattern = /^([0-9]{2})([A-Z]{5}[0-9]{4}[A-Z])([1-9A-Z])Z([0-9A-Z])$/u;
const checksumCharacters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const supportedStateCodes = new Set([
  ...Array.from({ length: 38 }, (_value, index) => String(index + 1).padStart(2, '0')),
  '97',
]);

export const validateGstin = (gstin: string): GstValidationResult => {
  const normalizedGstin = gstin.trim().toUpperCase();
  const match = gstinPattern.exec(normalizedGstin);

  if (!match) {
    return {
      isValid: false,
      normalizedGstin,
      userMessage: 'GSTIN must be 15 characters in the expected GST format.',
    };
  }

  if (!supportedStateCodes.has(match[1] ?? '')) {
    return {
      isValid: false,
      normalizedGstin,
      userMessage: 'GSTIN state code is not recognized.',
    };
  }

  const expectedChecksum = calculateGstinChecksum(normalizedGstin.slice(0, 14));

  return expectedChecksum === normalizedGstin[14]
    ? { isValid: true, normalizedGstin, userMessage: 'GSTIN format is valid.' }
    : {
        isValid: false,
        normalizedGstin,
        userMessage: 'GSTIN checksum does not match.',
      };
};

export const lookupHsnSac = (
  code: string,
  catalog: readonly HsnSacEntry[],
): HsnSacEntry | undefined => {
  const normalizedCode = code.trim().toUpperCase();
  return catalog.find((entry) => entry.Code.trim().toUpperCase() === normalizedCode);
};

export const calculateStateGst = (
  taxableAmount: string,
  ratePercent: string,
  sellerStateCode: string,
  buyerStateCode: string,
  precision = 2,
): GstTaxBreakup => {
  const tax = divideDecimal(
    multiplyDecimal(parseDecimal(taxableAmount), parseDecimal(ratePercent)),
    decimalFromInteger(100),
    precision,
    'HALF_UP',
  );
  const sameState = sellerStateCode.trim() === buyerStateCode.trim();
  const halfTax = divideDecimal(tax, decimalFromInteger(2), precision, 'HALF_UP');

  return {
    taxableAmount: formatDecimal(parseDecimal(taxableAmount), precision),
    ratePercent,
    cgst: sameState ? formatDecimal(halfTax, precision) : '0.00',
    sgst: sameState ? formatDecimal(halfTax, precision) : '0.00',
    igst: sameState ? '0.00' : formatDecimal(tax, precision),
    totalTax: formatDecimal(tax, precision),
    taxMode: sameState ? 'IntraState' : 'InterState',
  };
};

export const sanitizeGstrExportCell = (value: string): string =>
  /^[=+\-@]/u.test(value) ? `'${value}` : value;

const calculateGstinChecksum = (baseGstin: string): string => {
  let checksumValue = 0;

  for (let index = 0; index < baseGstin.length; index += 1) {
    const character = baseGstin[index] ?? '';
    const codePoint = checksumCharacters.indexOf(character);
    const factor = (index % 2) + 1;
    const product = codePoint * factor;
    checksumValue += Math.floor(product / 36) + (product % 36);
  }

  return checksumCharacters[(36 - (checksumValue % 36)) % 36] ?? '';
};
