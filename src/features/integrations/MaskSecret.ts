export const maskSecret = (secret: string): string => {
  if (!secret) {
    return '';
  }

  return secret.length <= 4 ? '****' : `****${secret.slice(-4)}`;
};
