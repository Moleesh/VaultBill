/** @format */

import { z } from 'zod';

import type { SqliteConnection } from '../../db/sqlite/SqliteConnection';
import { bootstrapOperatorAccounts } from './AccountBootstrap';
import type { AccountBootstrapResult } from './AccountTypes';

const countRowSchema = z.object({ count: z.number() });

export const seedBootstrapAccountsIfNeeded = (
    connection: SqliteConnection,
    nowIso: string,
): AccountBootstrapResult => {
    const existingUsers = countRowSchema.parse(
        connection.get('SELECT COUNT(*) AS count FROM users;'),
    );

    if (existingUsers.count > 0) {
        return { seeded: false, createdAccountIds: [] };
    }

    const seededAccounts = bootstrapOperatorAccounts;

    for (const account of seededAccounts) {
        connection.run(
            `INSERT INTO users
        (user_id, username, display_name, role, pin_hash, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 1, ?, ?);`,
            [
                account.userId,
                account.username,
                account.displayName,
                account.role,
                account.passwordHash ?? null,
                nowIso,
                nowIso,
            ],
        );
    }

    return {
        seeded: true,
        createdAccountIds: seededAccounts.map((account) => account.userId),
    };
};
