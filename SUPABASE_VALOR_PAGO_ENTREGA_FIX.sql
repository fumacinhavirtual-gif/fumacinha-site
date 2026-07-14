-- Fumacinha Controle - valor pago em todas as formas e horario automatico da venda
-- Execute no SQL Editor do Supabase da Fumacinha.
-- Idempotente: adiciona/ajusta sem apagar dados existentes.

alter table public."VENDAS" add column if not exists valor_produtos numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists valor_pago_cliente numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists forma_pagamento text not null default 'Pix';
alter table public."VENDAS" add column if not exists teve_troco boolean not null default false;
alter table public."VENDAS" add column if not exists troco numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists taxa_entrega numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists data_entrega date;
alter table public."VENDAS" add column if not exists horario_rota text not null default '';
alter table public."VENDAS" add column if not exists rota_data_hora timestamptz;
alter table public."VENDAS" add column if not exists created_at timestamptz not null default now();

alter table public."VENDAS" alter column created_at set default now();

update public."VENDAS"
set
  valor_produtos = coalesce(nullif(valor_produtos, 0), valor_total, 0),
  valor_pago_cliente = case
    when coalesce(valor_pago_cliente, 0) = 0 then coalesce(nullif(valor_entregue, 0), nullif(valor_recebido, 0), coalesce(nullif(valor_produtos, 0), valor_total, 0) + coalesce(taxa_entrega, 0))
    else valor_pago_cliente
  end,
  data_entrega = coalesce(data_entrega, (coalesce(rota_data_hora, data_venda, created_at, now()))::date),
  rota_data_hora = coalesce(rota_data_hora, case when data_entrega is not null and nullif(horario_rota, '') is not null then (data_entrega::text || ' ' || horario_rota)::timestamp at time zone current_setting('timezone') else coalesce(data_venda, created_at, now()) end)
where true;

create index if not exists vendas_created_at_idx on public."VENDAS" (created_at);
create index if not exists vendas_valor_pago_idx on public."VENDAS" (valor_pago_cliente);
create index if not exists vendas_entrega_rota_idx on public."VENDAS" (data_entrega, horario_rota);

alter table public."VENDAS" enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public."VENDAS" to authenticated;
grant usage, select on all sequences in schema public to authenticated;

drop policy if exists "VENDAS valor pago leitura autenticada" on public."VENDAS";
drop policy if exists "VENDAS valor pago inserir autenticado" on public."VENDAS";
drop policy if exists "VENDAS valor pago editar autenticado" on public."VENDAS";
drop policy if exists "VENDAS valor pago excluir autenticado" on public."VENDAS";

create policy "VENDAS valor pago leitura autenticada" on public."VENDAS" for select to authenticated using (true);
create policy "VENDAS valor pago inserir autenticado" on public."VENDAS" for insert to authenticated with check (true);
create policy "VENDAS valor pago editar autenticado" on public."VENDAS" for update to authenticated using (true) with check (true);
create policy "VENDAS valor pago excluir autenticado" on public."VENDAS" for delete to authenticated using (true);

select pg_notify('pgrst', 'reload schema');
