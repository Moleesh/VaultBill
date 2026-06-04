import { z } from 'zod';

export const ReportFilterSchema = z.object({
  FieldId: z.string().min(1),
  Type: z.enum(['DateRange']),
  Label: z.string().min(1),
});

export const ReportColumnSchema = z.object({
  ColumnId: z.string().min(1),
  Label: z.string().min(1),
  SourceField: z.string().min(1),
  Format: z.string().optional(),
});

export const ReportConfigSchema = z.object({
  ReportId: z.string().min(1),
  ReportName: z.string().min(1),
  Source: z.literal('Records'),
  FormatIds: z.array(z.string().min(1)),
  Filters: z.array(ReportFilterSchema),
  Columns: z.array(ReportColumnSchema).min(1),
  PrintTemplates: z.array(
    z.object({
      TemplateId: z.string().min(1),
      IsDefault: z.boolean(),
    }),
  ),
});

export type ReportConfig = z.infer<typeof ReportConfigSchema>;
export type ReportColumn = z.infer<typeof ReportColumnSchema>;

export type ReportFilterValues = Readonly<
  Record<string, { readonly from?: string; readonly to?: string }>
>;

export type ReportRow = {
  readonly recordId: string;
  readonly createdAt: string;
  readonly values: Readonly<Record<string, string>>;
};

export type ReportPage = {
  readonly rows: readonly ReportRow[];
  readonly totalMatchingRows: number;
  readonly nextCursor?: number;
  readonly isComplete: boolean;
};
