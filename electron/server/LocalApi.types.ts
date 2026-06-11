/** @format */

export type LocalApiCapability =
    | 'AccountContext'
    | 'DocumentFormats'
    | 'Records'
    | 'PrintPreview'
    | 'Reports'
    | 'BulkImport'
    | 'BackupCapability';

export type LocalApiHealth = {
    readonly appName: string;
    readonly capabilities: readonly LocalApiCapability[];
    readonly status: 'Ready';
    readonly passwordRequired: boolean;
};

export type LocalApiErrorResponse = {
    readonly ok: false;
    readonly error: string;
};

export type LocalApiSuccessResponse<T> = {
    readonly ok: true;
    readonly data: T;
};

export type LocalApiResponse<T> = LocalApiSuccessResponse<T> | LocalApiErrorResponse;
