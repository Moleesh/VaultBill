const blockedTagPattern = /<\s*\/?\s*(script|iframe|object|embed|form|meta|link)\b/i;
const eventHandlerPattern = /\son[a-z]+\s*=/i;
const disallowedUrlAttributePattern =
  /\b(?:src|href)\s*=\s*["']?\s*(?:javascript:|https?:\/\/|\/\/|data:|file:)/i;
const externalCssUrlPattern = /(?:@import\s+|url\s*\(\s*["']?\s*(?:https?:\/\/|\/\/|data:|file:))/i;

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

  if (externalCssUrlPattern.test(templateHtml)) {
    throw new Error('Print template CSS cannot load external resources.');
  }

  return templateHtml;
};
