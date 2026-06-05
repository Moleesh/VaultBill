create table public.vaultbill_documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  document_type text not null check (length(document_type) between 1 and 80),
  document_key text not null check (length(document_key) between 1 and 160),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, document_type, document_key)
);

create index vaultbill_documents_owner_type_updated_idx
  on public.vaultbill_documents (owner_id, document_type, updated_at desc);

alter table public.vaultbill_documents enable row level security;

create policy "VaultBill users read their documents"
  on public.vaultbill_documents
  for select
  to authenticated
  using ((select auth.uid()) = owner_id);

create policy "VaultBill users create their documents"
  on public.vaultbill_documents
  for insert
  to authenticated
  with check ((select auth.uid()) = owner_id);

create policy "VaultBill users update their documents"
  on public.vaultbill_documents
  for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "VaultBill users delete their documents"
  on public.vaultbill_documents
  for delete
  to authenticated
  using ((select auth.uid()) = owner_id);

grant select, insert, update, delete on public.vaultbill_documents to authenticated;
