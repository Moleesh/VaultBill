import { createContext, useContext, useState } from 'react';
import type { FC, PropsWithChildren } from 'react';

import { bootstrapOperatorAccounts, createOperatorContext } from './AccountBootstrap';
import type { OperatorAccount, OperatorContext } from './AccountTypes';

type SessionContextValue = {
  readonly accounts: readonly OperatorAccount[];
  readonly operatorContext: OperatorContext | undefined;
  readonly login: (userId: string) => void;
  readonly logout: () => void;
};

const sessionStorageKey = 'vaultbill.operator';
const SessionContext = createContext<SessionContextValue | undefined>(undefined);

const findAccount = (userId: string | null): OperatorAccount | undefined =>
  bootstrapOperatorAccounts.find((account) => account.userId === userId && account.isActive);

export const SessionProvider: FC<PropsWithChildren> = ({ children }) => {
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
        accounts: bootstrapOperatorAccounts,
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
