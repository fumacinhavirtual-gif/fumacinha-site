-- Fumacinha Controle - painel separado de gestao
-- Execute no SQL Editor do Supabase da Fumacinha.
-- Script idempotente: nao apaga dados existentes.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

alter table public."PRODUTOS"
add column if not exists custo numeric(12, 2) not null default 0 check (custo >= 0);

alter table public."PRODUTOS"
add column if not exists updated_at timestamptz not null default now();

create table if not exists public."VENDAS" (
  id bigserial primary key,
  produto_id text not null default '',
  nome_produto text not null default '',
  quantidade integer not null default 1 check (quantidade >= 0),
  valor_unitario numeric(12, 2) not null default 0 check (valor_unitario >= 0),
  valor_total numeric(12, 2) not null default 0 check (valor_total >= 0),
  custo_unitario numeric(12, 2) not null default 0 check (custo_unitario >= 0),
  custo_total numeric(12, 2) not null default 0 check (custo_total >= 0),
  data_venda timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public."VENDAS" add column if not exists produto_id text not null default '';
alter table public."VENDAS" add column if not exists nome_produto text not null default '';
alter table public."VENDAS" add column if not exists quantidade integer not null default 1;
alter table public."VENDAS" add column if not exists valor_unitario numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists valor_total numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists custo_unitario numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists custo_total numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists data_venda timestamptz not null default now();
alter table public."VENDAS" add column if not exists created_at timestamptz not null default now();
alter table public."VENDAS" add column if not exists quantidade_total integer not null default 1;
alter table public."VENDAS" add column if not exists desconto numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists forma_pagamento text not null default 'Pix';
alter table public."VENDAS" add column if not exists cliente_nome text not null default '';
alter table public."VENDAS" add column if not exists observacao text not null default '';
alter table public."VENDAS" add column if not exists cancelada boolean not null default false;
alter table public."VENDAS" add column if not exists cancelada_em timestamptz;
alter table public."VENDAS" add column if not exists usuario_id uuid;
alter table public."VENDAS" add column if not exists updated_at timestamptz not null default now();

create table if not exists public."ITENS_VENDA" (
  id bigserial primary key,
  venda_id bigint not null references public."VENDAS"(id) on delete cascade,
  produto_id text not null,
  nome_produto text not null,
  quantidade integer not null check (quantidade > 0),
  valor_unitario numeric(12, 2) not null default 0 check (valor_unitario >= 0),
  valor_total numeric(12, 2) not null default 0 check (valor_total >= 0),
  custo_unitario numeric(12, 2) not null default 0 check (custo_unitario >= 0),
  custo_total numeric(12, 2) not null default 0 check (custo_total >= 0),
  created_at timestamptz not null default now()
);

alter table public."ITENS_VENDA" add column if not exists venda_id bigint;
alter table public."ITENS_VENDA" add column if not exists produto_id text not null default '';
alter table public."ITENS_VENDA" add column if not exists nome_produto text not null default '';
alter table public."ITENS_VENDA" add column if not exists quantidade integer not null default 1;
alter table public."ITENS_VENDA" add column if not exists valor_unitario numeric(12, 2) not null default 0;
alter table public."ITENS_VENDA" add column if not exists valor_total numeric(12, 2) not null default 0;
alter table public."ITENS_VENDA" add column if not exists custo_unitario numeric(12, 2) not null default 0;
alter table public."ITENS_VENDA" add column if not exists custo_total numeric(12, 2) not null default 0;
alter table public."ITENS_VENDA" add column if not exists created_at timestamptz not null default now();

create table if not exists public."MOVIMENTACOES_ESTOQUE" (
  id bigserial primary key,
  produto_id text not null,
  nome_produto text not null,
  quantidade_anterior integer not null default 0,
  quantidade_nova integer not null default 0,
  diferenca integer not null default 0,
  tipo text not null default 'ajuste manual',
  venda_id bigint references public."VENDAS"(id) on delete set null,
  usuario_id uuid,
  observacao text not null default '',
  created_at timestamptz not null default now()
);

alter table public."MOVIMENTACOES_ESTOQUE" add column if not exists produto_id text not null default '';
alter table public."MOVIMENTACOES_ESTOQUE" add column if not exists nome_produto text not null default '';
alter table public."MOVIMENTACOES_ESTOQUE" add column if not exists quantidade_anterior integer not null default 0;
alter table public."MOVIMENTACOES_ESTOQUE" add column if not exists quantidade_nova integer not null default 0;
alter table public."MOVIMENTACOES_ESTOQUE" add column if not exists diferenca integer not null default 0;
alter table public."MOVIMENTACOES_ESTOQUE" add column if not exists tipo text not null default 'ajuste manual';
alter table public."MOVIMENTACOES_ESTOQUE" add column if not exists venda_id bigint;
alter table public."MOVIMENTACOES_ESTOQUE" add column if not exists usuario_id uuid;
alter table public."MOVIMENTACOES_ESTOQUE" add column if not exists observacao text not null default '';
alter table public."MOVIMENTACOES_ESTOQUE" add column if not exists created_at timestamptz not null default now();

create table if not exists public."DESPESAS" (
  id bigserial primary key,
  descricao text not null,
  categoria text not null default 'Outros',
  valor numeric(12, 2) not null check (valor >= 0),
  data_despesa date not null default current_date,
  forma_pagamento text not null default 'Pix',
  observacao text not null default '',
  usuario_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public."DESPESAS" add column if not exists descricao text not null default '';
alter table public."DESPESAS" add column if not exists categoria text not null default 'Outros';
alter table public."DESPESAS" add column if not exists valor numeric(12, 2) not null default 0;
alter table public."DESPESAS" add column if not exists data_despesa date not null default current_date;
alter table public."DESPESAS" add column if not exists forma_pagamento text not null default 'Pix';
alter table public."DESPESAS" add column if not exists observacao text not null default '';
alter table public."DESPESAS" add column if not exists usuario_id uuid;
alter table public."DESPESAS" add column if not exists created_at timestamptz not null default now();
alter table public."DESPESAS" add column if not exists updated_at timestamptz not null default now();

create table if not exists public."FECHAMENTOS_CAIXA" (
  id bigserial primary key,
  data_fechamento date not null default current_date,
  faturamento numeric(12, 2) not null default 0,
  custo_produtos numeric(12, 2) not null default 0,
  despesas numeric(12, 2) not null default 0,
  lucro_bruto numeric(12, 2) not null default 0,
  lucro_liquido numeric(12, 2) not null default 0,
  observacao text not null default '',
  usuario_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public."FECHAMENTOS_CAIXA" add column if not exists data_fechamento date not null default current_date;
alter table public."FECHAMENTOS_CAIXA" add column if not exists faturamento numeric(12, 2) not null default 0;
alter table public."FECHAMENTOS_CAIXA" add column if not exists custo_produtos numeric(12, 2) not null default 0;
alter table public."FECHAMENTOS_CAIXA" add column if not exists despesas numeric(12, 2) not null default 0;
alter table public."FECHAMENTOS_CAIXA" add column if not exists lucro_bruto numeric(12, 2) not null default 0;
alter table public."FECHAMENTOS_CAIXA" add column if not exists lucro_liquido numeric(12, 2) not null default 0;
alter table public."FECHAMENTOS_CAIXA" add column if not exists observacao text not null default '';
alter table public."FECHAMENTOS_CAIXA" add column if not exists usuario_id uuid;
alter table public."FECHAMENTOS_CAIXA" add column if not exists created_at timestamptz not null default now();
alter table public."FECHAMENTOS_CAIXA" add column if not exists updated_at timestamptz not null default now();

create index if not exists produtos_nome_idx on public."PRODUTOS" (nome);
create index if not exists produtos_categoria_idx on public."PRODUTOS" (categoria);
create index if not exists produtos_estoque_idx on public."PRODUTOS" (estoque);
create index if not exists vendas_data_venda_idx on public."VENDAS" (data_venda desc);
create index if not exists vendas_cancelada_idx on public."VENDAS" (cancelada);
create index if not exists itens_venda_venda_id_idx on public."ITENS_VENDA" (venda_id);
create index if not exists itens_venda_produto_id_idx on public."ITENS_VENDA" (produto_id);
create index if not exists movimentacoes_estoque_produto_id_idx on public."MOVIMENTACOES_ESTOQUE" (produto_id);
create index if not exists movimentacoes_estoque_created_at_idx on public."MOVIMENTACOES_ESTOQUE" (created_at desc);
create index if not exists despesas_data_despesa_idx on public."DESPESAS" (data_despesa desc);
create index if not exists fechamentos_caixa_data_idx on public."FECHAMENTOS_CAIXA" (data_fechamento desc);

do $$
begin
  if not exists (
    select 1
    from pg_constraint constraint_info
    join pg_attribute column_info
      on column_info.attrelid = constraint_info.conrelid
     and column_info.attnum = any(constraint_info.conkey)
    where constraint_info.contype = 'f'
      and constraint_info.conrelid = 'public."ITENS_VENDA"'::regclass
      and constraint_info.confrelid = 'public."VENDAS"'::regclass
      and column_info.attname = 'venda_id'
  ) then
    alter table public."ITENS_VENDA"
    add constraint itens_venda_venda_id_fkey
    foreign key (venda_id) references public."VENDAS"(id) on delete cascade;
  end if;

  if not exists (
    select 1
    from pg_constraint constraint_info
    join pg_attribute column_info
      on column_info.attrelid = constraint_info.conrelid
     and column_info.attnum = any(constraint_info.conkey)
    where constraint_info.contype = 'f'
      and constraint_info.conrelid = 'public."MOVIMENTACOES_ESTOQUE"'::regclass
      and constraint_info.confrelid = 'public."VENDAS"'::regclass
      and column_info.attname = 'venda_id'
  ) then
    alter table public."MOVIMENTACOES_ESTOQUE"
    add constraint movimentacoes_estoque_venda_id_fkey
    foreign key (venda_id) references public."VENDAS"(id) on delete set null;
  end if;
end;
$$;

drop trigger if exists produtos_set_updated_at on public."PRODUTOS";
create trigger produtos_set_updated_at
before update on public."PRODUTOS"
for each row execute function public.set_updated_at();

drop trigger if exists vendas_set_updated_at on public."VENDAS";
create trigger vendas_set_updated_at
before update on public."VENDAS"
for each row execute function public.set_updated_at();

drop trigger if exists despesas_set_updated_at on public."DESPESAS";
create trigger despesas_set_updated_at
before update on public."DESPESAS"
for each row execute function public.set_updated_at();

drop trigger if exists fechamentos_caixa_set_updated_at on public."FECHAMENTOS_CAIXA";
create trigger fechamentos_caixa_set_updated_at
before update on public."FECHAMENTOS_CAIXA"
for each row execute function public.set_updated_at();

alter table public."PRODUTOS" enable row level security;
alter table public."VENDAS" enable row level security;
alter table public."ITENS_VENDA" enable row level security;
alter table public."MOVIMENTACOES_ESTOQUE" enable row level security;
alter table public."DESPESAS" enable row level security;
alter table public."FECHAMENTOS_CAIXA" enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public."PRODUTOS" to anon, authenticated;
grant insert, update, delete on public."PRODUTOS" to authenticated;
grant select, insert, update, delete on public."VENDAS" to authenticated;
grant select, insert, update, delete on public."ITENS_VENDA" to authenticated;
grant select, insert, update, delete on public."MOVIMENTACOES_ESTOQUE" to authenticated;
grant select, insert, update, delete on public."DESPESAS" to authenticated;
grant select, insert, update, delete on public."FECHAMENTOS_CAIXA" to authenticated;
grant usage, select on all sequences in schema public to authenticated;

drop policy if exists "PRODUTOS controle leitura autenticada" on public."PRODUTOS";
drop policy if exists "PRODUTOS controle edicao autenticada" on public."PRODUTOS";

create policy "PRODUTOS controle leitura autenticada"
on public."PRODUTOS"
for select
to authenticated
using (true);

create policy "PRODUTOS controle edicao autenticada"
on public."PRODUTOS"
for update
to authenticated
using (true)
with check (true);

-- Remove politicas financeiras antigas abertas, se existirem.
drop policy if exists "VENDAS leitura pelo site" on public."VENDAS";
drop policy if exists "VENDAS inserir pelo site" on public."VENDAS";
drop policy if exists "VENDAS editar pelo site" on public."VENDAS";
drop policy if exists "VENDAS excluir pelo site" on public."VENDAS";
drop policy if exists "VENDAS leitura autenticada" on public."VENDAS";
drop policy if exists "VENDAS inserir autenticado" on public."VENDAS";
drop policy if exists "VENDAS editar autenticado" on public."VENDAS";
drop policy if exists "VENDAS excluir autenticado" on public."VENDAS";

create policy "VENDAS leitura autenticada"
on public."VENDAS"
for select
to authenticated
using (true);

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

drop policy if exists "ITENS_VENDA leitura autenticada" on public."ITENS_VENDA";
drop policy if exists "ITENS_VENDA inserir autenticado" on public."ITENS_VENDA";
drop policy if exists "ITENS_VENDA editar autenticado" on public."ITENS_VENDA";
drop policy if exists "ITENS_VENDA excluir autenticado" on public."ITENS_VENDA";

create policy "ITENS_VENDA leitura autenticada" on public."ITENS_VENDA" for select to authenticated using (true);
create policy "ITENS_VENDA inserir autenticado" on public."ITENS_VENDA" for insert to authenticated with check (true);
create policy "ITENS_VENDA editar autenticado" on public."ITENS_VENDA" for update to authenticated using (true) with check (true);
create policy "ITENS_VENDA excluir autenticado" on public."ITENS_VENDA" for delete to authenticated using (true);

drop policy if exists "MOVIMENTACOES_ESTOQUE leitura autenticada" on public."MOVIMENTACOES_ESTOQUE";
drop policy if exists "MOVIMENTACOES_ESTOQUE inserir autenticado" on public."MOVIMENTACOES_ESTOQUE";
drop policy if exists "MOVIMENTACOES_ESTOQUE editar autenticado" on public."MOVIMENTACOES_ESTOQUE";
drop policy if exists "MOVIMENTACOES_ESTOQUE excluir autenticado" on public."MOVIMENTACOES_ESTOQUE";

create policy "MOVIMENTACOES_ESTOQUE leitura autenticada" on public."MOVIMENTACOES_ESTOQUE" for select to authenticated using (true);
create policy "MOVIMENTACOES_ESTOQUE inserir autenticado" on public."MOVIMENTACOES_ESTOQUE" for insert to authenticated with check (true);
create policy "MOVIMENTACOES_ESTOQUE editar autenticado" on public."MOVIMENTACOES_ESTOQUE" for update to authenticated using (true) with check (true);
create policy "MOVIMENTACOES_ESTOQUE excluir autenticado" on public."MOVIMENTACOES_ESTOQUE" for delete to authenticated using (true);

drop policy if exists "DESPESAS leitura autenticada" on public."DESPESAS";
drop policy if exists "DESPESAS inserir autenticado" on public."DESPESAS";
drop policy if exists "DESPESAS editar autenticado" on public."DESPESAS";
drop policy if exists "DESPESAS excluir autenticado" on public."DESPESAS";

create policy "DESPESAS leitura autenticada" on public."DESPESAS" for select to authenticated using (true);
create policy "DESPESAS inserir autenticado" on public."DESPESAS" for insert to authenticated with check (true);
create policy "DESPESAS editar autenticado" on public."DESPESAS" for update to authenticated using (true) with check (true);
create policy "DESPESAS excluir autenticado" on public."DESPESAS" for delete to authenticated using (true);

drop policy if exists "FECHAMENTOS_CAIXA leitura autenticada" on public."FECHAMENTOS_CAIXA";
drop policy if exists "FECHAMENTOS_CAIXA inserir autenticado" on public."FECHAMENTOS_CAIXA";
drop policy if exists "FECHAMENTOS_CAIXA editar autenticado" on public."FECHAMENTOS_CAIXA";
drop policy if exists "FECHAMENTOS_CAIXA excluir autenticado" on public."FECHAMENTOS_CAIXA";

create policy "FECHAMENTOS_CAIXA leitura autenticada" on public."FECHAMENTOS_CAIXA" for select to authenticated using (true);
create policy "FECHAMENTOS_CAIXA inserir autenticado" on public."FECHAMENTOS_CAIXA" for insert to authenticated with check (true);
create policy "FECHAMENTOS_CAIXA editar autenticado" on public."FECHAMENTOS_CAIXA" for update to authenticated using (true) with check (true);
create policy "FECHAMENTOS_CAIXA excluir autenticado" on public."FECHAMENTOS_CAIXA" for delete to authenticated using (true);

notify pgrst, 'reload schema';
