import { createContext, useContext, useState } from 'react';
import type { FC, PropsWithChildren } from 'react';

import { useCapabilities } from '../../capability/CapabilityContext';
import { bootstrapOperatorAccounts, createOperatorContext } from './AccountBootstrap';
import type { OperatorAccount, OperatorContext } from './AccountTypes';

type SessionContextValue = {
  readonly accounts: readonly OperatorAccount[];
  readonly operatorContext: OperatorContext | undefined;
  readonly login: (userId: string) => void;
  readonly logout: () => void;
};

const sessionStorageKey = 'vaultbill.operator';
const accountStorageKey = 'vaultbill.accounts';
const SessionContext = createContext<SessionContextValue | undefined>(undefined);

const demoAccount: OperatorAccount = {
  userId: 'demo_user',
  username: 'demo',
  displayName: 'Demo User',
  role: 'User',
  isActive: true,
};

const readStoredAccounts = (): readonly OperatorAccount[] => {
  const rawAccounts = window.localStorage.getItem(accountStorageKey);

  if (!rawAccounts) {
    return bootstrapOperatorAccounts;
  }

  try {
    const parsedAccounts = JSON.parse(rawAccounts) as readonly OperatorAccount[];
    return parsedAccounts.length > 0 ? parsedAccounts : bootstrapOperatorAccounts;
  } catch {
    return bootstrapOperatorAccounts;
  }
};

export const SessionProvider: FC<PropsWithChildren> = ({ children }) => {
  const capabilities = useCapabilities();
  const accounts = capabilities.isDemoMode ? [demoAccount] : readStoredAccounts();
  const findAccount = (userId: string | null): OperatorAccount | undefined =>
    accounts.find((candidate) => candidate.userId === userId && candidate.isActive);
  const [account, setAccount] = useState<OperatorAccount | undefined>(() =>
    findAccount(window.localStorage.getItem(sessionStorageKey)),
  );

  const login = (userId: string) => {
    const selectedAccount = findAccount(userId);

    if (!selectedAccount) {
      throw new Error('The selected operator account is unavailable.');
    }

    window.localStorage.setItem(sessionStorageKey, selectedAccount.userId);
    setAccount(selectedAccount);
  };

  const logout = () => {
    window.localStorage.removeItem(sessionStorageKey);
    setAccount(undefined);
  };

  return (
    <SessionContext.Provider
      value={{
        accounts,
        operatorContext: account ? createOperatorContext(account) : undefined,
        login,
        logout,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextValue => {
  const session = useContext(SessionContext);

  if (!session) {
    throw new Error('SessionProvider is required.');
  }

  return session;
};
