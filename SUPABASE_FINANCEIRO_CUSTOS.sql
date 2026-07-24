-- Fumacinha Controle - custos, lucro realizado e resumo financeiro
-- Execute no SQL Editor do Supabase da Fumacinha.
-- Idempotente: adiciona colunas sem apagar dados existentes.

alter table public."PRODUTOS" add column if not exists custo numeric(12, 2) not null default 0;

alter table public."VENDAS" add column if not exists custo_unitario numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists custo_total numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists lucro_total numeric(12, 2);

alter table public."ITENS_VENDA" add column if not exists custo_unitario numeric(12, 2) not null default 0;
alter table public."ITENS_VENDA" add column if not exists custo_total numeric(12, 2) not null default 0;
alter table public."ITENS_VENDA" add column if not exists lucro_total numeric(12, 2);

update public."ITENS_VENDA"
set
  custo_total = coalesce(custo_total, 0)
where custo_total is null;

update public."VENDAS" venda
set
  custo_total = coalesce(venda.custo_total, itens.custo_total, 0)
from (
  select
    venda_id,
    sum(coalesce(custo_total, 0)) as custo_total
  from public."ITENS_VENDA"
  group by venda_id
) itens
where venda.id = itens.venda_id;

create index if not exists produtos_custo_idx on public."PRODUTOS" (custo);
create index if not exists vendas_custo_lucro_idx on public."VENDAS" (data_venda, cancelada, custo_total, lucro_total);
create index if not exists itens_venda_custo_lucro_idx on public."ITENS_VENDA" (venda_id, custo_total, lucro_total);

alter table public."PRODUTOS" enable row level security;
alter table public."VENDAS" enable row level security;
alter table public."ITENS_VENDA" enable row level security;

grant select, insert, update, delete on public."PRODUTOS" to authenticated;
grant select, insert, update, delete on public."VENDAS" to authenticated;
grant select, insert, update, delete on public."ITENS_VENDA" to authenticated;
