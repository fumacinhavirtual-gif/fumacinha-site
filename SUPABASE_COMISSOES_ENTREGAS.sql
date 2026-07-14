-- Fumacinha Controle - entregas e comissoes
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

create table if not exists public."ENTREGADORES" (
  id bigserial primary key,
  nome text not null unique,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public."VENDEDORAS" (
  id bigserial primary key,
  nome text not null unique,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public."VENDAS" add column if not exists valor_produtos numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists valor_recebido numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists taxa_entrega numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists entregador_id bigint;
alter table public."VENDAS" add column if not exists entregador_nome text not null default '';
alter table public."VENDAS" add column if not exists vendedora_id bigint;
alter table public."VENDAS" add column if not exists vendedora_nome text not null default '';
alter table public."VENDAS" add column if not exists comissao_base numeric(12, 2) not null default 0.50;
alter table public."VENDAS" add column if not exists comissao_cartao numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists comissao_total numeric(12, 2) not null default 0.50;
alter table public."VENDAS" add column if not exists quantidade_total integer not null default 1;
alter table public."VENDAS" add column if not exists desconto numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists forma_pagamento text not null default 'Pix';
alter table public."VENDAS" add column if not exists cliente_nome text not null default '';
alter table public."VENDAS" add column if not exists observacao text not null default '';
alter table public."VENDAS" add column if not exists custo_unitario numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists custo_total numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists cancelada boolean not null default false;
alter table public."VENDAS" add column if not exists cancelada_em timestamptz;
alter table public."VENDAS" add column if not exists usuario_id uuid;
alter table public."VENDAS" add column if not exists updated_at timestamptz not null default now();

update public."VENDAS"
set valor_produtos = valor_total
where valor_produtos = 0 and valor_total > 0;

update public."VENDAS"
set valor_recebido = valor_produtos + taxa_entrega
where valor_recebido = 0;

create table if not exists public."ITENS_VENDA" (
  id bigserial primary key,
  venda_id bigint references public."VENDAS"(id) on delete cascade,
  produto_id bigint,
  nome_produto text not null default '',
  quantidade integer not null default 1,
  valor_unitario numeric(12, 2) not null default 0,
  valor_total numeric(12, 2) not null default 0,
  custo_unitario numeric(12, 2) not null default 0,
  custo_total numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

alter table public."ITENS_VENDA" add column if not exists venda_id bigint;
alter table public."ITENS_VENDA" add column if not exists produto_id bigint;
alter table public."ITENS_VENDA" add column if not exists nome_produto text not null default '';
alter table public."ITENS_VENDA" add column if not exists quantidade integer not null default 1;
alter table public."ITENS_VENDA" add column if not exists valor_unitario numeric(12, 2) not null default 0;
alter table public."ITENS_VENDA" add column if not exists valor_total numeric(12, 2) not null default 0;
alter table public."ITENS_VENDA" add column if not exists custo_unitario numeric(12, 2) not null default 0;
alter table public."ITENS_VENDA" add column if not exists custo_total numeric(12, 2) not null default 0;
alter table public."ITENS_VENDA" add column if not exists created_at timestamptz not null default now();

create table if not exists public."MOVIMENTACOES_ESTOQUE" (
  id bigserial primary key,
  produto_id bigint,
  nome_produto text not null default '',
  quantidade_anterior integer not null default 0,
  quantidade_nova integer not null default 0,
  diferenca integer not null default 0,
  tipo text not null default 'ajuste manual',
  observacao text not null default '',
  venda_id bigint references public."VENDAS"(id) on delete set null,
  usuario_id uuid,
  created_at timestamptz not null default now()
);

alter table public."MOVIMENTACOES_ESTOQUE" add column if not exists produto_id bigint;
alter table public."MOVIMENTACOES_ESTOQUE" add column if not exists nome_produto text not null default '';
alter table public."MOVIMENTACOES_ESTOQUE" add column if not exists quantidade_anterior integer not null default 0;
alter table public."MOVIMENTACOES_ESTOQUE" add column if not exists quantidade_nova integer not null default 0;
alter table public."MOVIMENTACOES_ESTOQUE" add column if not exists diferenca integer not null default 0;
alter table public."MOVIMENTACOES_ESTOQUE" add column if not exists tipo text not null default 'ajuste manual';
alter table public."MOVIMENTACOES_ESTOQUE" add column if not exists observacao text not null default '';
alter table public."MOVIMENTACOES_ESTOQUE" add column if not exists venda_id bigint;
alter table public."MOVIMENTACOES_ESTOQUE" add column if not exists usuario_id uuid;
alter table public."MOVIMENTACOES_ESTOQUE" add column if not exists created_at timestamptz not null default now();

create table if not exists public."DESPESAS" (
  id bigserial primary key,
  descricao text not null default '',
  categoria text not null default 'Outros',
  valor numeric(12, 2) not null default 0,
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

create table if not exists public."REPASSES_ENTREGADORES" (
  id bigserial primary key,
  venda_id bigint references public."VENDAS"(id) on delete set null,
  entregador_id bigint references public."ENTREGADORES"(id) on delete set null,
  valor numeric(12, 2) not null default 0 check (valor >= 0),
  pago boolean not null default false,
  data_pagamento timestamptz,
  created_at timestamptz not null default now()
);

alter table public."REPASSES_ENTREGADORES" add column if not exists venda_id bigint;
alter table public."REPASSES_ENTREGADORES" add column if not exists entregador_id bigint;
alter table public."REPASSES_ENTREGADORES" add column if not exists valor numeric(12, 2) not null default 0;
alter table public."REPASSES_ENTREGADORES" add column if not exists pago boolean not null default false;
alter table public."REPASSES_ENTREGADORES" add column if not exists data_pagamento timestamptz;
alter table public."REPASSES_ENTREGADORES" add column if not exists created_at timestamptz not null default now();

create index if not exists entregadores_nome_idx on public."ENTREGADORES" (nome);
create index if not exists vendedoras_nome_idx on public."VENDEDORAS" (nome);
create index if not exists vendas_entregador_id_idx on public."VENDAS" (entregador_id);
create index if not exists vendas_vendedora_id_idx on public."VENDAS" (vendedora_id);
create index if not exists vendas_forma_pagamento_idx on public."VENDAS" (forma_pagamento);
create index if not exists itens_venda_venda_id_idx on public."ITENS_VENDA" (venda_id);
create index if not exists itens_venda_produto_id_idx on public."ITENS_VENDA" (produto_id);
create index if not exists movimentacoes_estoque_produto_id_idx on public."MOVIMENTACOES_ESTOQUE" (produto_id);
create index if not exists movimentacoes_estoque_created_at_idx on public."MOVIMENTACOES_ESTOQUE" (created_at desc);
create index if not exists despesas_data_despesa_idx on public."DESPESAS" (data_despesa desc);
create index if not exists repasses_entregadores_venda_id_idx on public."REPASSES_ENTREGADORES" (venda_id);
create index if not exists repasses_entregadores_entregador_id_idx on public."REPASSES_ENTREGADORES" (entregador_id);
create index if not exists repasses_entregadores_created_at_idx on public."REPASSES_ENTREGADORES" (created_at desc);

do $$
begin
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
end;
$$;

drop trigger if exists vendas_set_updated_at on public."VENDAS";
create trigger vendas_set_updated_at
before update on public."VENDAS"
for each row execute function public.set_updated_at();

alter table public."VENDAS" enable row level security;
alter table public."ITENS_VENDA" enable row level security;
alter table public."MOVIMENTACOES_ESTOQUE" enable row level security;
alter table public."DESPESAS" enable row level security;
alter table public."ENTREGADORES" enable row level security;
alter table public."VENDEDORAS" enable row level security;
alter table public."REPASSES_ENTREGADORES" enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public."VENDAS" to authenticated;
grant select, insert, update, delete on public."ITENS_VENDA" to authenticated;
grant select, insert, update, delete on public."MOVIMENTACOES_ESTOQUE" to authenticated;
grant select, insert, update, delete on public."DESPESAS" to authenticated;
grant select, insert, update, delete on public."ENTREGADORES" to authenticated;
grant select, insert, update, delete on public."VENDEDORAS" to authenticated;
grant select, insert, update, delete on public."REPASSES_ENTREGADORES" to authenticated;
grant usage, select on all sequences in schema public to authenticated;

drop policy if exists "VENDAS leitura pelo site" on public."VENDAS";
drop policy if exists "VENDAS inserir pelo site" on public."VENDAS";
drop policy if exists "VENDAS editar pelo site" on public."VENDAS";
drop policy if exists "VENDAS excluir pelo site" on public."VENDAS";

drop policy if exists "VENDAS controle leitura autenticada" on public."VENDAS";
drop policy if exists "VENDAS controle inserir autenticado" on public."VENDAS";
drop policy if exists "VENDAS controle editar autenticado" on public."VENDAS";
drop policy if exists "VENDAS controle excluir autenticado" on public."VENDAS";

create policy "VENDAS controle leitura autenticada" on public."VENDAS" for select to authenticated using (true);
create policy "VENDAS controle inserir autenticado" on public."VENDAS" for insert to authenticated with check (true);
create policy "VENDAS controle editar autenticado" on public."VENDAS" for update to authenticated using (true) with check (true);
create policy "VENDAS controle excluir autenticado" on public."VENDAS" for delete to authenticated using (true);

drop policy if exists "ITENS_VENDA controle leitura autenticada" on public."ITENS_VENDA";
drop policy if exists "ITENS_VENDA controle inserir autenticado" on public."ITENS_VENDA";
drop policy if exists "ITENS_VENDA controle editar autenticado" on public."ITENS_VENDA";
drop policy if exists "ITENS_VENDA controle excluir autenticado" on public."ITENS_VENDA";

create policy "ITENS_VENDA controle leitura autenticada" on public."ITENS_VENDA" for select to authenticated using (true);
create policy "ITENS_VENDA controle inserir autenticado" on public."ITENS_VENDA" for insert to authenticated with check (true);
create policy "ITENS_VENDA controle editar autenticado" on public."ITENS_VENDA" for update to authenticated using (true) with check (true);
create policy "ITENS_VENDA controle excluir autenticado" on public."ITENS_VENDA" for delete to authenticated using (true);

drop policy if exists "MOVIMENTACOES_ESTOQUE controle leitura autenticada" on public."MOVIMENTACOES_ESTOQUE";
drop policy if exists "MOVIMENTACOES_ESTOQUE controle inserir autenticado" on public."MOVIMENTACOES_ESTOQUE";
drop policy if exists "MOVIMENTACOES_ESTOQUE controle editar autenticado" on public."MOVIMENTACOES_ESTOQUE";
drop policy if exists "MOVIMENTACOES_ESTOQUE controle excluir autenticado" on public."MOVIMENTACOES_ESTOQUE";

create policy "MOVIMENTACOES_ESTOQUE controle leitura autenticada" on public."MOVIMENTACOES_ESTOQUE" for select to authenticated using (true);
create policy "MOVIMENTACOES_ESTOQUE controle inserir autenticado" on public."MOVIMENTACOES_ESTOQUE" for insert to authenticated with check (true);
create policy "MOVIMENTACOES_ESTOQUE controle editar autenticado" on public."MOVIMENTACOES_ESTOQUE" for update to authenticated using (true) with check (true);
create policy "MOVIMENTACOES_ESTOQUE controle excluir autenticado" on public."MOVIMENTACOES_ESTOQUE" for delete to authenticated using (true);

drop policy if exists "DESPESAS controle leitura autenticada" on public."DESPESAS";
drop policy if exists "DESPESAS controle inserir autenticado" on public."DESPESAS";
drop policy if exists "DESPESAS controle editar autenticado" on public."DESPESAS";
drop policy if exists "DESPESAS controle excluir autenticado" on public."DESPESAS";

create policy "DESPESAS controle leitura autenticada" on public."DESPESAS" for select to authenticated using (true);
create policy "DESPESAS controle inserir autenticado" on public."DESPESAS" for insert to authenticated with check (true);
create policy "DESPESAS controle editar autenticado" on public."DESPESAS" for update to authenticated using (true) with check (true);
create policy "DESPESAS controle excluir autenticado" on public."DESPESAS" for delete to authenticated using (true);

drop policy if exists "ENTREGADORES controle leitura autenticada" on public."ENTREGADORES";
drop policy if exists "ENTREGADORES controle inserir autenticado" on public."ENTREGADORES";
drop policy if exists "ENTREGADORES controle editar autenticado" on public."ENTREGADORES";
drop policy if exists "ENTREGADORES controle excluir autenticado" on public."ENTREGADORES";

create policy "ENTREGADORES controle leitura autenticada" on public."ENTREGADORES" for select to authenticated using (true);
create policy "ENTREGADORES controle inserir autenticado" on public."ENTREGADORES" for insert to authenticated with check (true);
create policy "ENTREGADORES controle editar autenticado" on public."ENTREGADORES" for update to authenticated using (true) with check (true);
create policy "ENTREGADORES controle excluir autenticado" on public."ENTREGADORES" for delete to authenticated using (true);

drop policy if exists "VENDEDORAS controle leitura autenticada" on public."VENDEDORAS";
drop policy if exists "VENDEDORAS controle inserir autenticado" on public."VENDEDORAS";
drop policy if exists "VENDEDORAS controle editar autenticado" on public."VENDEDORAS";
drop policy if exists "VENDEDORAS controle excluir autenticado" on public."VENDEDORAS";

create policy "VENDEDORAS controle leitura autenticada" on public."VENDEDORAS" for select to authenticated using (true);
create policy "VENDEDORAS controle inserir autenticado" on public."VENDEDORAS" for insert to authenticated with check (true);
create policy "VENDEDORAS controle editar autenticado" on public."VENDEDORAS" for update to authenticated using (true) with check (true);
create policy "VENDEDORAS controle excluir autenticado" on public."VENDEDORAS" for delete to authenticated using (true);

drop policy if exists "REPASSES_ENTREGADORES controle leitura autenticada" on public."REPASSES_ENTREGADORES";
drop policy if exists "REPASSES_ENTREGADORES controle inserir autenticado" on public."REPASSES_ENTREGADORES";
drop policy if exists "REPASSES_ENTREGADORES controle editar autenticado" on public."REPASSES_ENTREGADORES";
drop policy if exists "REPASSES_ENTREGADORES controle excluir autenticado" on public."REPASSES_ENTREGADORES";

create policy "REPASSES_ENTREGADORES controle leitura autenticada" on public."REPASSES_ENTREGADORES" for select to authenticated using (true);
create policy "REPASSES_ENTREGADORES controle inserir autenticado" on public."REPASSES_ENTREGADORES" for insert to authenticated with check (true);
create policy "REPASSES_ENTREGADORES controle editar autenticado" on public."REPASSES_ENTREGADORES" for update to authenticated using (true) with check (true);
create policy "REPASSES_ENTREGADORES controle excluir autenticado" on public."REPASSES_ENTREGADORES" for delete to authenticated using (true);

select pg_notify('pgrst', 'reload schema');
