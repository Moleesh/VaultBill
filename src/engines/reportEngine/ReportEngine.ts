import type { DocumentRecord } from '../../features/records/DocumentRecordSchema';
import type { ReportConfig, ReportFilterValues, ReportPage, ReportRow } from './ReportTypes';

export const getReportPage = (
  records: readonly DocumentRecord[],
  report: ReportConfig,
  filters: ReportFilterValues,
  pageSize: number,
  cursor = 0,
): ReportPage => {
  const matchingRows = buildAllReportRows(records, report, filters);
  const rows = matchingRows.slice(cursor, cursor + pageSize);
  const nextCursor = cursor + rows.length;
  const isComplete = nextCursor >= matchingRows.length;

  return {
    rows,
    totalMatchingRows: matchingRows.length,
    ...(isComplete ? {} : { nextCursor }),
    isComplete,
  };
};

export const buildAllReportRows = (
  records: readonly DocumentRecord[],
  report: ReportConfig,
  filters: ReportFilterValues,
): readonly ReportRow[] =>
  records
    .filter((record) => record.Status !== 'Draft')
    .filter((record) => report.FormatIds.includes(record.FormatId))
    .filter((record) => matchesFilters(record, report, filters))
    .sort((left, right) => right.CreatedAt.localeCompare(left.CreatedAt))
    .map((record) => ({
      recordId: record.RecordId,
      createdAt: record.CreatedAt,
      values: Object.fromEntries(
        report.Columns.map((column) => [
          column.ColumnId,
          stringifyReportValue(resolveRecordValue(record, column.SourceField)),
        ]),
      ),
    }));

const matchesFilters = (
  record: DocumentRecord,
  report: ReportConfig,
  filters: ReportFilterValues,
): boolean =>
  report.Filters.every((filter) => {
    const requested = filters[filter.FieldId];

    if (!requested) {
      return true;
    }

    const value = stringifyReportValue(resolveRecordValue(record, filter.FieldId));
    return (!requested.from || value >= requested.from) && (!requested.to || value <= requested.to);
  });

export const resolveRecordValue = (record: DocumentRecord, sourceField: string): unknown => {
  if (sourceField === 'InvoiceNumber' || sourceField === 'DocumentNumber') {
    return record.DocumentNumber;
  }

  if (sourceField in record.Values) {
    return record.Values[sourceField];
  }

  return record[sourceField as keyof DocumentRecord] ?? '';
};

const stringifyReportValue = (value: unknown): string => {
  if (value === undefined || value === null) {
    return '';
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'bigint' ||
    typeof value === 'boolean'
  ) {
    return value.toString();
  }

  return '';
};
