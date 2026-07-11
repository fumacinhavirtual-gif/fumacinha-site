-- Fumacinha - Beneficios da Loja
-- Execute no SQL Editor do projeto Supabase da Fumacinha.
-- Pode ser executado mais de uma vez sem apagar dados existentes.

create table if not exists public."BENEFICIOS_LOJA" (
  id bigserial primary key,
  titulo text not null default '',
  subtitulo text not null default '',
  icone text not null default 'truck',
  imagem text not null default '',
  ordem integer not null default 1,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public."BENEFICIOS_LOJA" enable row level security;
alter table public."BENEFICIOS_LOJA" force row level security;

drop policy if exists "BENEFICIOS_LOJA leitura publica" on public."BENEFICIOS_LOJA";
create policy "BENEFICIOS_LOJA leitura publica"
on public."BENEFICIOS_LOJA"
for select
to anon
using (ativo = true);

drop policy if exists "BENEFICIOS_LOJA leitura autenticada" on public."BENEFICIOS_LOJA";
create policy "BENEFICIOS_LOJA leitura autenticada"
on public."BENEFICIOS_LOJA"
for select
to authenticated
using (true);

drop policy if exists "BENEFICIOS_LOJA inserir autenticado" on public."BENEFICIOS_LOJA";
create policy "BENEFICIOS_LOJA inserir autenticado"
on public."BENEFICIOS_LOJA"
for insert
to authenticated
with check (true);

drop policy if exists "BENEFICIOS_LOJA editar autenticado" on public."BENEFICIOS_LOJA";
create policy "BENEFICIOS_LOJA editar autenticado"
on public."BENEFICIOS_LOJA"
for update
to authenticated
using (true)
with check (true);

drop policy if exists "BENEFICIOS_LOJA excluir autenticado" on public."BENEFICIOS_LOJA";
create policy "BENEFICIOS_LOJA excluir autenticado"
on public."BENEFICIOS_LOJA"
for delete
to authenticated
using (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fumacinha-produtos',
  'fumacinha-produtos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Fumacinha beneficios imagens leitura publica" on storage.objects;
create policy "Fumacinha beneficios imagens leitura publica"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'fumacinha-produtos');

drop policy if exists "Fumacinha beneficios imagens upload autenticado" on storage.objects;
create policy "Fumacinha beneficios imagens upload autenticado"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'fumacinha-produtos'
  and auth.uid() is not null
  and (storage.foldername(name))[1] in ('beneficios', 'logo', 'banners', 'produtos')
);

drop policy if exists "Fumacinha beneficios imagens atualizar autenticado" on storage.objects;
create policy "Fumacinha beneficios imagens atualizar autenticado"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'fumacinha-produtos'
  and auth.uid() is not null
  and (storage.foldername(name))[1] in ('beneficios', 'logo', 'banners', 'produtos')
)
with check (
  bucket_id = 'fumacinha-produtos'
  and auth.uid() is not null
  and (storage.foldername(name))[1] in ('beneficios', 'logo', 'banners', 'produtos')
);

drop policy if exists "Fumacinha beneficios imagens remover autenticado" on storage.objects;
create policy "Fumacinha beneficios imagens remover autenticado"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'fumacinha-produtos'
  and auth.uid() is not null
  and (storage.foldername(name))[1] in ('beneficios', 'logo', 'banners', 'produtos')
);
