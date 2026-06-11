/** @format */

import type { IndexDefinition } from './StartupTypes';

export const requiredIndexes: readonly IndexDefinition[] = [
    {
        indexName: 'ux_document_formats_single_default',
        createSql: `CREATE UNIQUE INDEX IF NOT EXISTS ux_document_formats_single_default
      ON document_formats(is_default)
      WHERE is_default = 1;`,
    },
    {
        indexName: 'ux_records_format_document_number',
        createSql: `CREATE UNIQUE INDEX IF NOT EXISTS ux_records_format_document_number
      ON records(format_id, document_number)
      WHERE document_number IS NOT NULL;`,
    },
    {
        indexName: 'ix_records_format_created',
        createSql: `CREATE INDEX IF NOT EXISTS ix_records_format_created
      ON records(format_id, created_at DESC);`,
    },
    {
        indexName: 'ix_records_status_created',
        createSql: `CREATE INDEX IF NOT EXISTS ix_records_status_created
      ON records(status, created_at DESC);`,
    },
    {
        indexName: 'ix_attachments_record',
        createSql: 'CREATE INDEX IF NOT EXISTS ix_attachments_record ON attachments(record_id);',
    },
    {
        indexName: 'ix_print_template_assets_template',
        createSql: `CREATE INDEX IF NOT EXISTS ix_print_template_assets_template
      ON print_template_assets(template_id);`,
    },
    {
        indexName: 'ux_print_template_asset_name',
        createSql: `CREATE UNIQUE INDEX IF NOT EXISTS ux_print_template_asset_name
      ON print_template_assets(template_id, asset_name);`,
    },
];
