-- Fumacinha Controle - cadastro fixo de equipe
-- Execute no SQL Editor do Supabase da Fumacinha.
-- Idempotente: cria/ajusta sem apagar dados existentes.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public."VENDEDORAS" (
  id bigserial primary key,
  nome text not null unique,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public."VENDEDORAS" add column if not exists nome text not null default '';
alter table public."VENDEDORAS" add column if not exists ativo boolean not null default true;
alter table public."VENDEDORAS" add column if not exists created_at timestamptz not null default now();
alter table public."VENDEDORAS" add column if not exists updated_at timestamptz not null default now();

create table if not exists public."ENTREGADORES" (
  id bigserial primary key,
  nome text not null unique,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public."ENTREGADORES" add column if not exists nome text not null default '';
alter table public."ENTREGADORES" add column if not exists ativo boolean not null default true;
alter table public."ENTREGADORES" add column if not exists created_at timestamptz not null default now();
alter table public."ENTREGADORES" add column if not exists updated_at timestamptz not null default now();

create table if not exists public."VENDAS" (
  id bigserial primary key,
  produto_id text not null default '',
  nome_produto text not null default '',
  quantidade integer not null default 1,
  valor_unitario numeric(12, 2) not null default 0,
  valor_total numeric(12, 2) not null default 0,
  data_venda timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public."VENDAS" add column if not exists vendedora_id bigint;
alter table public."VENDAS" add column if not exists entregador_id bigint;
alter table public."VENDAS" add column if not exists vendedora_nome text not null default '';
alter table public."VENDAS" add column if not exists entregador_nome text not null default '';

create index if not exists vendedoras_nome_idx on public."VENDEDORAS" (nome);
create index if not exists vendedoras_ativo_idx on public."VENDEDORAS" (ativo);
create index if not exists entregadores_nome_idx on public."ENTREGADORES" (nome);
create index if not exists entregadores_ativo_idx on public."ENTREGADORES" (ativo);
create index if not exists vendas_vendedora_id_idx on public."VENDAS" (vendedora_id);
create index if not exists vendas_entregador_id_idx on public."VENDAS" (entregador_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any(c.conkey)
    where c.contype = 'f'
      and c.conrelid = 'public."VENDAS"'::regclass
      and c.confrelid = 'public."VENDEDORAS"'::regclass
      and a.attname = 'vendedora_id'
  ) then
    alter table public."VENDAS"
    add constraint vendas_vendedora_id_fkey
    foreign key (vendedora_id) references public."VENDEDORAS"(id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint c
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any(c.conkey)
    where c.contype = 'f'
      and c.conrelid = 'public."VENDAS"'::regclass
      and c.confrelid = 'public."ENTREGADORES"'::regclass
      and a.attname = 'entregador_id'
  ) then
    alter table public."VENDAS"
    add constraint vendas_entregador_id_fkey
    foreign key (entregador_id) references public."ENTREGADORES"(id) on delete set null;
  end if;
end;
$$;

drop trigger if exists vendedoras_set_updated_at on public."VENDEDORAS";
create trigger vendedoras_set_updated_at
before update on public."VENDEDORAS"
for each row execute function public.set_updated_at();

drop trigger if exists entregadores_set_updated_at on public."ENTREGADORES";
create trigger entregadores_set_updated_at
before update on public."ENTREGADORES"
for each row execute function public.set_updated_at();

alter table public."VENDEDORAS" enable row level security;
alter table public."ENTREGADORES" enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public."VENDEDORAS" to authenticated;
grant select, insert, update, delete on public."ENTREGADORES" to authenticated;
grant usage, select on all sequences in schema public to authenticated;

drop policy if exists "VENDEDORAS controle leitura autenticada" on public."VENDEDORAS";
drop policy if exists "VENDEDORAS controle inserir autenticado" on public."VENDEDORAS";
drop policy if exists "VENDEDORAS controle editar autenticado" on public."VENDEDORAS";
drop policy if exists "VENDEDORAS controle excluir autenticado" on public."VENDEDORAS";

create policy "VENDEDORAS controle leitura autenticada" on public."VENDEDORAS" for select to authenticated using (true);
create policy "VENDEDORAS controle inserir autenticado" on public."VENDEDORAS" for insert to authenticated with check (true);
create policy "VENDEDORAS controle editar autenticado" on public."VENDEDORAS" for update to authenticated using (true) with check (true);
create policy "VENDEDORAS controle excluir autenticado" on public."VENDEDORAS" for delete to authenticated using (true);

drop policy if exists "ENTREGADORES controle leitura autenticada" on public."ENTREGADORES";
drop policy if exists "ENTREGADORES controle inserir autenticado" on public."ENTREGADORES";
drop policy if exists "ENTREGADORES controle editar autenticado" on public."ENTREGADORES";
drop policy if exists "ENTREGADORES controle excluir autenticado" on public."ENTREGADORES";

create policy "ENTREGADORES controle leitura autenticada" on public."ENTREGADORES" for select to authenticated using (true);
create policy "ENTREGADORES controle inserir autenticado" on public."ENTREGADORES" for insert to authenticated with check (true);
create policy "ENTREGADORES controle editar autenticado" on public."ENTREGADORES" for update to authenticated using (true) with check (true);
create policy "ENTREGADORES controle excluir autenticado" on public."ENTREGADORES" for delete to authenticated using (true);

select pg_notify('pgrst', 'reload schema');
