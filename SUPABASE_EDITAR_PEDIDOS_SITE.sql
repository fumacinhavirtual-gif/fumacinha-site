-- Fumacinha - edicao de pedidos pendentes do site
-- Execute no SQL Editor do Supabase da Fumacinha.
-- Idempotente: adiciona campos e historico sem apagar dados existentes.

alter table public."PEDIDOS" add column if not exists forma_pagamento text not null default 'Pix';
alter table public."PEDIDOS" add column if not exists valor_pago_cliente numeric(12, 2) not null default 0;
alter table public."PEDIDOS" add column if not exists teve_troco boolean not null default false;
alter table public."PEDIDOS" add column if not exists troco numeric(12, 2) not null default 0;
alter table public."PEDIDOS" add column if not exists taxa_entrega numeric(12, 2) not null default 0;
alter table public."PEDIDOS" add column if not exists desconto numeric(12, 2) not null default 0;
alter table public."PEDIDOS" add column if not exists vendedora_id bigint;
alter table public."PEDIDOS" add column if not exists entregador_id bigint;
alter table public."PEDIDOS" add column if not exists data_entrega date;
alter table public."PEDIDOS" add column if not exists horario_rota text;
alter table public."PEDIDOS" add column if not exists rota_data_hora timestamptz;
alter table public."PEDIDOS" add column if not exists status_entrega text not null default 'Aguardando';
alter table public."PEDIDOS" add column if not exists observacao_interna text not null default '';
alter table public."PEDIDOS" add column if not exists cliente_telefone text not null default '';
alter table public."PEDIDOS" add column if not exists updated_at timestamptz not null default now();
alter table public."PEDIDOS" add column if not exists venda_id bigint;

alter table public."ITENS_PEDIDO" add column if not exists produto_id text not null default '';
alter table public."ITENS_PEDIDO" add column if not exists produto_nome text not null default '';
alter table public."ITENS_PEDIDO" add column if not exists produto_imagem text not null default '';
alter table public."ITENS_PEDIDO" add column if not exists quantidade integer not null default 1;
alter table public."ITENS_PEDIDO" add column if not exists valor_unitario numeric(12, 2) not null default 0;
alter table public."ITENS_PEDIDO" add column if not exists subtotal numeric(12, 2) not null default 0;

create table if not exists public."ALTERACOES_PEDIDO" (
  id bigserial primary key,
  pedido_id bigint not null,
  dados_anteriores jsonb not null default '{}'::jsonb,
  dados_novos jsonb not null default '{}'::jsonb,
  motivo text not null default '',
  usuario_id uuid default auth.uid(),
  created_at timestamptz not null default now()
);

alter table public."ALTERACOES_PEDIDO" add column if not exists pedido_id bigint;
alter table public."ALTERACOES_PEDIDO" add column if not exists dados_anteriores jsonb not null default '{}'::jsonb;
alter table public."ALTERACOES_PEDIDO" add column if not exists dados_novos jsonb not null default '{}'::jsonb;
alter table public."ALTERACOES_PEDIDO" add column if not exists motivo text not null default '';
alter table public."ALTERACOES_PEDIDO" add column if not exists usuario_id uuid default auth.uid();
alter table public."ALTERACOES_PEDIDO" add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'alteracoes_pedido_pedido_id_fkey'
      and conrelid = 'public."ALTERACOES_PEDIDO"'::regclass
  ) then
    alter table public."ALTERACOES_PEDIDO"
    add constraint alteracoes_pedido_pedido_id_fkey
    foreign key (pedido_id) references public."PEDIDOS"(id) on delete cascade;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'VENDEDORAS') then
    if not exists (
      select 1 from pg_constraint
      where conname = 'pedidos_vendedora_id_fkey'
        and conrelid = 'public."PEDIDOS"'::regclass
    ) then
      alter table public."PEDIDOS"
      add constraint pedidos_vendedora_id_fkey
      foreign key (vendedora_id) references public."VENDEDORAS"(id) on delete set null;
    end if;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'ENTREGADORES') then
    if not exists (
      select 1 from pg_constraint
      where conname = 'pedidos_entregador_id_fkey'
        and conrelid = 'public."PEDIDOS"'::regclass
    ) then
      alter table public."PEDIDOS"
      add constraint pedidos_entregador_id_fkey
      foreign key (entregador_id) references public."ENTREGADORES"(id) on delete set null;
    end if;
  end if;
end;
$$;

create index if not exists pedidos_status_entrega_idx on public."PEDIDOS" (status_entrega);
create index if not exists pedidos_data_entrega_idx on public."PEDIDOS" (data_entrega);
create index if not exists pedidos_vendedora_id_idx on public."PEDIDOS" (vendedora_id);
create index if not exists pedidos_entregador_id_idx on public."PEDIDOS" (entregador_id);
create index if not exists alteracoes_pedido_pedido_id_idx on public."ALTERACOES_PEDIDO" (pedido_id);
create index if not exists alteracoes_pedido_created_at_idx on public."ALTERACOES_PEDIDO" (created_at desc);

alter table public."PEDIDOS" enable row level security;
alter table public."ITENS_PEDIDO" enable row level security;
alter table public."ALTERACOES_PEDIDO" enable row level security;

grant select, insert, update, delete on public."PEDIDOS" to authenticated;
grant select, insert, update, delete on public."ITENS_PEDIDO" to authenticated;
grant select, insert, update, delete on public."ALTERACOES_PEDIDO" to authenticated;
grant usage, select on all sequences in schema public to authenticated;

drop policy if exists "ALTERACOES_PEDIDO leitura autenticada" on public."ALTERACOES_PEDIDO";
drop policy if exists "ALTERACOES_PEDIDO inserir autenticado" on public."ALTERACOES_PEDIDO";
drop policy if exists "ALTERACOES_PEDIDO editar autenticado" on public."ALTERACOES_PEDIDO";
drop policy if exists "ALTERACOES_PEDIDO excluir autenticado" on public."ALTERACOES_PEDIDO";

create policy "ALTERACOES_PEDIDO leitura autenticada"
on public."ALTERACOES_PEDIDO"
for select
to authenticated
using (true);

create policy "ALTERACOES_PEDIDO inserir autenticado"
on public."ALTERACOES_PEDIDO"
for insert
to authenticated
with check (true);

create policy "ALTERACOES_PEDIDO editar autenticado"
on public."ALTERACOES_PEDIDO"
for update
to authenticated
using (true)
with check (true);

create policy "ALTERACOES_PEDIDO excluir autenticado"
on public."ALTERACOES_PEDIDO"
for delete
to authenticated
using (true);

select pg_notify('pgrst', 'reload schema');
