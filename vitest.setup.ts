import '@testing-library/jest-dom/vitest';

const testWindow = Reflect.get(globalThis, 'window') as Window | undefined;

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
