alter table public.vaultbill_documents
  alter column owner_id drop not null,
  add column client_id uuid;

alter table public.vaultbill_documents
  add constraint vaultbill_documents_owner_check
  check (num_nonnulls(owner_id, client_id) = 1),
  add constraint vaultbill_documents_client_key_unique
  unique (client_id, document_type, document_key);

create index vaultbill_documents_client_type_updated_idx
  on public.vaultbill_documents (client_id, document_type, updated_at desc)
  where client_id is not null;

create policy "VaultBill browser clients read their documents"
  on public.vaultbill_documents
  for select
  to anon
  using (
    client_id::text =
    (select current_setting('request.headers', true)::json ->> 'x-vaultbill-client-id')
  );

create policy "VaultBill browser clients create their documents"
  on public.vaultbill_documents
  for insert
  to anon
  with check (
    client_id::text =
    (select current_setting('request.headers', true)::json ->> 'x-vaultbill-client-id')
  );

create policy "VaultBill browser clients update their documents"
  on public.vaultbill_documents
  for update
  to anon
  using (
    client_id::text =
    (select current_setting('request.headers', true)::json ->> 'x-vaultbill-client-id')
  )
  with check (
    client_id::text =
    (select current_setting('request.headers', true)::json ->> 'x-vaultbill-client-id')
  );

create policy "VaultBill browser clients delete their documents"
  on public.vaultbill_documents
  for delete
  to anon
  using (
    client_id::text =
    (select current_setting('request.headers', true)::json ->> 'x-vaultbill-client-id')
  );

grant select, insert, update, delete on public.vaultbill_documents to anon;
