-- Fumacinha - SQL completo para Supabase
-- Execute este arquivo no Supabase SQL Editor antes de publicar o site.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public."PRODUTOS" (
  id bigserial primary key,
  nome text not null,
  preco numeric(12, 2) not null default 0 check (preco >= 0),
  pix numeric(12, 2) not null default 0 check (pix >= 0),
  imagem text not null default '',
  descricao text not null default '',
  categoria text not null default 'Produtos',
  estoque integer not null default 0 check (estoque >= 0),
  ativo boolean not null default true,
  destaque_home boolean not null default false,
  ocultar_home boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public."PRODUTOS" add column if not exists estoque integer not null default 0;
alter table public."PRODUTOS" add column if not exists ativo boolean not null default true;
alter table public."PRODUTOS" add column if not exists destaque_home boolean not null default false;
alter table public."PRODUTOS" add column if not exists ocultar_home boolean not null default false;
alter table public."PRODUTOS" add column if not exists descricao text not null default '';
alter table public."PRODUTOS" add column if not exists created_at timestamptz not null default now();
alter table public."PRODUTOS" add column if not exists updated_at timestamptz not null default now();

create table if not exists public."CATEGORIAS" (
  id bigserial primary key,
  nome text not null unique,
  imagem text not null default '',
  ordem integer not null default 1,
  ativo_home boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public."BANNERS_HOME" (
  id bigserial primary key,
  imagem text not null default '',
  titulo text not null default '',
  subtitulo text not null default '',
  link text not null default '',
  ordem integer not null default 1,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public."SITE_CONFIG" (
  id integer primary key default 1,
  titulo_principal text not null default 'Fumacinha',
  subtitulo text not null default 'Loja Fumacinha com produtos separados, estoque proprio e atendimento pelo WhatsApp.',
  banners text not null default '',
  textos_pagina_inicial text not null default '',
  whatsapp text not null default '62991877597',
  entrega text not null default 'Para todo o Brasil',
  pix text not null default 'Preço especial à vista',
  parcelamento text not null default 'Em até 10x sem juros',
  carrossel_ativo boolean not null default false,
  carrossel_intervalo integer not null default 5 check (carrossel_intervalo >= 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_config_single_row check (id = 1)
);

alter table public."SITE_CONFIG" add column if not exists carrossel_ativo boolean not null default false;
alter table public."SITE_CONFIG" add column if not exists carrossel_intervalo integer not null default 5;
alter table public."SITE_CONFIG" add column if not exists created_at timestamptz not null default now();
alter table public."SITE_CONFIG" add column if not exists updated_at timestamptz not null default now();

create table if not exists public."VENDAS" (
  id bigserial primary key,
  produto_id text not null,
  nome_produto text not null,
  quantidade integer not null check (quantidade > 0),
  valor_unitario numeric(12, 2) not null check (valor_unitario >= 0),
  valor_total numeric(12, 2) not null check (valor_total >= 0),
  custo_unitario numeric(12, 2) not null default 0 check (custo_unitario >= 0),
  custo_total numeric(12, 2) not null default 0 check (custo_total >= 0),
  data_venda timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public."VENDAS" add column if not exists custo_unitario numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists custo_total numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists updated_at timestamptz not null default now();

insert into public."SITE_CONFIG" (
  id,
  titulo_principal,
  subtitulo,
  banners,
  textos_pagina_inicial,
  whatsapp,
  entrega,
  pix,
  parcelamento,
  carrossel_ativo,
  carrossel_intervalo
) values (
  1,
  'Fumacinha',
  'Loja Fumacinha com produtos separados, estoque proprio e atendimento pelo WhatsApp.',
  '',
  '',
  '62991877597',
  'Para todo o Brasil',
  'Preço especial à vista',
  'Em até 10x sem juros',
  false,
  5
) on conflict (id) do nothing;

insert into public."CATEGORIAS" (nome, ordem, ativo_home)
select categoria, row_number() over (order by categoria), true
from (
  select distinct categoria
  from public."PRODUTOS"
  where categoria is not null and categoria <> ''
) categorias_existentes
on conflict (nome) do nothing;

update public."PRODUTOS"
set ativo = false
where estoque <= 0;

drop trigger if exists produtos_set_updated_at on public."PRODUTOS";
create trigger produtos_set_updated_at
before update on public."PRODUTOS"
for each row execute function public.set_updated_at();

drop trigger if exists categorias_set_updated_at on public."CATEGORIAS";
create trigger categorias_set_updated_at
before update on public."CATEGORIAS"
for each row execute function public.set_updated_at();

drop trigger if exists banners_home_set_updated_at on public."BANNERS_HOME";
create trigger banners_home_set_updated_at
before update on public."BANNERS_HOME"
for each row execute function public.set_updated_at();

drop trigger if exists site_config_set_updated_at on public."SITE_CONFIG";
create trigger site_config_set_updated_at
before update on public."SITE_CONFIG"
for each row execute function public.set_updated_at();

drop trigger if exists vendas_set_updated_at on public."VENDAS";
create trigger vendas_set_updated_at
before update on public."VENDAS"
for each row execute function public.set_updated_at();

alter table public."PRODUTOS" enable row level security;
alter table public."CATEGORIAS" enable row level security;
alter table public."BANNERS_HOME" enable row level security;
alter table public."SITE_CONFIG" enable row level security;
alter table public."VENDAS" enable row level security;

alter table public."PRODUTOS" force row level security;
alter table public."CATEGORIAS" force row level security;
alter table public."BANNERS_HOME" force row level security;
alter table public."SITE_CONFIG" force row level security;
alter table public."VENDAS" force row level security;

-- Remove politicas antigas abertas, se existirem.
drop policy if exists "PRODUTOS leitura publica" on public."PRODUTOS";
drop policy if exists "PRODUTOS inserir pelo site" on public."PRODUTOS";
drop policy if exists "PRODUTOS editar pelo site" on public."PRODUTOS";
drop policy if exists "PRODUTOS excluir pelo site" on public."PRODUTOS";
drop policy if exists "CATEGORIAS leitura publica" on public."CATEGORIAS";
drop policy if exists "CATEGORIAS inserir pelo site" on public."CATEGORIAS";
drop policy if exists "CATEGORIAS editar pelo site" on public."CATEGORIAS";
drop policy if exists "CATEGORIAS excluir pelo site" on public."CATEGORIAS";
drop policy if exists "BANNERS_HOME leitura publica" on public."BANNERS_HOME";
drop policy if exists "BANNERS_HOME inserir pelo site" on public."BANNERS_HOME";
drop policy if exists "BANNERS_HOME editar pelo site" on public."BANNERS_HOME";
drop policy if exists "BANNERS_HOME excluir pelo site" on public."BANNERS_HOME";
drop policy if exists "SITE_CONFIG leitura publica" on public."SITE_CONFIG";
drop policy if exists "SITE_CONFIG inserir pelo site" on public."SITE_CONFIG";
drop policy if exists "SITE_CONFIG editar pelo site" on public."SITE_CONFIG";
drop policy if exists "VENDAS leitura pelo site" on public."VENDAS";
drop policy if exists "VENDAS inserir pelo site" on public."VENDAS";
drop policy if exists "VENDAS editar pelo site" on public."VENDAS";
drop policy if exists "VENDAS excluir pelo site" on public."VENDAS";
drop policy if exists "PRODUTOS leitura publica disponiveis" on public."PRODUTOS";
drop policy if exists "CATEGORIAS leitura publica ativas" on public."CATEGORIAS";
drop policy if exists "BANNERS_HOME leitura publica ativos" on public."BANNERS_HOME";
drop policy if exists "PRODUTOS leitura autenticada" on public."PRODUTOS";
drop policy if exists "CATEGORIAS leitura autenticada" on public."CATEGORIAS";
drop policy if exists "BANNERS_HOME leitura autenticada" on public."BANNERS_HOME";
drop policy if exists "SITE_CONFIG leitura autenticada" on public."SITE_CONFIG";
drop policy if exists "VENDAS leitura autenticada" on public."VENDAS";
drop policy if exists "PRODUTOS inserir autenticado" on public."PRODUTOS";
drop policy if exists "PRODUTOS editar autenticado" on public."PRODUTOS";
drop policy if exists "PRODUTOS excluir autenticado" on public."PRODUTOS";
drop policy if exists "CATEGORIAS inserir autenticado" on public."CATEGORIAS";
drop policy if exists "CATEGORIAS editar autenticado" on public."CATEGORIAS";
drop policy if exists "CATEGORIAS excluir autenticado" on public."CATEGORIAS";
drop policy if exists "BANNERS_HOME inserir autenticado" on public."BANNERS_HOME";
drop policy if exists "BANNERS_HOME editar autenticado" on public."BANNERS_HOME";
drop policy if exists "BANNERS_HOME excluir autenticado" on public."BANNERS_HOME";
drop policy if exists "SITE_CONFIG inserir autenticado" on public."SITE_CONFIG";
drop policy if exists "SITE_CONFIG editar autenticado" on public."SITE_CONFIG";
drop policy if exists "VENDAS inserir autenticado" on public."VENDAS";
drop policy if exists "VENDAS editar autenticado" on public."VENDAS";
drop policy if exists "VENDAS excluir autenticado" on public."VENDAS";

-- Leitura publica: somente dados necessarios para o cliente comum.
create policy "PRODUTOS leitura publica disponiveis"
on public."PRODUTOS"
for select
to anon
using (ativo = true and estoque > 0);

create policy "CATEGORIAS leitura publica ativas"
on public."CATEGORIAS"
for select
to anon
using (ativo_home = true);

create policy "BANNERS_HOME leitura publica ativos"
on public."BANNERS_HOME"
for select
to anon
using (ativo = true);

create policy "SITE_CONFIG leitura publica"
on public."SITE_CONFIG"
for select
to anon
using (id = 1);

-- Usuario autenticado pode ler tudo nos paineis internos.
create policy "PRODUTOS leitura autenticada"
on public."PRODUTOS"
for select
to authenticated
using (true);

create policy "CATEGORIAS leitura autenticada"
on public."CATEGORIAS"
for select
to authenticated
using (true);

create policy "BANNERS_HOME leitura autenticada"
on public."BANNERS_HOME"
for select
to authenticated
using (true);

create policy "SITE_CONFIG leitura autenticada"
on public."SITE_CONFIG"
for select
to authenticated
using (true);

create policy "VENDAS leitura autenticada"
on public."VENDAS"
for select
to authenticated
using (true);

-- Escrita: apenas usuarios logados no Supabase Auth.
create policy "PRODUTOS inserir autenticado"
on public."PRODUTOS"
for insert
to authenticated
with check (true);

create policy "PRODUTOS editar autenticado"
on public."PRODUTOS"
for update
to authenticated
using (true)
with check (true);

create policy "PRODUTOS excluir autenticado"
on public."PRODUTOS"
for delete
to authenticated
using (true);

create policy "CATEGORIAS inserir autenticado"
on public."CATEGORIAS"
for insert
to authenticated
with check (true);

create policy "CATEGORIAS editar autenticado"
on public."CATEGORIAS"
for update
to authenticated
using (true)
with check (true);

create policy "CATEGORIAS excluir autenticado"
on public."CATEGORIAS"
for delete
to authenticated
using (true);

create policy "BANNERS_HOME inserir autenticado"
on public."BANNERS_HOME"
for insert
to authenticated
with check (true);

create policy "BANNERS_HOME editar autenticado"
on public."BANNERS_HOME"
for update
to authenticated
using (true)
with check (true);

create policy "BANNERS_HOME excluir autenticado"
on public."BANNERS_HOME"
for delete
to authenticated
using (true);

create policy "SITE_CONFIG inserir autenticado"
on public."SITE_CONFIG"
for insert
to authenticated
with check (id = 1);

create policy "SITE_CONFIG editar autenticado"
on public."SITE_CONFIG"
for update
to authenticated
using (id = 1)
with check (id = 1);

create policy "VENDAS inserir autenticado"
on public."VENDAS"
for insert
to authenticated
with check (true);

create policy "VENDAS editar autenticado"
on public."VENDAS"
for update
to authenticated
using (true)
with check (true);

create policy "VENDAS excluir autenticado"
on public."VENDAS"
for delete
to authenticated
using (true);

