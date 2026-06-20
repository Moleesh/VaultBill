/** @format */

import type { Role } from '../../types/AppTypes';

type SecurityAccount = {
    readonly role: Role;
};

/** Returns the accounts visible to the current operator role. */
export const getManageableSecurityAccounts = <TAccount extends SecurityAccount>(
    accounts: readonly TAccount[],
    role: Role,
): readonly TAccount[] =>
    accounts.filter((account) =>
        role === 'SysAdmin' ? account.role !== 'SysAdmin' : account.role === 'User',
    );

/** Returns the operator creation guidance after a save completes. */
export const getOperatorCreationMessage = (role: Role): string =>
    role === 'Admin'
        ? 'Operator created. The admin can manage users after a password is set.'
        : 'Operator created. Set a password before enabling hosted web login.';

/** Returns whether the default system credentials still appear to be active. */
export const isDefaultCredentialsActive = (
    sysAdminUsesDefaultPassword?: boolean,
    backupUsesDefaultPassword?: boolean,
): boolean => sysAdminUsesDefaultPassword === true || backupUsesDefaultPassword === true;
