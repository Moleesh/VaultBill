import type { AdapterStatus } from '../index';

export const supabaseAdapterStatus: AdapterStatus = {
  mode: 'WebSupabase',
  isAvailable: false,
  message: 'Supabase access is reserved for web/demo deployment.',
};
