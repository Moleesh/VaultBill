const ensureTrailingSlash = (value: string): string => {
  const trimmedValue = value.trim();

  if (!trimmedValue || trimmedValue === '/') {
    return '/';
  }

  return trimmedValue.endsWith('/') ? trimmedValue : `${trimmedValue}/`;
};

export const getCanonicalBasePath = (): string =>
  ensureTrailingSlash(import.meta.env.BASE_URL);

export const shouldRedirectToBasePath = (
  pathname: string,
  basePath: string,
): boolean => {
  return ensureTrailingSlash(pathname) !== ensureTrailingSlash(basePath);
};

export const redirectToCanonicalBasePath = (): void => {
  if (!import.meta.env.PROD) {
    return;
  }

  const canonicalBasePath = getCanonicalBasePath();

  if (!shouldRedirectToBasePath(window.location.pathname, canonicalBasePath)) {
    return;
  }

  const targetUrl = new URL(canonicalBasePath, window.location.origin);
  window.location.replace(targetUrl.toString());
};
