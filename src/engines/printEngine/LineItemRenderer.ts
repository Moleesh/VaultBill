import { z } from 'zod';

import { escapeHtml } from './HtmlEscape';

const objectRecordSchema = z.record(z.string(), z.unknown());
const lineItemRowSchema = z.object({
  Values: objectRecordSchema,
});

export const renderUnknownPrintValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }

  if (Array.isArray(value)) {
    return renderLineItemRows(value);
  }

  if (typeof value === 'object') {
    return escapeHtml(JSON.stringify(value));
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'bigint' ||
    typeof value === 'boolean'
  ) {
    return escapeHtml(value.toString());
  }

  return '';
};

const renderLineItemRows = (rows: readonly unknown[]): string => {
  const parsedRows = rows
    .map((row) => lineItemRowSchema.safeParse(row))
    .filter((result) => result.success)
    .map((result) => result.data.Values);

  if (parsedRows.length === 0) {
    return '';
  }

  const columns = [...new Set(parsedRows.flatMap((row) => Object.keys(row)))];
  const headerCells = columns
    .map((column) => `<th>${escapeHtml(column)}</th>`)
    .join('');
  const bodyRows = parsedRows.map((row) => renderLineItemRow(row, columns)).join('');

  return `<table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
};

const renderLineItemRow = (
  row: Readonly<Record<string, unknown>>,
  columns: readonly string[],
): string => {
  const cells = columns
    .map((column) => `<td>${renderUnknownPrintValue(row[column])}</td>`)
    .join('');

  return `<tr>${cells}</tr>`;
};
