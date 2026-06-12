/** @format */

/**
 * Describes the current print or report job shown in the records workspace.
 */
export type OutputTask = {
    readonly jobId: string;
    readonly title: string;
    readonly completed: number;
    readonly total: number;
    readonly message: string;
    readonly state: 'Running' | 'Complete' | 'Failed' | 'Cancelled';
};
