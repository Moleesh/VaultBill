export const getRouterBaseName = (): string => {
  const basePath = import.meta.env.BASE_URL.replace(/\/+$/u, '');
  return basePath || '/';
};
