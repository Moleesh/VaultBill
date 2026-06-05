import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

import type { AdapterStatus } from '../index';

type Json = boolean | number | string | null | Json[] | { [key: string]: Json };

type VaultBillDocumentRow = {
  readonly id: string;
  readonly owner_id: string | null;
  readonly client_id: string | null;
  readonly document_type: string;
  readonly document_key: string;
  readonly payload: Json;
  readonly created_at: string;
  readonly updated_at: string;
};

type Database = {
  public: {
    Tables: {
      vaultbill_documents: {
        Row: VaultBillDocumentRow;
        Insert: {
          readonly owner_id?: string;
          readonly client_id?: string;
          readonly document_type: string;
          readonly document_key: string;
          readonly payload: Json;
          readonly updated_at?: string;
        };
        Update: {
          readonly payload?: Json;
          readonly updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

const JsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([
    z.boolean(),
    z.number(),
    z.string(),
    z.null(),
    z.array(JsonSchema),
    z.record(z.string(), JsonSchema),
  ]),
);

const getConfiguration = (): { readonly key: string; readonly url: string } | undefined => {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  return url && key ? { key, url } : undefined;
};

const configuration = getConfiguration();
const webClientIdStorageKey = 'vaultbill.web.client-id';
const getWebClientId = (): string => {
  const savedClientId = window.localStorage.getItem(webClientIdStorageKey);

  if (savedClientId) {
    return savedClientId;
  }

  const clientId = crypto.randomUUID();
  window.localStorage.setItem(webClientIdStorageKey, clientId);
  return clientId;
};
const webClientId = configuration ? getWebClientId() : undefined;
const client = configuration
  ? createClient<Database>(configuration.url, configuration.key, {
      auth: { persistSession: true },
      global: {
        headers: { 'x-vaultbill-client-id': webClientId ?? '' },
      },
    })
  : undefined;

const requireClient = () => {
  if (!client) {
    throw new Error('Supabase web storage is not configured.');
  }

  return client;
};

const requireWebClientId = (): string => {
  if (!webClientId) {
    throw new Error('Supabase browser identity is unavailable.');
  }

  return webClientId;
};

export const saveWebDocument = async (
  documentType: string,
  documentKey: string,
  payload: unknown,
): Promise<void> => {
  const webClient = requireClient();
  const clientId = requireWebClientId();
  const parsedPayload = JsonSchema.parse(payload);
  const { error } = await webClient.from('vaultbill_documents').upsert(
    {
      client_id: clientId,
      document_key: documentKey,
      document_type: documentType,
      payload: parsedPayload,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'client_id,document_type,document_key' },
  );

  if (error) {
    throw new Error(error.message);
  }
};

export const listWebDocuments = async (
  documentType: string,
): Promise<readonly VaultBillDocumentRow[]> => {
  const webClient = requireClient();
  const clientId = requireWebClientId();
  const { data, error } = await webClient
    .from('vaultbill_documents')
    .select('*')
    .eq('client_id', clientId)
    .eq('document_type', documentType)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const supabaseAdapterStatus: AdapterStatus = {
  mode: 'WebSupabase',
  isAvailable: import.meta.env.VITE_WEB_ONLY === 'true' && configuration !== undefined,
  message: configuration
    ? 'Supabase document storage is configured for the hosted web build.'
    : 'Supabase URL and public key are required for hosted web storage.',
};
