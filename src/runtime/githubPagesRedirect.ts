/** @format */

const ensureTrailingSlash = (value: string): string => {
    const trimmedValue = value.trim();

    if (!trimmedValue || trimmedValue === '/') {
        return '/';
    }

    return trimmedValue.endsWith('/') ? trimmedValue : `${trimmedValue}/`;
};

export const getCanonicalBasePath = (): string => ensureTrailingSlash(import.meta.env.BASE_URL);

export const restoreGithubPagesRoute = (): void => {
    const route = new URLSearchParams(window.location.search).get('route');

    if (!route?.startsWith('/')) {
        return;
    }

    const basePath = getCanonicalBasePath().replace(/\/$/u, '');
    window.history.replaceState(null, '', `${basePath}${route}`);
};
