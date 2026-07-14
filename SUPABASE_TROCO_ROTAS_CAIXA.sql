-- Fumacinha Controle - troco em dinheiro, rotas de entrega e caixa
-- Execute no SQL Editor do Supabase da Fumacinha.
-- Idempotente: adiciona/ajusta sem apagar dados existentes.

alter table public."VENDAS" add column if not exists valor_produtos numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists valor_pago_cliente numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists valor_entregue numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists teve_troco boolean not null default false;
alter table public."VENDAS" add column if not exists troco numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists taxa_entrega numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists total_venda numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists forma_pagamento text not null default 'Pix';
alter table public."VENDAS" add column if not exists status text not null default 'concluida';
alter table public."VENDAS" add column if not exists cancelada boolean not null default false;
alter table public."VENDAS" add column if not exists created_at timestamptz not null default now();
alter table public."VENDAS" add column if not exists data_entrega date;
alter table public."VENDAS" add column if not exists horario_rota text not null default '';
alter table public."VENDAS" add column if not exists rota_data_hora timestamptz;
alter table public."VENDAS" add column if not exists status_entrega text not null default 'Aguardando';

update public."VENDAS"
set
  valor_produtos = coalesce(nullif(valor_produtos, 0), valor_total, 0),
  total_venda = case
    when coalesce(total_venda, 0) = 0 then coalesce(nullif(valor_produtos, 0), valor_total, 0) + coalesce(taxa_entrega, 0)
    else total_venda
  end,
  valor_pago_cliente = case
    when coalesce(valor_pago_cliente, 0) = 0 then coalesce(nullif(valor_entregue, 0), nullif(valor_recebido, 0), coalesce(nullif(valor_produtos, 0), valor_total, 0) + coalesce(taxa_entrega, 0))
    else valor_pago_cliente
  end,
  valor_entregue = case
    when coalesce(valor_entregue, 0) = 0 then coalesce(nullif(valor_pago_cliente, 0), nullif(valor_recebido, 0), coalesce(nullif(valor_produtos, 0), valor_total, 0) + coalesce(taxa_entrega, 0))
    else valor_entregue
  end,
  troco = greatest(coalesce(troco, 0), 0),
  teve_troco = case when coalesce(troco, 0) > 0 then true else teve_troco end,
  status = case when coalesce(cancelada, false) then 'cancelada' else coalesce(nullif(status, ''), 'concluida') end,
  status_entrega = case when coalesce(cancelada, false) then 'Cancelado' else coalesce(nullif(status_entrega, ''), 'Aguardando') end,
  data_entrega = coalesce(data_entrega, (coalesce(data_venda, created_at, now()))::date),
  rota_data_hora = coalesce(rota_data_hora, coalesce(data_venda, created_at, now()))
where true;

create table if not exists public."FECHAMENTOS_CAIXA" (
  id bigserial primary key,
  data_caixa date not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public."FECHAMENTOS_CAIXA" add column if not exists total_dinheiro_recebido numeric(12, 2) not null default 0;
alter table public."FECHAMENTOS_CAIXA" add column if not exists total_troco_devolvido numeric(12, 2) not null default 0;
alter table public."FECHAMENTOS_CAIXA" add column if not exists dinheiro_liquido numeric(12, 2) not null default 0;
alter table public."FECHAMENTOS_CAIXA" add column if not exists troco_inicial numeric(12, 2) not null default 0;
alter table public."FECHAMENTOS_CAIXA" add column if not exists troco_usado numeric(12, 2) not null default 0;
alter table public."FECHAMENTOS_CAIXA" add column if not exists troco_restante numeric(12, 2) not null default 0;
alter table public."FECHAMENTOS_CAIXA" add column if not exists dinheiro_esperado numeric(12, 2) not null default 0;
alter table public."FECHAMENTOS_CAIXA" add column if not exists dinheiro_contado numeric(12, 2) not null default 0;
alter table public."FECHAMENTOS_CAIXA" add column if not exists diferenca numeric(12, 2) not null default 0;

create index if not exists vendas_forma_pagamento_idx on public."VENDAS" (forma_pagamento);
create index if not exists vendas_status_idx on public."VENDAS" (status);
create index if not exists vendas_data_entrega_idx on public."VENDAS" (data_entrega);
create index if not exists vendas_horario_rota_idx on public."VENDAS" (horario_rota);
create index if not exists vendas_rota_data_hora_idx on public."VENDAS" (rota_data_hora);
create index if not exists vendas_status_entrega_idx on public."VENDAS" (status_entrega);
create index if not exists vendas_rotas_dia_idx on public."VENDAS" (data_entrega, horario_rota, status_entrega);
create index if not exists fechamentos_caixa_dinheiro_idx on public."FECHAMENTOS_CAIXA" (data_caixa, dinheiro_esperado);

alter table public."VENDAS" enable row level security;
alter table public."FECHAMENTOS_CAIXA" enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public."VENDAS" to authenticated;
grant select, insert, update, delete on public."FECHAMENTOS_CAIXA" to authenticated;
grant usage, select on all sequences in schema public to authenticated;

drop policy if exists "VENDAS rotas caixa leitura autenticada" on public."VENDAS";
drop policy if exists "VENDAS rotas caixa inserir autenticado" on public."VENDAS";
drop policy if exists "VENDAS rotas caixa editar autenticado" on public."VENDAS";
drop policy if exists "VENDAS rotas caixa excluir autenticado" on public."VENDAS";

create policy "VENDAS rotas caixa leitura autenticada" on public."VENDAS" for select to authenticated using (true);
create policy "VENDAS rotas caixa inserir autenticado" on public."VENDAS" for insert to authenticated with check (true);
create policy "VENDAS rotas caixa editar autenticado" on public."VENDAS" for update to authenticated using (true) with check (true);
create policy "VENDAS rotas caixa excluir autenticado" on public."VENDAS" for delete to authenticated using (true);

drop policy if exists "FECHAMENTOS_CAIXA rotas leitura autenticada" on public."FECHAMENTOS_CAIXA";
drop policy if exists "FECHAMENTOS_CAIXA rotas inserir autenticado" on public."FECHAMENTOS_CAIXA";
drop policy if exists "FECHAMENTOS_CAIXA rotas editar autenticado" on public."FECHAMENTOS_CAIXA";
drop policy if exists "FECHAMENTOS_CAIXA rotas excluir autenticado" on public."FECHAMENTOS_CAIXA";

create policy "FECHAMENTOS_CAIXA rotas leitura autenticada" on public."FECHAMENTOS_CAIXA" for select to authenticated using (true);
create policy "FECHAMENTOS_CAIXA rotas inserir autenticado" on public."FECHAMENTOS_CAIXA" for insert to authenticated with check (true);
create policy "FECHAMENTOS_CAIXA rotas editar autenticado" on public."FECHAMENTOS_CAIXA" for update to authenticated using (true) with check (true);
create policy "FECHAMENTOS_CAIXA rotas excluir autenticado" on public."FECHAMENTOS_CAIXA" for delete to authenticated using (true);

select pg_notify('pgrst', 'reload schema');
