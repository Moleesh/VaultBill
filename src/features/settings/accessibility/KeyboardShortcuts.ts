export type KeyboardShortcut = {
  readonly actionId: string;
  readonly label: string;
  readonly keys: string;
  readonly description: string;
};

export const recordActionShortcuts: readonly KeyboardShortcut[] = [
  {
    actionId: 'save-draft',
    label: 'Save draft',
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
    actionId: 'download-pdf',
    label: 'Download PDF',
    keys: 'Control+Shift+D',
    description: 'Download the current printable document as PDF.',
  },
  {
    actionId: 'finalize',
    label: 'Finalize',
    keys: 'Control+Enter',
    description: 'Finalize the current draft using the sequence workflow.',
  },
];

export const getShortcutForAction = (actionId: string): KeyboardShortcut | undefined =>
  recordActionShortcuts.find((shortcut) => shortcut.actionId === actionId);
