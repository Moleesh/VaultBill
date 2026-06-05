import type { SourceTable } from './ImportTypes';

export const parseDelimitedText = (rawText: string): SourceTable => {
  const trimmed = rawText.trim();

  if (!trimmed) {
    return { delimiter: ',', rows: [] };
  }

  const delimiter = detectDelimiter(trimmed);
  return {
    delimiter,
    rows: splitRows(trimmed).map((row) => parseDelimitedRow(row, delimiter)),
  };
};

const detectDelimiter = (rawText: string): ',' | '\t' => {
  const firstLine = splitRows(rawText)[0] ?? '';
  const tabCount = countMatches(firstLine, '\t');
  const commaCount = countMatches(firstLine, ',');
  return tabCount > commaCount ? '\t' : ',';
};

const splitRows = (rawText: string): readonly string[] =>
  rawText.split(/\r?\n/u).filter((row) => row.trim().length > 0);

const parseDelimitedRow = (row: string, delimiter: ',' | '\t'): readonly string[] => {
  const cells: string[] = [];
  let current = '';
  let isQuoted = false;

  for (let index = 0; index < row.length; index += 1) {
    const char = row[index] ?? '';
    const next = row[index + 1] ?? '';

    if (char === '"' && isQuoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      isQuoted = !isQuoted;
    } else if (char === delimiter && !isQuoted) {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells;
};

const countMatches = (value: string, search: string): number => value.split(search).length - 1;
