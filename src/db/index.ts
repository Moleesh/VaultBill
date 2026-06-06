export type DataMode = 'DesktopSQLite' | 'LanLocalApi' | 'WebDemo';

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
    mode: 'WebDemo',
    isAvailable: import.meta.env.VITE_DEMO_MODE === 'true',
    message:
      import.meta.env.VITE_DEMO_MODE === 'true'
        ? 'Browser storage is available in the demo build.'
        : 'Browser storage is available only in demo mode.',
  },
];
