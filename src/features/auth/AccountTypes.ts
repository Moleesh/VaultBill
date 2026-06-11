/** @format */

import type { Role } from '../../types/AppTypes';

export type OperatorAccount = {
    readonly userId: string;
    readonly username: string;
    readonly displayName: string;
    readonly role: Role;
    readonly isActive: boolean;
    readonly passwordHash?: string;
    readonly passwordConfigured?: boolean;
    readonly usesDefaultPassword?: boolean;
};

export type OperatorContext = {
    readonly account: OperatorAccount;
    readonly role: Role;
    readonly CreatedBy: string;
    readonly CreatedByName: string;
    readonly LastActionBy: string;
    readonly LastActionByName: string;
};

export type AccountLimitValidation = {
    readonly isValid: boolean;
    readonly messages: readonly string[];
};

export type AccountBootstrapResult = {
    readonly seeded: boolean;
    readonly createdAccountIds: readonly string[];
};
