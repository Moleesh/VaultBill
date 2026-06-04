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
    isAvailable: false,
    message: 'Local API adapter starts in Phase 16.',
  },
  {
    mode: 'WebSupabase',
    isAvailable: false,
    message: 'Supabase adapter is reserved for web/demo mode.',
  },
];
