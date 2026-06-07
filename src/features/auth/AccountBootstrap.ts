import type { AccountLimitValidation, OperatorAccount, OperatorContext } from './AccountTypes';

export const bootstrapOperatorAccounts: readonly OperatorAccount[] = [
  {
    userId: 'sysadmin_1',
    username: 'sysadmin',
    displayName: 'System Administrator',
    role: 'SysAdmin',
    isActive: true,
    passwordHash: '5e800c5e134b84a0d73bd6f0d0f65b768f8a3afeba9c26ce3fe9b8d58fd027f1',
    usesDefaultPassword: true,
  },
];

export const createOperatorContext = (account: OperatorAccount): OperatorContext => ({
  account,
  role: account.role,
  CreatedBy: account.userId,
  CreatedByName: account.displayName,
  LastActionBy: account.userId,
  LastActionByName: account.displayName,
});

export const validateAccountLimits = (
  accounts: readonly OperatorAccount[],
): AccountLimitValidation => {
  const activeAccounts = accounts.filter((account) => account.isActive);
  const activeSysAdmins = activeAccounts.filter((account) => account.role === 'SysAdmin');
  const activeAdmins = activeAccounts.filter((account) => account.role === 'Admin');
  const messages: string[] = [];

  if (activeSysAdmins.length > 1) {
    messages.push('Only one active SysAdmin account is allowed.');
  }

  if (activeAdmins.length > 1) {
    messages.push('Only one active Admin account is allowed.');
  }

  return {
    isValid: messages.length === 0,
    messages,
  };
};
