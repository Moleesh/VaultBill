import { hasCapability } from '../../engines/permissionEngine/PermissionEngine';
import type { OperatorContext } from '../auth/AccountTypes';
import type { DocumentRecord } from './DocumentRecordSchema';

export const canEditDraft = (record: DocumentRecord, operatorContext: OperatorContext): boolean =>
  record.Status === 'Draft' &&
  (record.CreatedBy === operatorContext.account.userId ||
    operatorContext.role === 'Admin' ||
    operatorContext.role === 'SysAdmin');

export const assertCanSaveDraft = (
  record: DocumentRecord | undefined,
  operatorContext: OperatorContext,
) => {
  if (!hasCapability(operatorContext.role, 'SaveDraft')) {
    throw new Error(`${operatorContext.role} cannot save drafts.`);
  }

  if (record && !canEditDraft(record, operatorContext)) {
    throw new Error('Only the draft creator, Admin, or SysAdmin can edit this draft.');
  }
};

export const assertCanFinalizeDraft = (
  record: DocumentRecord,
  operatorContext: OperatorContext,
) => {
  if (record.Status !== 'Draft') {
    throw new Error('Only draft records can be finalized.');
  }

  if (!hasCapability(operatorContext.role, 'SaveDraft')) {
    throw new Error(`${operatorContext.role} cannot finalize records.`);
  }
};

export const assertCanCancelFinalized = (
  record: DocumentRecord,
  operatorContext: OperatorContext,
  reason: string,
) => {
  if (!hasCapability(operatorContext.role, 'CancelFinalizedRecord')) {
    throw new Error('Only Admin can cancel finalized records.');
  }

  if (record.Status !== 'Finalized') {
    throw new Error('Only finalized records can be cancelled.');
  }

  if (!reason.trim()) {
    throw new Error('Cancellation reason is required.');
  }
};
