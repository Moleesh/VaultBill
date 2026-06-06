/// <reference types="vite/client" />

declare const __APP_NAME__: string;
declare const __APP_SLUG__: string;

interface ImportMetaEnv {
  readonly VITE_DEMO_MODE?: string;
}
