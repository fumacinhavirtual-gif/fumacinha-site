-- Fumacinha Controle - fechamento de caixa do dia
-- Execute no SQL Editor do Supabase da Fumacinha.
-- Idempotente: cria/ajusta sem apagar dados existentes.

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public."FECHAMENTOS_CAIXA" (
  id bigserial primary key,
  data_caixa date not null unique,
  troco_inicial numeric(12, 2) not null default 0,
  troco_usado numeric(12, 2) not null default 0,
  troco_restante numeric(12, 2) not null default 0,
  vendas_pix numeric(12, 2) not null default 0,
  vendas_dinheiro numeric(12, 2) not null default 0,
  vendas_debito numeric(12, 2) not null default 0,
  vendas_credito numeric(12, 2) not null default 0,
  vendas_outros numeric(12, 2) not null default 0,
  total_vendas numeric(12, 2) not null default 0,
  quantidade_vendas integer not null default 0,
  vendas_canceladas integer not null default 0,
  sangrias numeric(12, 2) not null default 0,
  reforcos numeric(12, 2) not null default 0,
  retiradas numeric(12, 2) not null default 0,
  pagamentos_caixa numeric(12, 2) not null default 0,
  dinheiro_esperado numeric(12, 2) not null default 0,
  dinheiro_contado numeric(12, 2) not null default 0,
  diferenca numeric(12, 2) not null default 0,
  status text not null default 'aberto',
  observacao text not null default '',
  fechado_por text not null default '',
  fechado_em timestamptz,
  reaberto_por text not null default '',
  reaberto_em timestamptz,
  turno text not null default 'principal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public."FECHAMENTOS_CAIXA" add column if not exists data_caixa date;
alter table public."FECHAMENTOS_CAIXA" add column if not exists troco_inicial numeric(12, 2) not null default 0;
alter table public."FECHAMENTOS_CAIXA" add column if not exists troco_usado numeric(12, 2) not null default 0;
alter table public."FECHAMENTOS_CAIXA" add column if not exists troco_restante numeric(12, 2) not null default 0;
alter table public."FECHAMENTOS_CAIXA" add column if not exists vendas_pix numeric(12, 2) not null default 0;
alter table public."FECHAMENTOS_CAIXA" add column if not exists vendas_dinheiro numeric(12, 2) not null default 0;
alter table public."FECHAMENTOS_CAIXA" add column if not exists vendas_debito numeric(12, 2) not null default 0;
alter table public."FECHAMENTOS_CAIXA" add column if not exists vendas_credito numeric(12, 2) not null default 0;
alter table public."FECHAMENTOS_CAIXA" add column if not exists vendas_outros numeric(12, 2) not null default 0;
alter table public."FECHAMENTOS_CAIXA" add column if not exists total_vendas numeric(12, 2) not null default 0;
alter table public."FECHAMENTOS_CAIXA" add column if not exists quantidade_vendas integer not null default 0;
alter table public."FECHAMENTOS_CAIXA" add column if not exists vendas_canceladas integer not null default 0;
alter table public."FECHAMENTOS_CAIXA" add column if not exists sangrias numeric(12, 2) not null default 0;
alter table public."FECHAMENTOS_CAIXA" add column if not exists reforcos numeric(12, 2) not null default 0;
alter table public."FECHAMENTOS_CAIXA" add column if not exists retiradas numeric(12, 2) not null default 0;
alter table public."FECHAMENTOS_CAIXA" add column if not exists pagamentos_caixa numeric(12, 2) not null default 0;
alter table public."FECHAMENTOS_CAIXA" add column if not exists dinheiro_esperado numeric(12, 2) not null default 0;
alter table public."FECHAMENTOS_CAIXA" add column if not exists dinheiro_contado numeric(12, 2) not null default 0;
alter table public."FECHAMENTOS_CAIXA" add column if not exists diferenca numeric(12, 2) not null default 0;
alter table public."FECHAMENTOS_CAIXA" add column if not exists status text not null default 'aberto';
alter table public."FECHAMENTOS_CAIXA" add column if not exists observacao text not null default '';
alter table public."FECHAMENTOS_CAIXA" add column if not exists fechado_por text not null default '';
alter table public."FECHAMENTOS_CAIXA" add column if not exists fechado_em timestamptz;
alter table public."FECHAMENTOS_CAIXA" add column if not exists reaberto_por text not null default '';
alter table public."FECHAMENTOS_CAIXA" add column if not exists reaberto_em timestamptz;
alter table public."FECHAMENTOS_CAIXA" add column if not exists turno text not null default 'principal';
alter table public."FECHAMENTOS_CAIXA" add column if not exists created_at timestamptz not null default now();
alter table public."FECHAMENTOS_CAIXA" add column if not exists updated_at timestamptz not null default now();

create table if not exists public."MOVIMENTACOES_CAIXA" (
  id bigserial primary key,
  data_caixa date not null,
  tipo text not null default 'ajuste',
  descricao text not null default '',
  valor numeric(12, 2) not null default 0,
  created_by text not null default '',
  created_at timestamptz not null default now()
);

alter table public."MOVIMENTACOES_CAIXA" add column if not exists data_caixa date;
alter table public."MOVIMENTACOES_CAIXA" add column if not exists tipo text not null default 'ajuste';
alter table public."MOVIMENTACOES_CAIXA" add column if not exists descricao text not null default '';
alter table public."MOVIMENTACOES_CAIXA" add column if not exists valor numeric(12, 2) not null default 0;
alter table public."MOVIMENTACOES_CAIXA" add column if not exists created_by text not null default '';
alter table public."MOVIMENTACOES_CAIXA" add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'fechamentos_caixa_data_caixa_key'
      and conrelid = 'public."FECHAMENTOS_CAIXA"'::regclass
  ) then
    alter table public."FECHAMENTOS_CAIXA"
    add constraint fechamentos_caixa_data_caixa_key unique (data_caixa);
  end if;
end;
$$;

create index if not exists fechamentos_caixa_data_idx on public."FECHAMENTOS_CAIXA" (data_caixa);
create index if not exists fechamentos_caixa_status_idx on public."FECHAMENTOS_CAIXA" (status);
create index if not exists movimentacoes_caixa_data_idx on public."MOVIMENTACOES_CAIXA" (data_caixa);
create index if not exists movimentacoes_caixa_tipo_idx on public."MOVIMENTACOES_CAIXA" (tipo);

drop trigger if exists fechamentos_caixa_set_updated_at on public."FECHAMENTOS_CAIXA";
create trigger fechamentos_caixa_set_updated_at
before update on public."FECHAMENTOS_CAIXA"
for each row execute function public.set_updated_at();

alter table public."FECHAMENTOS_CAIXA" enable row level security;
alter table public."MOVIMENTACOES_CAIXA" enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public."FECHAMENTOS_CAIXA" to authenticated;
grant select, insert, update, delete on public."MOVIMENTACOES_CAIXA" to authenticated;
grant usage, select on all sequences in schema public to authenticated;

drop policy if exists "FECHAMENTOS_CAIXA leitura autenticada" on public."FECHAMENTOS_CAIXA";
drop policy if exists "FECHAMENTOS_CAIXA inserir autenticado" on public."FECHAMENTOS_CAIXA";
drop policy if exists "FECHAMENTOS_CAIXA editar autenticado" on public."FECHAMENTOS_CAIXA";
drop policy if exists "FECHAMENTOS_CAIXA excluir autenticado" on public."FECHAMENTOS_CAIXA";

create policy "FECHAMENTOS_CAIXA leitura autenticada"
on public."FECHAMENTOS_CAIXA"
for select
to authenticated
using (true);

create policy "FECHAMENTOS_CAIXA inserir autenticado"
on public."FECHAMENTOS_CAIXA"
for insert
to authenticated
with check (true);

create policy "FECHAMENTOS_CAIXA editar autenticado"
on public."FECHAMENTOS_CAIXA"
for update
to authenticated
using (true)
with check (true);

create policy "FECHAMENTOS_CAIXA excluir autenticado"
on public."FECHAMENTOS_CAIXA"
for delete
to authenticated
using (true);

drop policy if exists "MOVIMENTACOES_CAIXA leitura autenticada" on public."MOVIMENTACOES_CAIXA";
drop policy if exists "MOVIMENTACOES_CAIXA inserir autenticado" on public."MOVIMENTACOES_CAIXA";
drop policy if exists "MOVIMENTACOES_CAIXA editar autenticado" on public."MOVIMENTACOES_CAIXA";
drop policy if exists "MOVIMENTACOES_CAIXA excluir autenticado" on public."MOVIMENTACOES_CAIXA";

create policy "MOVIMENTACOES_CAIXA leitura autenticada"
on public."MOVIMENTACOES_CAIXA"
for select
to authenticated
using (true);

create policy "MOVIMENTACOES_CAIXA inserir autenticado"
on public."MOVIMENTACOES_CAIXA"
for insert
to authenticated
with check (true);

create policy "MOVIMENTACOES_CAIXA editar autenticado"
on public."MOVIMENTACOES_CAIXA"
for update
to authenticated
using (true)
with check (true);

create policy "MOVIMENTACOES_CAIXA excluir autenticado"
on public."MOVIMENTACOES_CAIXA"
for delete
to authenticated
using (true);

select pg_notify('pgrst', 'reload schema');
