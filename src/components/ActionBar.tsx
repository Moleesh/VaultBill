import type { FC } from 'react';

import { hasCapability } from '../engines/permissionEngine/PermissionEngine';
import { getShortcutForAction } from '../features/settings/accessibility/KeyboardShortcuts';
import type { Role } from '../types/AppTypes';

type ActionBarProps = {
  readonly role: Role;
  readonly onAction?: ((actionId: string) => void) | undefined;
};

export const ActionBar: FC<ActionBarProps> = ({ onAction, role }) => {
  const canSaveDraft = hasCapability(role, 'SaveDraft');
  const canDraftPrint = hasCapability(role, 'DraftPrint');
  const canFinalPrint = hasCapability(role, 'FinalPrintReprint');

  return (
    <div className="action-bar" role="region" aria-label="Record actions">
      <ActionButton actionId="save-draft" disabled={!canSaveDraft} onAction={onAction} />
      <ActionButton actionId="draft-print" disabled={!canDraftPrint} onAction={onAction} />
      <ActionButton actionId="download-pdf" disabled={!canFinalPrint} onAction={onAction} />
      <ActionButton
        actionId="finalize"
        className="action-bar__primary"
        disabled={!canFinalPrint}
        onAction={onAction}
      />
    </div>
  );
};

type ActionButtonProps = {
  readonly actionId: string;
  readonly className?: string;
  readonly disabled: boolean;
  readonly onAction?: ((actionId: string) => void) | undefined;
};

const ActionButton: FC<ActionButtonProps> = ({ actionId, className, disabled, onAction }) => {
  const shortcut = getShortcutForAction(actionId);

  if (!shortcut) {
    return null;
  }

  return (
    <button
      aria-keyshortcuts={shortcut.keys}
      className={className}
      disabled={disabled}
      onClick={() => onAction?.(actionId)}
      title={`${shortcut.description} Shortcut: ${shortcut.keys}`}
      type="button"
    >
      <span>{shortcut.label}</span>
      <kbd>{shortcut.keys}</kbd>
    </button>
  );
};
