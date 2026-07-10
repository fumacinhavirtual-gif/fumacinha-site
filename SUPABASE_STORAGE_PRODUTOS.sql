-- Fumacinha - Storage de imagens dos produtos
-- Execute no SQL Editor do Supabase da Fumacinha.

alter table public."PRODUTOS"
add column if not exists descricao text not null default '';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fumacinha-produtos',
  'fumacinha-produtos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Fumacinha produtos leitura publica" on storage.objects;
create policy "Fumacinha produtos leitura publica"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'fumacinha-produtos');

drop policy if exists "Fumacinha produtos upload autenticado" on storage.objects;
create policy "Fumacinha produtos upload autenticado"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'fumacinha-produtos'
  and owner = auth.uid()
);

drop policy if exists "Fumacinha produtos atualizar autenticado" on storage.objects;
create policy "Fumacinha produtos atualizar autenticado"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'fumacinha-produtos'
  and owner = auth.uid()
)
with check (
  bucket_id = 'fumacinha-produtos'
  and owner = auth.uid()
);

drop policy if exists "Fumacinha produtos remover autenticado" on storage.objects;
create policy "Fumacinha produtos remover autenticado"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'fumacinha-produtos'
  and owner = auth.uid()
);
