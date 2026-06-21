/** @format */

import type { FC } from 'react';

import { SearchableDropdown } from './SearchableDropdown/SearchableDropdown';
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
        <SearchableDropdown
            label="Operator"
            note={`Acting as ${operatorContext.CreatedByName} / ${operatorContext.role}`}
            onChange={handleChange}
            options={accounts.map((account) => ({
                value: account.userId,
                label: account.displayName,
                description: account.role,
                keywords: [account.username, account.role],
            }))}
            value={operatorContext.account.userId}
            wrapperClassName="account-switcher"
        />
    );
};
