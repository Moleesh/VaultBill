/** @format */

export type KeyboardShortcut = {
    readonly actionId: string;
    readonly label: string;
    readonly keys: string;
    readonly description: string;
};

export const recordActionShortcuts: readonly KeyboardShortcut[] = [
    {
        actionId: 'draft',
        label: 'Draft',
        keys: 'Control+S',
        description: 'Save the current document as a draft.',
    },
    {
        actionId: 'draft-print',
        label: 'Draft print',
        keys: 'Control+Shift+P',
        description: 'Preview or print the current draft without finalizing.',
    },
    {
        actionId: 'finalize',
        label: 'Finalize',
        keys: 'Control+Enter',
        description: 'Finalize the current draft using the sequence workflow.',
    },
    {
        actionId: 'print',
        label: 'Print',
        keys: 'Control+P',
        description: 'Run the configured output profile for the finalized document.',
    },
    {
        actionId: 'reprint',
        label: 'Reprint',
        keys: 'Control+P',
        description: 'Reprint the selected read-only record.',
    },
];

export const getShortcutForAction = (actionId: string): KeyboardShortcut | undefined =>
    recordActionShortcuts.find((shortcut) => shortcut.actionId === actionId);
