/** @format */

/** Common backup response shape shared by the backup section controls. */
export type BackupResult = {
    readonly success: boolean;
    readonly warning?: string;
    readonly recoveryKey?: string;
    readonly filePath?: string;
};
