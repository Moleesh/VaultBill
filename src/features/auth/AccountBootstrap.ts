import type {
  AccountLimitValidation,
  OperatorAccount,
  OperatorContext,
} from './AccountTypes';

export const bootstrapOperatorAccounts: readonly OperatorAccount[] = [
  {
    userId: 'sysadmin_1',
    username: 'sysadmin',
    displayName: 'System Administrator',
    role: 'SysAdmin',
    isActive: true,
  },
  {
    userId: 'admin_1',
    username: 'admin',
    displayName: 'Operations Admin',
    role: 'Admin',
    isActive: true,
  },
  {
    userId: 'user_1',
    username: 'operator',
    displayName: 'Counter Operator',
    role: 'User',
    isActive: true,
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
  const activeSysAdmins = activeAccounts.filter(
    (account) => account.role === 'SysAdmin',
  );
  const activeAdmins = activeAccounts.filter((account) => account.role === 'Admin');
  const activeUsers = activeAccounts.filter((account) => account.role === 'User');
  const messages: string[] = [];

  if (activeSysAdmins.length > 1) {
    messages.push('Only one active SysAdmin account is allowed.');
  }

  if (activeAdmins.length > 1) {
    messages.push('Only one active Admin account is allowed.');
  }

  if (activeUsers.length > 5) {
    messages.push('Only five active User accounts are allowed.');
  }

  return {
    isValid: messages.length === 0,
    messages,
  };
};
