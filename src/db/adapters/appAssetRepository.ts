/** @format */

import { z } from 'zod';

import type { SqliteConnection } from '../sqlite/SqliteConnection';

export type AppAsset = {
    readonly assetId: string;
    readonly assetName: string;
    readonly mimeType: string;
    readonly assetBlob: Uint8Array;
    readonly sizeBytes: number;
    readonly createdAt: string;
};

const appAssetRowSchema = z.object({
    asset_id: z.string(),
    asset_name: z.string(),
    mime_type: z.string(),
    asset_blob: z
        .custom<ArrayBufferView>((value): value is ArrayBufferView => ArrayBuffer.isView(value))
        .transform((value) => new Uint8Array(value.buffer, value.byteOffset, value.byteLength)),
    size_bytes: z.number(),
    created_at: z.string(),
});

export const saveAppAsset = (connection: SqliteConnection, asset: AppAsset) => {
    const existing = connection.get('SELECT asset_id FROM app_assets WHERE asset_id = ?;', [
        asset.assetId,
    ]);
    const parameters = [
        asset.assetName,
        asset.mimeType,
        asset.assetBlob,
        asset.sizeBytes,
        asset.createdAt,
        asset.assetId,
    ];

    if (existing) {
        connection.run(
            `UPDATE app_assets
        SET asset_name = ?, mime_type = ?, asset_blob = ?, size_bytes = ?,
          created_at = ?
        WHERE asset_id = ?;`,
            parameters,
        );
        return;
    }

    connection.run(
        `INSERT INTO app_assets
      (asset_name, mime_type, asset_blob, size_bytes, created_at, asset_id)
      VALUES (?, ?, ?, ?, ?, ?);`,
        parameters,
    );
};

export const loadAppAsset = (
    connection: SqliteConnection,
    assetId: string,
): AppAsset | undefined => {
    const row = connection.get(
        `SELECT asset_id, asset_name, mime_type, asset_blob, size_bytes, created_at
      FROM app_assets
      WHERE asset_id = ?;`,
        [assetId],
    );

    return row ? parseAppAssetRow(row) : undefined;
};

const parseAppAssetRow = (row: unknown): AppAsset => {
    const parsed = appAssetRowSchema.parse(row);

    return {
        assetId: parsed.asset_id,
        assetName: parsed.asset_name,
        mimeType: parsed.mime_type,
        assetBlob: parsed.asset_blob,
        sizeBytes: parsed.size_bytes,
        createdAt: parsed.created_at,
    };
};
