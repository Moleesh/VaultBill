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
        ? 'Operator added. The admin can start managing users after a password is set.'
        : 'Operator added. Set a password before turning on hosted sign-in.';

/** Returns whether the default system credentials still appear to be active. */
export const isDefaultCredentialsActive = (
    sysAdminUsesDefaultPassword?: boolean,
    backupUsesDefaultPassword?: boolean,
): boolean => sysAdminUsesDefaultPassword === true || backupUsesDefaultPassword === true;
