/** @format */

export const getRouterBaseName = (): string => {
    if (import.meta.env.BASE_URL === './') return '/';
    const basePath = import.meta.env.BASE_URL.replace(/\/+$/u, '');
    return basePath || '/';
};
