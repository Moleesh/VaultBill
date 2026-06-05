export type BuildIdentity = {
  readonly appName: string;
  readonly appSlug: string;
};

export const getBuildIdentity = (): BuildIdentity => {
  const requestedAppName = process.env.APP_NAME?.trim();
  const appName =
    requestedAppName === undefined || requestedAppName.length === 0
      ? 'VaultBill'
      : requestedAppName;
  const generatedSlug = appName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return {
    appName,
    appSlug: generatedSlug.length === 0 ? 'vaultbill' : generatedSlug,
  };
};
