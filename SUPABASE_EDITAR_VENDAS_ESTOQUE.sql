-- Fumacinha Controle - editar vendas com ajuste transacional de estoque
-- Execute no SQL Editor do Supabase da Fumacinha.
-- Idempotente: cria/ajusta sem apagar dados existentes.

alter table public."VENDAS" add column if not exists quantidade_total integer not null default 1;
alter table public."VENDAS" add column if not exists valor_produtos numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists total_venda numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists valor_pago_cliente numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists valor_entregue numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists teve_troco boolean not null default false;
alter table public."VENDAS" add column if not exists troco numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists taxa_entrega numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists desconto numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists entregador_id bigint;
alter table public."VENDAS" add column if not exists entregador_nome text not null default '';
alter table public."VENDAS" add column if not exists vendedora_id bigint;
alter table public."VENDAS" add column if not exists vendedora_nome text not null default '';
alter table public."VENDAS" add column if not exists comissao_base numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists comissao_cartao numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists comissao_total numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists cliente_nome text not null default '';
alter table public."VENDAS" add column if not exists observacao text not null default '';
alter table public."VENDAS" add column if not exists data_entrega date;
alter table public."VENDAS" add column if not exists horario_rota text not null default '';
alter table public."VENDAS" add column if not exists rota_data_hora timestamptz;
alter table public."VENDAS" add column if not exists status_entrega text not null default 'Aguardando';
alter table public."VENDAS" add column if not exists status text not null default 'concluida';
alter table public."VENDAS" add column if not exists cancelada boolean not null default false;
alter table public."VENDAS" add column if not exists custo_unitario numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists custo_total numeric(12, 2) not null default 0;

create table if not exists public."ALTERACOES_VENDA" (
  id bigserial primary key,
  venda_id bigint not null,
  dados_anteriores jsonb not null default '{}'::jsonb,
  dados_novos jsonb not null default '{}'::jsonb,
  alterado_por text not null default '',
  motivo text not null default '',
  created_at timestamptz not null default now()
);

alter table public."ALTERACOES_VENDA" add column if not exists venda_id bigint;
alter table public."ALTERACOES_VENDA" add column if not exists dados_anteriores jsonb not null default '{}'::jsonb;
alter table public."ALTERACOES_VENDA" add column if not exists dados_novos jsonb not null default '{}'::jsonb;
alter table public."ALTERACOES_VENDA" add column if not exists alterado_por text not null default '';
alter table public."ALTERACOES_VENDA" add column if not exists motivo text not null default '';
alter table public."ALTERACOES_VENDA" add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'alteracoes_venda_venda_id_fkey'
      and conrelid = 'public."ALTERACOES_VENDA"'::regclass
  ) then
    alter table public."ALTERACOES_VENDA"
    add constraint alteracoes_venda_venda_id_fkey
    foreign key (venda_id) references public."VENDAS"(id) on delete cascade;
  end if;
end;
$$;

create index if not exists alteracoes_venda_venda_id_idx on public."ALTERACOES_VENDA" (venda_id);
create index if not exists alteracoes_venda_created_at_idx on public."ALTERACOES_VENDA" (created_at);

alter table public."ALTERACOES_VENDA" enable row level security;
grant select, insert, update, delete on public."ALTERACOES_VENDA" to authenticated;
grant usage, select on all sequences in schema public to authenticated;

drop policy if exists "ALTERACOES_VENDA leitura autenticada" on public."ALTERACOES_VENDA";
drop policy if exists "ALTERACOES_VENDA inserir autenticado" on public."ALTERACOES_VENDA";
drop policy if exists "ALTERACOES_VENDA editar autenticado" on public."ALTERACOES_VENDA";
drop policy if exists "ALTERACOES_VENDA excluir autenticado" on public."ALTERACOES_VENDA";

create policy "ALTERACOES_VENDA leitura autenticada" on public."ALTERACOES_VENDA" for select to authenticated using (true);
create policy "ALTERACOES_VENDA inserir autenticado" on public."ALTERACOES_VENDA" for insert to authenticated with check (true);
create policy "ALTERACOES_VENDA editar autenticado" on public."ALTERACOES_VENDA" for update to authenticated using (true) with check (true);
create policy "ALTERACOES_VENDA excluir autenticado" on public."ALTERACOES_VENDA" for delete to authenticated using (true);

create or replace function public.editar_venda_estoque(
  p_venda_id bigint,
  p_venda jsonb,
  p_itens jsonb,
  p_motivo text
)
returns void
language plpgsql
security definer
as $$
declare
  v_old jsonb;
  v_old_items jsonb;
  v_new_snapshot jsonb;
  v_alterado_por text;
  rec record;
  v_estoque numeric;
  v_nome text;
begin
  if p_motivo is null or btrim(p_motivo) = '' then
    raise exception 'Informe o motivo da alteracao.';
  end if;

  if jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'Informe ao menos um item na venda.';
  end if;

  select to_jsonb(v.*)
    into v_old
  from public."VENDAS" v
  where v.id = p_venda_id
  for update;

  if v_old is null then
    raise exception 'Venda nao encontrada.';
  end if;

  if coalesce((v_old->>'cancelada')::boolean, false) then
    raise exception 'Venda cancelada nao pode ser editada.';
  end if;

  select coalesce(jsonb_agg(to_jsonb(i.*)), '[]'::jsonb)
    into v_old_items
  from public."ITENS_VENDA" i
  where i.venda_id = p_venda_id;

  create temp table tmp_old_sale_items (
    produto_id text primary key,
    quantidade numeric not null default 0
  ) on commit drop;

  create temp table tmp_new_sale_items (
    produto_id text primary key,
    quantidade numeric not null default 0
  ) on commit drop;

  insert into tmp_old_sale_items (produto_id, quantidade)
  select produto_id, sum(quantidade)
  from jsonb_to_recordset(v_old_items) as x(produto_id text, quantidade numeric)
  group by produto_id;

  insert into tmp_new_sale_items (produto_id, quantidade)
  select produto_id, sum(quantidade)
  from jsonb_to_recordset(p_itens) as x(produto_id text, quantidade numeric)
  group by produto_id;

  for rec in
    select
      coalesce(n.produto_id, o.produto_id) as produto_id,
      coalesce(o.quantidade, 0) as quantidade_antiga,
      coalesce(n.quantidade, 0) as quantidade_nova,
      coalesce(n.quantidade, 0) - coalesce(o.quantidade, 0) as diferenca
    from tmp_old_sale_items o
    full join tmp_new_sale_items n on n.produto_id = o.produto_id
  loop
    if rec.diferenca <> 0 then
      select p.estoque, p.nome
        into v_estoque, v_nome
      from public."PRODUTOS" p
      where p.id::text = rec.produto_id
      for update;

      if v_estoque is null then
        raise exception 'Produto % nao encontrado.', rec.produto_id;
      end if;

      if rec.diferenca > 0 and v_estoque < rec.diferenca then
        raise exception 'Estoque insuficiente para %. Disponivel: %, necessario: %.', v_nome, v_estoque, rec.diferenca;
      end if;

      update public."PRODUTOS"
      set
        estoque = v_estoque - rec.diferenca,
        ativo = (v_estoque - rec.diferenca) > 0
      where id::text = rec.produto_id;
    end if;
  end loop;

  update public."VENDAS"
  set
    produto_id = p_venda->>'produto_id',
    nome_produto = p_venda->>'nome_produto',
    quantidade = coalesce((p_venda->>'quantidade')::integer, quantidade),
    quantidade_total = coalesce((p_venda->>'quantidade_total')::integer, quantidade_total),
    valor_unitario = coalesce((p_venda->>'valor_unitario')::numeric, valor_unitario),
    valor_total = coalesce((p_venda->>'valor_total')::numeric, valor_total),
    valor_produtos = coalesce((p_venda->>'valor_produtos')::numeric, valor_produtos),
    total_venda = coalesce((p_venda->>'total_venda')::numeric, total_venda),
    valor_recebido = coalesce((p_venda->>'valor_recebido')::numeric, valor_recebido),
    valor_pago_cliente = coalesce((p_venda->>'valor_pago_cliente')::numeric, valor_pago_cliente),
    valor_entregue = coalesce((p_venda->>'valor_entregue')::numeric, valor_entregue),
    teve_troco = coalesce((p_venda->>'teve_troco')::boolean, teve_troco),
    troco = coalesce((p_venda->>'troco')::numeric, troco),
    taxa_entrega = coalesce((p_venda->>'taxa_entrega')::numeric, taxa_entrega),
    desconto = coalesce((p_venda->>'desconto')::numeric, desconto),
    forma_pagamento = coalesce(nullif(p_venda->>'forma_pagamento', ''), forma_pagamento),
    entregador_id = nullif(p_venda->>'entregador_id', '')::bigint,
    entregador_nome = coalesce(p_venda->>'entregador_nome', ''),
    vendedora_id = nullif(p_venda->>'vendedora_id', '')::bigint,
    vendedora_nome = coalesce(p_venda->>'vendedora_nome', ''),
    comissao_base = coalesce((p_venda->>'comissao_base')::numeric, comissao_base),
    comissao_cartao = coalesce((p_venda->>'comissao_cartao')::numeric, comissao_cartao),
    comissao_total = coalesce((p_venda->>'comissao_total')::numeric, comissao_total),
    cliente_nome = coalesce(p_venda->>'cliente_nome', ''),
    observacao = coalesce(p_venda->>'observacao', ''),
    data_entrega = nullif(p_venda->>'data_entrega', '')::date,
    horario_rota = coalesce(p_venda->>'horario_rota', ''),
    rota_data_hora = nullif(p_venda->>'rota_data_hora', '')::timestamptz,
    status_entrega = coalesce(p_venda->>'status_entrega', status_entrega),
    status = coalesce(p_venda->>'status', status),
    custo_unitario = coalesce((p_venda->>'custo_unitario')::numeric, custo_unitario),
    custo_total = coalesce((p_venda->>'custo_total')::numeric, custo_total)
  where id = p_venda_id;

  delete from public."ITENS_VENDA"
  where venda_id = p_venda_id;

  insert into public."ITENS_VENDA" (
    venda_id,
    produto_id,
    nome_produto,
    quantidade,
    valor_unitario,
    valor_total,
    custo_unitario,
    custo_total
  )
  select
    p_venda_id,
    x.produto_id,
    x.nome_produto,
    x.quantidade,
    x.valor_unitario,
    x.valor_total,
    x.custo_unitario,
    x.custo_total
  from jsonb_to_recordset(p_itens) as x(
    produto_id text,
    nome_produto text,
    quantidade integer,
    valor_unitario numeric,
    valor_total numeric,
    custo_unitario numeric,
    custo_total numeric
  );

  select jsonb_build_object(
    'venda', to_jsonb(v.*),
    'itens', coalesce((select jsonb_agg(to_jsonb(i.*)) from public."ITENS_VENDA" i where i.venda_id = p_venda_id), '[]'::jsonb)
  )
    into v_new_snapshot
  from public."VENDAS" v
  where v.id = p_venda_id;

  v_alterado_por = coalesce(auth.uid()::text, '');

  insert into public."ALTERACOES_VENDA" (
    venda_id,
    dados_anteriores,
    dados_novos,
    alterado_por,
    motivo
  )
  values (
    p_venda_id,
    jsonb_build_object('venda', v_old, 'itens', v_old_items),
    v_new_snapshot,
    v_alterado_por,
    p_motivo
  );
end;
$$;

grant execute on function public.editar_venda_estoque(bigint, jsonb, jsonb, text) to authenticated;

select pg_notify('pgrst', 'reload schema');
