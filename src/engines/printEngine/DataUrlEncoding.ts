/** @format */

/** Base64 alphabet used for client-side asset encoding. */
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Encodes bytes into a Base64 string without relying on Node globals. */
export const encodeBase64 = (bytes: Uint8Array): string => {
    let output = '';

    for (let index = 0; index < bytes.length; index += 3) {
        const first = bytes[index] ?? 0;
        const second = bytes[index + 1] ?? 0;
        const third = bytes[index + 2] ?? 0;
        const combined = (first << 16) | (second << 8) | third;

        output += alphabet[(combined >> 18) & 63] ?? '';
        output += alphabet[(combined >> 12) & 63] ?? '';
        output += index + 1 < bytes.length ? (alphabet[(combined >> 6) & 63] ?? '') : '=';
        output += index + 2 < bytes.length ? (alphabet[combined & 63] ?? '') : '=';
    }

    return output;
};

/** Converts raw bytes into an embeddable data URL for print-template assets. */
export const createDataUrl = (mimeType: string, bytes: Uint8Array): string =>
    `data:${mimeType};base64,${encodeBase64(bytes)}`;
