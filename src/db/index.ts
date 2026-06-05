export type DataMode = 'DesktopSQLite' | 'LanLocalApi' | 'WebSupabase';

export type AdapterStatus = {
  readonly mode: DataMode;
  readonly isAvailable: boolean;
  readonly message: string;
};

export const getAdapterStatus = (): readonly AdapterStatus[] => [
  {
    mode: 'DesktopSQLite',
    isAvailable: true,
    message: 'SQLite startup checks are available for desktop mode.',
  },
  {
    mode: 'LanLocalApi',
    isAvailable: true,
    message: 'Local API access is available when the desktop host enables LAN access.',
  },
  {
    mode: 'WebSupabase',
    isAvailable:
      import.meta.env.VITE_WEB_ONLY === 'true' &&
      Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY),
    message:
      import.meta.env.VITE_WEB_ONLY === 'true'
        ? 'Supabase document storage is used by the hosted web/demo build.'
        : 'Supabase storage is disabled outside the hosted web/demo build.',
  },
];
