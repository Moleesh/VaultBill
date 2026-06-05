export const textEncoder = new TextEncoder();
export const textDecoder = new TextDecoder();

export const toBytes = (value: string): Uint8Array => textEncoder.encode(value);

export const fromBytes = (value: Uint8Array): string => textDecoder.decode(value);

export const encodeBase64 = (bytes: Uint8Array): string => btoa(String.fromCharCode(...bytes));

export const decodeBase64 = (value: string): Uint8Array =>
  Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

export const asBufferSource = (bytes: Uint8Array): BufferSource => bytes as unknown as BufferSource;
