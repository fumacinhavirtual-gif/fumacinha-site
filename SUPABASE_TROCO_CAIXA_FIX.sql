-- Fumacinha Controle - correcao de troco em vendas em dinheiro e fechamento de caixa
-- Execute no SQL Editor do Supabase da Fumacinha.
-- Idempotente: adiciona colunas sem apagar dados.

create table if not exists public."FECHAMENTOS_CAIXA" (
  id bigserial primary key,
  data_caixa date not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public."VENDAS" add column if not exists valor_produtos numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists taxa_entrega numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists total_venda numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists valor_entregue numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists troco numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists forma_pagamento text not null default 'Pix';

update public."VENDAS"
set
  valor_produtos = coalesce(nullif(valor_produtos, 0), valor_total, 0),
  total_venda = case
    when coalesce(total_venda, 0) = 0 then coalesce(nullif(valor_produtos, 0), valor_total, 0) + coalesce(taxa_entrega, 0)
    else total_venda
  end,
  valor_entregue = case
    when coalesce(valor_entregue, 0) = 0 then coalesce(nullif(valor_recebido, 0), coalesce(nullif(valor_produtos, 0), valor_total, 0) + coalesce(taxa_entrega, 0))
    else valor_entregue
  end,
  troco = greatest(coalesce(troco, 0), 0)
where true;

alter table public."FECHAMENTOS_CAIXA" add column if not exists total_dinheiro_recebido numeric(12, 2) not null default 0;
alter table public."FECHAMENTOS_CAIXA" add column if not exists total_troco_devolvido numeric(12, 2) not null default 0;
alter table public."FECHAMENTOS_CAIXA" add column if not exists dinheiro_liquido numeric(12, 2) not null default 0;
alter table public."FECHAMENTOS_CAIXA" add column if not exists troco_inicial numeric(12, 2) not null default 0;
alter table public."FECHAMENTOS_CAIXA" add column if not exists troco_restante numeric(12, 2) not null default 0;
alter table public."FECHAMENTOS_CAIXA" add column if not exists dinheiro_esperado numeric(12, 2) not null default 0;
alter table public."FECHAMENTOS_CAIXA" add column if not exists dinheiro_contado numeric(12, 2) not null default 0;
alter table public."FECHAMENTOS_CAIXA" add column if not exists diferenca numeric(12, 2) not null default 0;

create index if not exists vendas_forma_pagamento_idx on public."VENDAS" (forma_pagamento);
create index if not exists vendas_data_pagamento_idx on public."VENDAS" (data_venda, forma_pagamento);
create index if not exists fechamentos_caixa_dinheiro_idx on public."FECHAMENTOS_CAIXA" (data_caixa, dinheiro_esperado);

alter table public."VENDAS" enable row level security;
alter table public."FECHAMENTOS_CAIXA" enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public."VENDAS" to authenticated;
grant select, insert, update, delete on public."FECHAMENTOS_CAIXA" to authenticated;
grant usage, select on all sequences in schema public to authenticated;

drop policy if exists "VENDAS troco leitura autenticada" on public."VENDAS";
drop policy if exists "VENDAS troco inserir autenticado" on public."VENDAS";
drop policy if exists "VENDAS troco editar autenticado" on public."VENDAS";
drop policy if exists "VENDAS troco excluir autenticado" on public."VENDAS";

create policy "VENDAS troco leitura autenticada"
on public."VENDAS"
for select
to authenticated
using (true);

create policy "VENDAS troco inserir autenticado"
on public."VENDAS"
for insert
to authenticated
with check (true);

create policy "VENDAS troco editar autenticado"
on public."VENDAS"
for update
to authenticated
using (true)
with check (true);

create policy "VENDAS troco excluir autenticado"
on public."VENDAS"
for delete
to authenticated
using (true);

drop policy if exists "FECHAMENTOS_CAIXA troco leitura autenticada" on public."FECHAMENTOS_CAIXA";
drop policy if exists "FECHAMENTOS_CAIXA troco inserir autenticado" on public."FECHAMENTOS_CAIXA";
drop policy if exists "FECHAMENTOS_CAIXA troco editar autenticado" on public."FECHAMENTOS_CAIXA";
drop policy if exists "FECHAMENTOS_CAIXA troco excluir autenticado" on public."FECHAMENTOS_CAIXA";

create policy "FECHAMENTOS_CAIXA troco leitura autenticada"
on public."FECHAMENTOS_CAIXA"
for select
to authenticated
using (true);

create policy "FECHAMENTOS_CAIXA troco inserir autenticado"
on public."FECHAMENTOS_CAIXA"
for insert
to authenticated
with check (true);

create policy "FECHAMENTOS_CAIXA troco editar autenticado"
on public."FECHAMENTOS_CAIXA"
for update
to authenticated
using (true)
with check (true);

create policy "FECHAMENTOS_CAIXA troco excluir autenticado"
on public."FECHAMENTOS_CAIXA"
for delete
to authenticated
using (true);

select pg_notify('pgrst', 'reload schema');
