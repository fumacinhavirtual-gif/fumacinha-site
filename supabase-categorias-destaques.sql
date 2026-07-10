alter table public."PRODUTOS"
add column if not exists destaque_home boolean not null default false;

alter table public."PRODUTOS"
add column if not exists ocultar_home boolean not null default false;

create table if not exists public."CATEGORIAS" (
  id bigserial primary key,
  nome text not null unique,
  imagem text default '',
  ordem integer not null default 1,
  ativo_home boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public."CATEGORIAS" (nome, ordem, ativo_home)
select categoria, row_number() over (order by categoria), true
from (
  select distinct categoria
  from public."PRODUTOS"
  where categoria is not null and categoria <> ''
) categorias_existentes
on conflict (nome) do nothing;

alter table public."CATEGORIAS" enable row level security;

drop policy if exists "CATEGORIAS leitura publica" on public."CATEGORIAS";
create policy "CATEGORIAS leitura publica"
on public."CATEGORIAS"
for select
using (true);

drop policy if exists "CATEGORIAS inserir pelo site" on public."CATEGORIAS";
create policy "CATEGORIAS inserir pelo site"
on public."CATEGORIAS"
for insert
with check (true);

drop policy if exists "CATEGORIAS editar pelo site" on public."CATEGORIAS";
create policy "CATEGORIAS editar pelo site"
on public."CATEGORIAS"
for update
using (true)
with check (true);
