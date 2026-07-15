-- Fumacinha - pedidos do site antes da confirmacao da venda
-- Execute no SQL Editor do Supabase da Fumacinha.
-- Idempotente: cria/ajusta sem apagar dados existentes.

create sequence if not exists public.pedidos_codigo_seq start 1;

create table if not exists public."PEDIDOS" (
  id bigserial primary key,
  codigo text not null default ('FUM-' || lpad(nextval('public.pedidos_codigo_seq')::text, 6, '0')),
  cliente_nome text not null default '',
  cliente_bairro text not null default '',
  cliente_telefone text not null default '',
  origem text not null default 'Site',
  status text not null default 'Aguardando confirmacao',
  valor_produtos numeric(12, 2) not null default 0,
  venda_id bigint,
  motivo_cancelamento text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  confirmado_em timestamptz,
  cancelado_em timestamptz
);

alter table public."PEDIDOS" add column if not exists codigo text not null default ('FUM-' || lpad(nextval('public.pedidos_codigo_seq')::text, 6, '0'));
alter table public."PEDIDOS" add column if not exists cliente_nome text not null default '';
alter table public."PEDIDOS" add column if not exists cliente_bairro text not null default '';
alter table public."PEDIDOS" add column if not exists cliente_telefone text not null default '';
alter table public."PEDIDOS" add column if not exists origem text not null default 'Site';
alter table public."PEDIDOS" add column if not exists status text not null default 'Aguardando confirmacao';
alter table public."PEDIDOS" add column if not exists valor_produtos numeric(12, 2) not null default 0;
alter table public."PEDIDOS" add column if not exists venda_id bigint;
alter table public."PEDIDOS" add column if not exists motivo_cancelamento text not null default '';
alter table public."PEDIDOS" add column if not exists created_at timestamptz not null default now();
alter table public."PEDIDOS" add column if not exists updated_at timestamptz not null default now();
alter table public."PEDIDOS" add column if not exists confirmado_em timestamptz;
alter table public."PEDIDOS" add column if not exists cancelado_em timestamptz;

create table if not exists public."ITENS_PEDIDO" (
  id bigserial primary key,
  pedido_id bigint not null,
  produto_id text not null default '',
  produto_nome text not null default '',
  produto_imagem text not null default '',
  quantidade integer not null default 1,
  valor_unitario numeric(12, 2) not null default 0,
  subtotal numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

alter table public."ITENS_PEDIDO" add column if not exists pedido_id bigint;
alter table public."ITENS_PEDIDO" add column if not exists produto_id text not null default '';
alter table public."ITENS_PEDIDO" add column if not exists produto_nome text not null default '';
alter table public."ITENS_PEDIDO" add column if not exists produto_imagem text not null default '';
alter table public."ITENS_PEDIDO" add column if not exists quantidade integer not null default 1;
alter table public."ITENS_PEDIDO" add column if not exists valor_unitario numeric(12, 2) not null default 0;
alter table public."ITENS_PEDIDO" add column if not exists subtotal numeric(12, 2) not null default 0;
alter table public."ITENS_PEDIDO" add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'pedidos_codigo_key'
      and conrelid = 'public."PEDIDOS"'::regclass
  ) then
    alter table public."PEDIDOS"
    add constraint pedidos_codigo_key unique (codigo);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'pedidos_venda_id_fkey'
      and conrelid = 'public."PEDIDOS"'::regclass
  ) then
    alter table public."PEDIDOS"
    add constraint pedidos_venda_id_fkey
    foreign key (venda_id) references public."VENDAS"(id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'itens_pedido_pedido_id_fkey'
      and conrelid = 'public."ITENS_PEDIDO"'::regclass
  ) then
    alter table public."ITENS_PEDIDO"
    add constraint itens_pedido_pedido_id_fkey
    foreign key (pedido_id) references public."PEDIDOS"(id) on delete cascade;
  end if;
end;
$$;

create index if not exists pedidos_status_idx on public."PEDIDOS" (status);
create index if not exists pedidos_created_at_idx on public."PEDIDOS" (created_at desc);
create index if not exists pedidos_origem_idx on public."PEDIDOS" (origem);
create index if not exists pedidos_venda_id_idx on public."PEDIDOS" (venda_id);
create index if not exists pedidos_cliente_telefone_idx on public."PEDIDOS" (cliente_telefone);
create index if not exists itens_pedido_pedido_id_idx on public."ITENS_PEDIDO" (pedido_id);
create index if not exists itens_pedido_produto_id_idx on public."ITENS_PEDIDO" (produto_id);

alter table public."PEDIDOS" enable row level security;
alter table public."ITENS_PEDIDO" enable row level security;

grant usage on schema public to anon, authenticated;
grant usage, select on sequence public.pedidos_codigo_seq to anon, authenticated;
grant select, insert, update, delete on public."PEDIDOS" to authenticated;
grant select, insert, update, delete on public."ITENS_PEDIDO" to authenticated;
grant usage, select on all sequences in schema public to authenticated;

drop policy if exists "PEDIDOS leitura autenticada" on public."PEDIDOS";
drop policy if exists "PEDIDOS inserir autenticado" on public."PEDIDOS";
drop policy if exists "PEDIDOS editar autenticado" on public."PEDIDOS";
drop policy if exists "PEDIDOS excluir autenticado" on public."PEDIDOS";

create policy "PEDIDOS leitura autenticada" on public."PEDIDOS" for select to authenticated using (true);
create policy "PEDIDOS inserir autenticado" on public."PEDIDOS" for insert to authenticated with check (true);
create policy "PEDIDOS editar autenticado" on public."PEDIDOS" for update to authenticated using (true) with check (true);
create policy "PEDIDOS excluir autenticado" on public."PEDIDOS" for delete to authenticated using (true);

drop policy if exists "ITENS_PEDIDO leitura autenticada" on public."ITENS_PEDIDO";
drop policy if exists "ITENS_PEDIDO inserir autenticado" on public."ITENS_PEDIDO";
drop policy if exists "ITENS_PEDIDO editar autenticado" on public."ITENS_PEDIDO";
drop policy if exists "ITENS_PEDIDO excluir autenticado" on public."ITENS_PEDIDO";

create policy "ITENS_PEDIDO leitura autenticada" on public."ITENS_PEDIDO" for select to authenticated using (true);
create policy "ITENS_PEDIDO inserir autenticado" on public."ITENS_PEDIDO" for insert to authenticated with check (true);
create policy "ITENS_PEDIDO editar autenticado" on public."ITENS_PEDIDO" for update to authenticated using (true) with check (true);
create policy "ITENS_PEDIDO excluir autenticado" on public."ITENS_PEDIDO" for delete to authenticated using (true);

create or replace function public.registrar_pedido_site(
  p_pedido jsonb,
  p_itens jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pedido public."PEDIDOS"%rowtype;
  v_item jsonb;
  v_total numeric(12, 2) := 0;
begin
  if coalesce(trim(p_pedido->>'cliente_nome'), '') = '' then
    raise exception 'Informe o nome do cliente.';
  end if;

  if jsonb_typeof(coalesce(p_itens, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_itens, '[]'::jsonb)) = 0 then
    raise exception 'Pedido sem produtos.';
  end if;

  for v_item in select * from jsonb_array_elements(p_itens)
  loop
    if coalesce((v_item->>'quantidade')::integer, 0) <= 0 then
      raise exception 'Quantidade invalida no pedido.';
    end if;
    v_total := v_total + round(coalesce((v_item->>'subtotal')::numeric, 0), 2);
  end loop;

  insert into public."PEDIDOS" (
    cliente_nome,
    cliente_bairro,
    cliente_telefone,
    origem,
    status,
    valor_produtos
  )
  values (
    trim(p_pedido->>'cliente_nome'),
    coalesce(trim(p_pedido->>'cliente_bairro'), ''),
    coalesce(nullif(regexp_replace(coalesce(p_pedido->>'cliente_telefone', ''), '\D', '', 'g'), ''), ''),
    coalesce(nullif(trim(p_pedido->>'origem'), ''), 'Site'),
    'Aguardando confirmacao',
    v_total
  )
  returning * into v_pedido;

  for v_item in select * from jsonb_array_elements(p_itens)
  loop
    insert into public."ITENS_PEDIDO" (
      pedido_id,
      produto_id,
      produto_nome,
      produto_imagem,
      quantidade,
      valor_unitario,
      subtotal
    )
    values (
      v_pedido.id,
      coalesce(v_item->>'produto_id', ''),
      coalesce(v_item->>'produto_nome', ''),
      coalesce(v_item->>'produto_imagem', ''),
      coalesce((v_item->>'quantidade')::integer, 1),
      round(coalesce((v_item->>'valor_unitario')::numeric, 0), 2),
      round(coalesce((v_item->>'subtotal')::numeric, 0), 2)
    );
  end loop;

  return jsonb_build_object(
    'id', v_pedido.id,
    'codigo', v_pedido.codigo,
    'status', v_pedido.status,
    'valor_produtos', v_pedido.valor_produtos,
    'created_at', v_pedido.created_at
  );
end;
$$;

grant execute on function public.registrar_pedido_site(jsonb, jsonb) to anon, authenticated;

select pg_notify('pgrst', 'reload schema');
