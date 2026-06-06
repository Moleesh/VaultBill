export type BuildIdentity = {
  readonly appName: string;
  readonly appSlug: string;
};

export const getBuildIdentity = (): BuildIdentity => {
  return {
    appName: 'VaultBill',
    appSlug: 'vaultbill',
  };
};
