/** @format */

import type { z } from 'zod';

export const parseJsonWithSchema = <Output>(
    rawJson: string,
    schema: z.ZodType<Output>,
): Output => {
    const parsed: unknown = JSON.parse(rawJson);
    return schema.parse(parsed);
};

export const stringifyValidatedJson = <Output>(
    value: Output,
    schema: z.ZodType<Output>,
): string =>
    JSON.stringify(schema.parse(value));
