-- Fumacinha - logo e banners no Supabase Storage
-- Execute no SQL Editor do projeto Supabase da Fumacinha.
-- Pode ser executado mais de uma vez sem apagar dados existentes.

alter table public."SITE_CONFIG"
add column if not exists logo_url text not null default '';

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

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Fumacinha imagens leitura publica'
  ) then
    create policy "Fumacinha imagens leitura publica"
    on storage.objects
    for select
    to anon, authenticated
    using (bucket_id = 'fumacinha-produtos');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Fumacinha imagens upload autenticado'
  ) then
    create policy "Fumacinha imagens upload autenticado"
    on storage.objects
    for insert
    to authenticated
    with check (
      bucket_id = 'fumacinha-produtos'
      and auth.uid() is not null
      and (storage.foldername(name))[1] in ('logo', 'banners', 'produtos')
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Fumacinha imagens atualizar autenticado'
  ) then
    create policy "Fumacinha imagens atualizar autenticado"
    on storage.objects
    for update
    to authenticated
    using (
      bucket_id = 'fumacinha-produtos'
      and auth.uid() is not null
      and (storage.foldername(name))[1] in ('logo', 'banners', 'produtos')
    )
    with check (
      bucket_id = 'fumacinha-produtos'
      and auth.uid() is not null
      and (storage.foldername(name))[1] in ('logo', 'banners', 'produtos')
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Fumacinha imagens remover autenticado'
  ) then
    create policy "Fumacinha imagens remover autenticado"
    on storage.objects
    for delete
    to authenticated
    using (
      bucket_id = 'fumacinha-produtos'
      and auth.uid() is not null
      and (storage.foldername(name))[1] in ('logo', 'banners', 'produtos')
    );
  end if;
end $$;
