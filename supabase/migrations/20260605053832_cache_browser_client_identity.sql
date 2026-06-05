create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create or replace function private.current_vaultbill_client_id()
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select current_setting('request.headers', true)::json ->> 'x-vaultbill-client-id'
$$;

revoke all on function private.current_vaultbill_client_id() from public;
grant execute on function private.current_vaultbill_client_id() to anon, authenticated;

alter policy "VaultBill browser clients read their documents"
  on public.vaultbill_documents
  using ((select private.current_vaultbill_client_id()) = client_id::text);

alter policy "VaultBill browser clients create their documents"
  on public.vaultbill_documents
  with check ((select private.current_vaultbill_client_id()) = client_id::text);

alter policy "VaultBill browser clients update their documents"
  on public.vaultbill_documents
  using ((select private.current_vaultbill_client_id()) = client_id::text)
  with check ((select private.current_vaultbill_client_id()) = client_id::text);

alter policy "VaultBill browser clients delete their documents"
  on public.vaultbill_documents
  using ((select private.current_vaultbill_client_id()) = client_id::text);
