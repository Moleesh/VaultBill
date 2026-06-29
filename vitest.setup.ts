/** @format */

import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach } from 'vitest';

const testWindow = Reflect.get(globalThis, 'window') as Window | undefined;

const actWarningPattern = /not wrapped in act/iu;
const originalConsoleError = console.error;

beforeEach(() => {
    console.error = (...args: unknown[]) => {
        const text = args.map((part) => (typeof part === 'string' ? part : String(part))).join(' ');

        if (actWarningPattern.test(text)) {
            throw new Error(text);
        }

        originalConsoleError(...args);
    };
});

afterEach(() => {
    console.error = originalConsoleError;
});

if (testWindow) {
    Object.defineProperty(testWindow, 'matchMedia', {
        writable: true,
        value: (query: string): MediaQueryList => ({
            matches: false,
            media: query,
            onchange: null,
            addEventListener: () => undefined,
            removeEventListener: () => undefined,
            addListener: () => undefined,
            removeListener: () => undefined,
            dispatchEvent: () => false,
        }),
    });
}
