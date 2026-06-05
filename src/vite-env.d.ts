/// <reference types="vite/client" />

declare const __APP_NAME__: string;
declare const __APP_SLUG__: string;

interface ImportMetaEnv {
  readonly VITE_WEB_ONLY?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}
