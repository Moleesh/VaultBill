alter policy "VaultBill browser clients read their documents"
  on public.vaultbill_documents
  using (
    (select (current_setting('request.headers', true)::json ->> 'x-vaultbill-client-id'))
    = client_id::text
  );

alter policy "VaultBill browser clients create their documents"
  on public.vaultbill_documents
  with check (
    (select (current_setting('request.headers', true)::json ->> 'x-vaultbill-client-id'))
    = client_id::text
  );

alter policy "VaultBill browser clients update their documents"
  on public.vaultbill_documents
  using (
    (select (current_setting('request.headers', true)::json ->> 'x-vaultbill-client-id'))
    = client_id::text
  )
  with check (
    (select (current_setting('request.headers', true)::json ->> 'x-vaultbill-client-id'))
    = client_id::text
  );

alter policy "VaultBill browser clients delete their documents"
  on public.vaultbill_documents
  using (
    (select (current_setting('request.headers', true)::json ->> 'x-vaultbill-client-id'))
    = client_id::text
  );
