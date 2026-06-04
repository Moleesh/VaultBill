export type BuildIdentity = {
  readonly appName: string;
  readonly appSlug: string;
};

export const getBuildIdentity = (): BuildIdentity => {
  const appName = process.env.APP_NAME?.trim() || 'VaultBill';
  const generatedSlug = appName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return {
    appName,
    appSlug: generatedSlug || 'vaultbill',
  };
};
