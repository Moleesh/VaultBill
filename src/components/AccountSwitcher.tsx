/** @format */

import type { FC } from 'react';

import type { OperatorAccount, OperatorContext } from '../features/auth/AccountTypes';

type AccountSwitcherProps = {
    readonly accounts: readonly OperatorAccount[];
    readonly operatorContext: OperatorContext;
    readonly onChange: (account: OperatorAccount) => void;
};

export const AccountSwitcher: FC<AccountSwitcherProps> = ({
    accounts,
    operatorContext,
    onChange,
}) => {
    const handleChange = (userId: string) => {
        const selectedAccount = accounts.find((account) => account.userId === userId);

        if (selectedAccount) {
            onChange(selectedAccount);
        }
    };

    return (
        <label className="account-switcher">
            <span>Operator</span>
            <select
                aria-label="Select operator account"
                value={operatorContext.account.userId}
                onChange={(event) => {
                    handleChange(event.currentTarget.value);
                }}
            >
                {accounts.map((account) => (
                    <option key={account.userId} value={account.userId}>
                        {account.displayName} ({account.role})
                    </option>
                ))}
            </select>
            <small>
                Acting as {operatorContext.CreatedByName} / {operatorContext.role}
            </small>
        </label>
    );
};
