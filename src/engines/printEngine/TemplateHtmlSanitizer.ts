const blockedTagPattern = /<\s*\/?\s*(script|iframe|object|embed|form|meta|link)\b/i;
const eventHandlerPattern = /\son[a-z]+\s*=/i;
const disallowedUrlAttributePattern =
  /\b(?:src|href)\s*=\s*["']?\s*(?:javascript:|https?:\/\/|\/\/|data:|file:)/i;
const cssUrlPattern = /url\s*\(\s*["']?([^"')]+)["']?\s*\)/giu;
const allowedCssDataUrlPattern = /^data:image\/(?:png|jpeg|gif|webp);base64,[a-z0-9+/=]+$/i;
const allowedAssetPlaceholderPattern = /^\{\{Asset\.[A-Za-z0-9_.-]+\}\}$/;

export const sanitizeTemplateHtml = (templateHtml: string): string => {
  if (!templateHtml.trim()) {
    throw new Error('Print template HTML is required.');
  }

  if (blockedTagPattern.test(templateHtml)) {
    throw new Error('Print template HTML cannot contain blocked HTML tags.');
  }

  if (eventHandlerPattern.test(templateHtml)) {
    throw new Error('Print template HTML cannot contain inline event handlers.');
  }

  if (disallowedUrlAttributePattern.test(templateHtml)) {
    throw new Error('Print template HTML cannot contain external assets.');
  }

  if (/@import\s+/iu.test(templateHtml)) {
    throw new Error('Print template CSS cannot load external resources.');
  }

  for (const match of templateHtml.matchAll(cssUrlPattern)) {
    const url = match[1]?.trim() ?? '';
    if (!allowedAssetPlaceholderPattern.test(url) && !allowedCssDataUrlPattern.test(url)) {
      throw new Error('Print template CSS contains an unapproved URL.');
    }
  }

  return templateHtml;
};
