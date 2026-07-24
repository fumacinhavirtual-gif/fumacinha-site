-- Fumacinha - custo automatico por modelo/grupo de produtos
-- Execute no SQL Editor do Supabase antes de usar a funcao no painel.

create extension if not exists "pgcrypto";

create table if not exists public."GRUPOS_CUSTO" (
  id uuid primary key default gen_random_uuid(),
  nome_modelo text not null,
  custo_padrao numeric(12, 2) not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'grupos_custo_nome_modelo_unique'
  ) then
    alter table public."GRUPOS_CUSTO"
      add constraint grupos_custo_nome_modelo_unique unique (nome_modelo);
  end if;
end $$;

alter table public."PRODUTOS"
  add column if not exists grupo_custo_id uuid references public."GRUPOS_CUSTO"(id) on delete set null,
  add column if not exists custo_manual boolean not null default true;

create index if not exists idx_produtos_grupo_custo_id
  on public."PRODUTOS"(grupo_custo_id);

create table if not exists public."ALTERACOES_GRUPOS_CUSTO" (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid references public."GRUPOS_CUSTO"(id) on delete set null,
  custo_anterior numeric(12, 2),
  custo_novo numeric(12, 2),
  produtos_atualizados integer not null default 0,
  acao text not null default 'alteracao',
  usuario_id uuid,
  detalhes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_alteracoes_grupos_custo_grupo_id
  on public."ALTERACOES_GRUPOS_CUSTO"(grupo_id);

alter table public."GRUPOS_CUSTO" enable row level security;
alter table public."ALTERACOES_GRUPOS_CUSTO" enable row level security;

drop policy if exists "grupos_custo_select_authenticated" on public."GRUPOS_CUSTO";
create policy "grupos_custo_select_authenticated"
  on public."GRUPOS_CUSTO"
  for select
  to authenticated
  using (true);

drop policy if exists "grupos_custo_insert_authenticated" on public."GRUPOS_CUSTO";
create policy "grupos_custo_insert_authenticated"
  on public."GRUPOS_CUSTO"
  for insert
  to authenticated
  with check (true);

drop policy if exists "grupos_custo_update_authenticated" on public."GRUPOS_CUSTO";
create policy "grupos_custo_update_authenticated"
  on public."GRUPOS_CUSTO"
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "alteracoes_grupos_custo_select_authenticated" on public."ALTERACOES_GRUPOS_CUSTO";
create policy "alteracoes_grupos_custo_select_authenticated"
  on public."ALTERACOES_GRUPOS_CUSTO"
  for select
  to authenticated
  using (true);

drop policy if exists "alteracoes_grupos_custo_insert_authenticated" on public."ALTERACOES_GRUPOS_CUSTO";
create policy "alteracoes_grupos_custo_insert_authenticated"
  on public."ALTERACOES_GRUPOS_CUSTO"
  for insert
  to authenticated
  with check (true);
