export type DecimalValue = {
  readonly mantissa: bigint;
  readonly scale: number;
};

export type RoundingMode = 'HALF_UP';

const decimalPattern = /^(-?)(\d+)(?:\.(\d+))?$/u;

export const parseDecimal = (value: string): DecimalValue => {
  const match = decimalPattern.exec(value.trim());

  if (!match) {
    throw new Error(`Invalid decimal value: ${value}`);
  }

  const sign = match[1] === '-' ? -1n : 1n;
  const whole = match[2] ?? '0';
  const fraction = match[3] ?? '';
  const digits = `${whole}${fraction}`.replace(/^0+(?=\d)/u, '');

  return normalizeDecimal({
    mantissa: BigInt(digits || '0') * sign,
    scale: fraction.length,
  });
};

export const decimalFromInteger = (value: number): DecimalValue => {
  if (!Number.isInteger(value)) {
    throw new Error('Only integer numbers can be converted to DecimalValue.');
  }

  return { mantissa: BigInt(value), scale: 0 };
};

export const addDecimal = (left: DecimalValue, right: DecimalValue): DecimalValue => {
  const scale = Math.max(left.scale, right.scale);
  return normalizeDecimal({
    mantissa: scaleMantissa(left, scale) + scaleMantissa(right, scale),
    scale,
  });
};

export const subtractDecimal = (left: DecimalValue, right: DecimalValue): DecimalValue =>
  addDecimal(left, { mantissa: -right.mantissa, scale: right.scale });

export const multiplyDecimal = (left: DecimalValue, right: DecimalValue): DecimalValue =>
  normalizeDecimal({
    mantissa: left.mantissa * right.mantissa,
    scale: left.scale + right.scale,
  });

export const divideDecimal = (
  left: DecimalValue,
  right: DecimalValue,
  precision: number,
  roundingMode: RoundingMode,
): DecimalValue => {
  if (right.mantissa === 0n) {
    throw new Error('Division by zero is not allowed.');
  }

  const dividend = left.mantissa * powerOfTen(precision + right.scale);
  const divisor = right.mantissa * powerOfTen(left.scale);
  const quotient = dividend / divisor;
  const remainder = dividend % divisor;

  return normalizeDecimal(roundQuotient(quotient, remainder, divisor, precision, roundingMode));
};

export const roundDecimal = (
  value: DecimalValue,
  precision: number,
  roundingMode: RoundingMode,
): DecimalValue => {
  if (precision >= value.scale) {
    return {
      mantissa: value.mantissa * powerOfTen(precision - value.scale),
      scale: precision,
    };
  }

  const divisor = powerOfTen(value.scale - precision);
  const quotient = value.mantissa / divisor;
  const remainder = value.mantissa % divisor;

  return normalizeDecimal(roundQuotient(quotient, remainder, divisor, precision, roundingMode));
};

export const formatDecimal = (
  value: DecimalValue,
  precision: number,
  roundingMode: RoundingMode = 'HALF_UP',
): string => {
  const rounded = roundDecimal(value, precision, roundingMode);
  const sign = rounded.mantissa < 0n ? '-' : '';
  const absolute = absBigInt(rounded.mantissa)
    .toString()
    .padStart(precision + 1, '0');

  if (precision === 0) {
    return `${sign}${absolute}`;
  }

  const whole = absolute.slice(0, -precision) || '0';
  const fraction = absolute.slice(-precision).padEnd(precision, '0');
  return `${sign}${whole}.${fraction}`;
};

const roundQuotient = (
  quotient: bigint,
  remainder: bigint,
  divisor: bigint,
  precision: number,
  roundingMode: RoundingMode,
): DecimalValue => {
  const supportedRoundingModes: ReadonlySet<string> = new Set(['HALF_UP']);

  if (!supportedRoundingModes.has(roundingMode)) {
    throw new Error('Unsupported rounding mode.');
  }

  const shouldRoundUp = absBigInt(remainder) * 2n >= absBigInt(divisor);
  const direction = quotient < 0n || (quotient === 0n && remainder < 0n) ? -1n : 1n;

  return {
    mantissa: shouldRoundUp ? quotient + direction : quotient,
    scale: precision,
  };
};

const normalizeDecimal = (value: DecimalValue): DecimalValue => {
  let { mantissa, scale } = value;

  while (scale > 0 && mantissa % 10n === 0n) {
    mantissa /= 10n;
    scale -= 1;
  }

  return { mantissa, scale };
};

const scaleMantissa = (value: DecimalValue, scale: number): bigint =>
  value.mantissa * powerOfTen(scale - value.scale);

const powerOfTen = (exponent: number): bigint => {
  if (exponent < 0) {
    throw new Error('Negative decimal scaling is not supported.');
  }

  return 10n ** BigInt(exponent);
};

const absBigInt = (value: bigint): bigint => (value < 0n ? -value : value);
