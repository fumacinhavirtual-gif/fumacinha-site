-- Fumacinha Controle - saldo permanente de troco do caixa
-- Execute no SQL Editor do Supabase da Fumacinha.
-- Idempotente: cria/ajusta sem apagar dados existentes.

alter table public."VENDAS" add column if not exists quantidade_total integer not null default 1;
alter table public."VENDAS" add column if not exists valor_produtos numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists total_venda numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists valor_recebido numeric(12, 2) not null default 0;
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
alter table public."VENDAS" add column if not exists cancelada_em timestamptz;
alter table public."VENDAS" add column if not exists custo_unitario numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists custo_total numeric(12, 2) not null default 0;
alter table public."VENDAS" add column if not exists usuario_id uuid;

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
    select 1 from pg_constraint
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

create table if not exists public."CAIXA_TROCO" (
  id smallint primary key default 1,
  saldo_atual numeric(12, 2) not null default 0,
  updated_at timestamptz not null default now(),
  updated_by text not null default '',
  constraint caixa_troco_singleton check (id = 1)
);

alter table public."CAIXA_TROCO" add column if not exists saldo_atual numeric(12, 2) not null default 0;
alter table public."CAIXA_TROCO" add column if not exists updated_at timestamptz not null default now();
alter table public."CAIXA_TROCO" add column if not exists updated_by text not null default '';

insert into public."CAIXA_TROCO" (id, saldo_atual, updated_by)
values (1, 0, '')
on conflict (id) do nothing;

create table if not exists public."MOVIMENTACOES_TROCO" (
  id bigserial primary key,
  tipo text not null,
  valor numeric(12, 2) not null default 0,
  saldo_anterior numeric(12, 2) not null default 0,
  saldo_posterior numeric(12, 2) not null default 0,
  venda_id bigint,
  observacao text not null default '',
  created_by text not null default '',
  created_at timestamptz not null default now()
);

alter table public."MOVIMENTACOES_TROCO" add column if not exists tipo text not null default 'ajuste';
alter table public."MOVIMENTACOES_TROCO" add column if not exists valor numeric(12, 2) not null default 0;
alter table public."MOVIMENTACOES_TROCO" add column if not exists saldo_anterior numeric(12, 2) not null default 0;
alter table public."MOVIMENTACOES_TROCO" add column if not exists saldo_posterior numeric(12, 2) not null default 0;
alter table public."MOVIMENTACOES_TROCO" add column if not exists venda_id bigint;
alter table public."MOVIMENTACOES_TROCO" add column if not exists observacao text not null default '';
alter table public."MOVIMENTACOES_TROCO" add column if not exists created_by text not null default '';
alter table public."MOVIMENTACOES_TROCO" add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'movimentacoes_troco_venda_id_fkey'
      and conrelid = 'public."MOVIMENTACOES_TROCO"'::regclass
  ) then
    alter table public."MOVIMENTACOES_TROCO"
    add constraint movimentacoes_troco_venda_id_fkey
    foreign key (venda_id) references public."VENDAS"(id) on delete set null;
  end if;
end;
$$;

create index if not exists movimentacoes_troco_created_at_idx on public."MOVIMENTACOES_TROCO" (created_at);
create index if not exists movimentacoes_troco_tipo_idx on public."MOVIMENTACOES_TROCO" (tipo);
create index if not exists movimentacoes_troco_venda_id_idx on public."MOVIMENTACOES_TROCO" (venda_id);

alter table public."CAIXA_TROCO" enable row level security;
alter table public."MOVIMENTACOES_TROCO" enable row level security;
alter table public."ALTERACOES_VENDA" enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public."CAIXA_TROCO" to authenticated;
grant select, insert, update, delete on public."MOVIMENTACOES_TROCO" to authenticated;
grant select, insert, update, delete on public."ALTERACOES_VENDA" to authenticated;
grant usage, select on all sequences in schema public to authenticated;

drop policy if exists "CAIXA_TROCO leitura autenticada" on public."CAIXA_TROCO";
drop policy if exists "CAIXA_TROCO inserir autenticado" on public."CAIXA_TROCO";
drop policy if exists "CAIXA_TROCO editar autenticado" on public."CAIXA_TROCO";
drop policy if exists "CAIXA_TROCO excluir autenticado" on public."CAIXA_TROCO";

create policy "CAIXA_TROCO leitura autenticada" on public."CAIXA_TROCO" for select to authenticated using (true);
create policy "CAIXA_TROCO inserir autenticado" on public."CAIXA_TROCO" for insert to authenticated with check (true);
create policy "CAIXA_TROCO editar autenticado" on public."CAIXA_TROCO" for update to authenticated using (true) with check (true);
create policy "CAIXA_TROCO excluir autenticado" on public."CAIXA_TROCO" for delete to authenticated using (true);

drop policy if exists "MOVIMENTACOES_TROCO leitura autenticada" on public."MOVIMENTACOES_TROCO";
drop policy if exists "MOVIMENTACOES_TROCO inserir autenticado" on public."MOVIMENTACOES_TROCO";
drop policy if exists "MOVIMENTACOES_TROCO editar autenticado" on public."MOVIMENTACOES_TROCO";
drop policy if exists "MOVIMENTACOES_TROCO excluir autenticado" on public."MOVIMENTACOES_TROCO";

create policy "MOVIMENTACOES_TROCO leitura autenticada" on public."MOVIMENTACOES_TROCO" for select to authenticated using (true);
create policy "MOVIMENTACOES_TROCO inserir autenticado" on public."MOVIMENTACOES_TROCO" for insert to authenticated with check (true);
create policy "MOVIMENTACOES_TROCO editar autenticado" on public."MOVIMENTACOES_TROCO" for update to authenticated using (true) with check (true);
create policy "MOVIMENTACOES_TROCO excluir autenticado" on public."MOVIMENTACOES_TROCO" for delete to authenticated using (true);

drop policy if exists "ALTERACOES_VENDA leitura autenticada" on public."ALTERACOES_VENDA";
drop policy if exists "ALTERACOES_VENDA inserir autenticado" on public."ALTERACOES_VENDA";
drop policy if exists "ALTERACOES_VENDA editar autenticado" on public."ALTERACOES_VENDA";
drop policy if exists "ALTERACOES_VENDA excluir autenticado" on public."ALTERACOES_VENDA";

create policy "ALTERACOES_VENDA leitura autenticada" on public."ALTERACOES_VENDA" for select to authenticated using (true);
create policy "ALTERACOES_VENDA inserir autenticado" on public."ALTERACOES_VENDA" for insert to authenticated with check (true);
create policy "ALTERACOES_VENDA editar autenticado" on public."ALTERACOES_VENDA" for update to authenticated using (true) with check (true);
create policy "ALTERACOES_VENDA excluir autenticado" on public."ALTERACOES_VENDA" for delete to authenticated using (true);

create or replace function public.aplicar_movimentacao_troco(
  p_tipo text,
  p_valor numeric,
  p_observacao text default '',
  p_venda_id bigint default null
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_saldo_anterior numeric(12, 2);
  v_saldo_posterior numeric(12, 2);
  v_valor numeric(12, 2);
  v_delta numeric(12, 2);
  v_user text;
begin
  v_valor = round(coalesce(p_valor, 0), 2);
  if v_valor < 0 then
    raise exception 'Valor de troco nao pode ser negativo.';
  end if;

  insert into public."CAIXA_TROCO" (id, saldo_atual, updated_by)
  values (1, 0, '')
  on conflict (id) do nothing;

  select saldo_atual
    into v_saldo_anterior
  from public."CAIXA_TROCO"
  where id = 1
  for update;

  if p_tipo = 'uso_venda' then
    v_delta = -v_valor;
  elsif p_tipo in ('devolucao_cancelamento', 'adicao', 'saldo_inicial') then
    v_delta = v_valor;
  elsif p_tipo = 'ajuste' then
    v_delta = v_valor - v_saldo_anterior;
  else
    raise exception 'Tipo de movimentacao de troco invalido: %.', p_tipo;
  end if;

  v_saldo_posterior = round(v_saldo_anterior + v_delta, 2);

  if v_saldo_posterior < 0 then
    raise exception 'Saldo de troco insuficiente. Disponivel: R$ %, falta: R$ %.',
      to_char(v_saldo_anterior, 'FM999999990D00'),
      to_char(abs(v_saldo_posterior), 'FM999999990D00');
  end if;

  v_user = coalesce(auth.uid()::text, '');

  update public."CAIXA_TROCO"
  set saldo_atual = v_saldo_posterior,
      updated_at = now(),
      updated_by = v_user
  where id = 1;

  insert into public."MOVIMENTACOES_TROCO" (
    tipo,
    valor,
    saldo_anterior,
    saldo_posterior,
    venda_id,
    observacao,
    created_by
  )
  values (
    p_tipo,
    case when p_tipo = 'ajuste' then abs(v_delta) else v_valor end,
    v_saldo_anterior,
    v_saldo_posterior,
    p_venda_id,
    coalesce(p_observacao, ''),
    v_user
  );

  return v_saldo_posterior;
end;
$$;

create or replace function public.movimentar_troco_caixa(
  p_tipo text,
  p_valor numeric,
  p_observacao text default '',
  p_venda_id bigint default null
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_tipo not in ('adicao', 'ajuste', 'saldo_inicial') then
    raise exception 'Use somente adicao, ajuste ou saldo_inicial pelo painel.';
  end if;

  if p_tipo in ('ajuste', 'saldo_inicial') and btrim(coalesce(p_observacao, '')) = '' then
    raise exception 'Informe o motivo do ajuste.';
  end if;

  return public.aplicar_movimentacao_troco(p_tipo, p_valor, p_observacao, p_venda_id);
end;
$$;

create or replace function public.registrar_venda_troco(
  p_venda jsonb,
  p_itens jsonb
)
returns public."VENDAS"
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale public."VENDAS"%rowtype;
  rec record;
  v_estoque numeric;
  v_nome text;
  v_troco numeric(12, 2);
begin
  if jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'Informe ao menos um item na venda.';
  end if;

  v_troco = round(coalesce((p_venda->>'troco')::numeric, 0), 2);
  insert into public."VENDAS" (
    produto_id, nome_produto, quantidade, quantidade_total, valor_unitario,
    valor_total, valor_produtos, total_venda, valor_recebido, valor_pago_cliente,
    valor_entregue, teve_troco, troco, taxa_entrega, desconto, forma_pagamento,
    entregador_id, entregador_nome, vendedora_id, vendedora_nome, comissao_base,
    comissao_cartao, comissao_total, cliente_nome, observacao, data_entrega,
    horario_rota, rota_data_hora, status_entrega, status, custo_unitario,
    custo_total, cancelada, usuario_id
  )
  values (
    p_venda->>'produto_id',
    p_venda->>'nome_produto',
    coalesce((p_venda->>'quantidade')::integer, 1),
    coalesce((p_venda->>'quantidade_total')::integer, 1),
    coalesce((p_venda->>'valor_unitario')::numeric, 0),
    coalesce((p_venda->>'valor_total')::numeric, 0),
    coalesce((p_venda->>'valor_produtos')::numeric, 0),
    coalesce((p_venda->>'total_venda')::numeric, 0),
    coalesce((p_venda->>'valor_recebido')::numeric, 0),
    coalesce((p_venda->>'valor_pago_cliente')::numeric, 0),
    coalesce((p_venda->>'valor_entregue')::numeric, 0),
    coalesce((p_venda->>'teve_troco')::boolean, false),
    v_troco,
    coalesce((p_venda->>'taxa_entrega')::numeric, 0),
    coalesce((p_venda->>'desconto')::numeric, 0),
    coalesce(nullif(p_venda->>'forma_pagamento', ''), 'Pix'),
    nullif(p_venda->>'entregador_id', '')::bigint,
    coalesce(p_venda->>'entregador_nome', ''),
    nullif(p_venda->>'vendedora_id', '')::bigint,
    coalesce(p_venda->>'vendedora_nome', ''),
    coalesce((p_venda->>'comissao_base')::numeric, 0),
    coalesce((p_venda->>'comissao_cartao')::numeric, 0),
    coalesce((p_venda->>'comissao_total')::numeric, 0),
    coalesce(p_venda->>'cliente_nome', ''),
    coalesce(p_venda->>'observacao', ''),
    nullif(p_venda->>'data_entrega', '')::date,
    coalesce(p_venda->>'horario_rota', ''),
    nullif(p_venda->>'rota_data_hora', '')::timestamptz,
    coalesce(p_venda->>'status_entrega', 'Aguardando'),
    coalesce(p_venda->>'status', 'concluida'),
    coalesce((p_venda->>'custo_unitario')::numeric, 0),
    coalesce((p_venda->>'custo_total')::numeric, 0),
    false,
    auth.uid()
  )
  returning * into v_sale;

  if v_troco > 0 then
    if coalesce((p_venda->>'teve_troco')::boolean, false)
       and lower(coalesce(p_venda->>'forma_pagamento', '')) = 'dinheiro' then
      perform public.aplicar_movimentacao_troco('uso_venda', v_troco, 'Troco usado na venda', v_sale.id);
    end if;
  end if;

  insert into public."ITENS_VENDA" (
    venda_id, produto_id, nome_produto, quantidade, valor_unitario,
    valor_total, custo_unitario, custo_total
  )
  select
    v_sale.id, nullif(x.produto_id, '')::bigint, x.nome_produto, x.quantidade, x.valor_unitario,
    x.valor_total, x.custo_unitario, x.custo_total
  from jsonb_to_recordset(p_itens) as x(
    produto_id text,
    nome_produto text,
    quantidade integer,
    valor_unitario numeric,
    valor_total numeric,
    custo_unitario numeric,
    custo_total numeric
  );

  for rec in
    select produto_id, nome_produto, sum(quantidade)::numeric as quantidade
    from jsonb_to_recordset(p_itens) as x(produto_id text, nome_produto text, quantidade numeric)
    group by produto_id, nome_produto
  loop
    select estoque, nome into v_estoque, v_nome
    from public."PRODUTOS"
    where id::text = rec.produto_id
    for update;

    if v_estoque is null then
      raise exception 'Produto % nao encontrado.', rec.produto_id;
    end if;

    if v_estoque < rec.quantidade then
      raise exception 'Estoque insuficiente para %. Disponivel: %, necessario: %.', v_nome, v_estoque, rec.quantidade;
    end if;

    update public."PRODUTOS"
    set estoque = v_estoque - rec.quantidade,
        ativo = (v_estoque - rec.quantidade) > 0
    where id::text = rec.produto_id;

    insert into public."MOVIMENTACOES_ESTOQUE" (
      produto_id, nome_produto, quantidade_anterior, quantidade_nova,
      diferenca, tipo, venda_id, usuario_id
    )
    values (
      nullif(rec.produto_id, '')::bigint, rec.nome_produto, v_estoque, v_estoque - rec.quantidade,
      -rec.quantidade, 'venda', v_sale.id, auth.uid()::text
    );
  end loop;

  if coalesce((p_venda->>'taxa_entrega')::numeric, 0) > 0 and nullif(p_venda->>'entregador_id', '') is not null then
    insert into public."REPASSES_ENTREGADORES" (venda_id, entregador_id, valor, pago)
    values (v_sale.id, nullif(p_venda->>'entregador_id', '')::bigint, coalesce((p_venda->>'taxa_entrega')::numeric, 0), false);
  end if;

  return v_sale;
end;
$$;

create or replace function public.cancelar_venda_troco(
  p_venda_id bigint,
  p_observacao text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale public."VENDAS"%rowtype;
  rec record;
  v_estoque numeric;
begin
  select * into v_sale
  from public."VENDAS"
  where id = p_venda_id
  for update;

  if v_sale.id is null then
    raise exception 'Venda nao encontrada.';
  end if;

  if v_sale.cancelada then
    raise exception 'Venda ja esta cancelada.';
  end if;

  for rec in
    select produto_id, nome_produto, sum(quantidade)::numeric as quantidade
    from public."ITENS_VENDA"
    where venda_id = p_venda_id
    group by produto_id, nome_produto
  loop
    select estoque into v_estoque
    from public."PRODUTOS"
    where id::text = rec.produto_id
    for update;

    update public."PRODUTOS"
    set estoque = coalesce(v_estoque, 0) + rec.quantidade,
        ativo = true
    where id::text = rec.produto_id;

    insert into public."MOVIMENTACOES_ESTOQUE" (
      produto_id, nome_produto, quantidade_anterior, quantidade_nova,
      diferenca, tipo, venda_id, usuario_id
    )
    values (
      nullif(rec.produto_id, '')::bigint, rec.nome_produto, coalesce(v_estoque, 0),
      coalesce(v_estoque, 0) + rec.quantidade, rec.quantidade,
      'cancelamento', p_venda_id, auth.uid()::text
    );
  end loop;

  if lower(coalesce(v_sale.forma_pagamento, '')) = 'dinheiro' and coalesce(v_sale.troco, 0) > 0 then
    perform public.aplicar_movimentacao_troco(
      'devolucao_cancelamento',
      v_sale.troco,
      coalesce(nullif(p_observacao, ''), 'Devolucao de troco por cancelamento'),
      p_venda_id
    );
  end if;

  update public."VENDAS"
  set cancelada = true,
      cancelada_em = now(),
      status = 'cancelada',
      status_entrega = 'Cancelado'
  where id = p_venda_id;
end;
$$;

create or replace function public.editar_venda_estoque(
  p_venda_id bigint,
  p_venda jsonb,
  p_itens jsonb,
  p_motivo text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old jsonb;
  v_old_items jsonb;
  v_new_snapshot jsonb;
  v_alterado_por text;
  rec record;
  v_estoque numeric;
  v_nome text;
  v_old_troco numeric(12, 2);
  v_new_troco numeric(12, 2);
  v_diff_troco numeric(12, 2);
begin
  if p_motivo is null or btrim(p_motivo) = '' then
    raise exception 'Informe o motivo da alteracao.';
  end if;

  if jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'Informe ao menos um item na venda.';
  end if;

  select to_jsonb(v.*) into v_old
  from public."VENDAS" v
  where v.id = p_venda_id
  for update;

  if v_old is null then
    raise exception 'Venda nao encontrada.';
  end if;

  if coalesce((v_old->>'cancelada')::boolean, false) then
    raise exception 'Venda cancelada nao pode ser editada.';
  end if;

  v_old_troco = case
    when lower(coalesce(v_old->>'forma_pagamento', '')) = 'dinheiro' then coalesce((v_old->>'troco')::numeric, 0)
    else 0
  end;
  v_new_troco = case
    when lower(coalesce(p_venda->>'forma_pagamento', '')) = 'dinheiro' then coalesce((p_venda->>'troco')::numeric, 0)
    else 0
  end;
  v_diff_troco = round(v_new_troco - v_old_troco, 2);

  if v_diff_troco > 0 then
    perform public.aplicar_movimentacao_troco('uso_venda', v_diff_troco, 'Aumento de troco na edicao da venda', p_venda_id);
  elsif v_diff_troco < 0 then
    perform public.aplicar_movimentacao_troco('devolucao_cancelamento', abs(v_diff_troco), 'Devolucao de troco na edicao da venda', p_venda_id);
  end if;

  select coalesce(jsonb_agg(to_jsonb(i.*)), '[]'::jsonb) into v_old_items
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
      select p.estoque, p.nome into v_estoque, v_nome
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
      set estoque = v_estoque - rec.diferenca,
          ativo = (v_estoque - rec.diferenca) > 0
      where id::text = rec.produto_id;

      insert into public."MOVIMENTACOES_ESTOQUE" (
        produto_id, nome_produto, quantidade_anterior, quantidade_nova,
        diferenca, tipo, venda_id, usuario_id
      )
      values (
        nullif(rec.produto_id, '')::bigint, v_nome, v_estoque, v_estoque - rec.diferenca,
        -rec.diferenca, 'edicao venda', p_venda_id, auth.uid()::text
      );
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

  delete from public."ITENS_VENDA" where venda_id = p_venda_id;

  insert into public."ITENS_VENDA" (
    venda_id, produto_id, nome_produto, quantidade, valor_unitario,
    valor_total, custo_unitario, custo_total
  )
  select
    p_venda_id, nullif(x.produto_id, '')::bigint, x.nome_produto, x.quantidade, x.valor_unitario,
    x.valor_total, x.custo_unitario, x.custo_total
  from jsonb_to_recordset(p_itens) as x(
    produto_id text,
    nome_produto text,
    quantidade integer,
    valor_unitario numeric,
    valor_total numeric,
    custo_unitario numeric,
    custo_total numeric
  );

  delete from public."REPASSES_ENTREGADORES" where venda_id = p_venda_id;
  if coalesce((p_venda->>'taxa_entrega')::numeric, 0) > 0 and nullif(p_venda->>'entregador_id', '') is not null then
    insert into public."REPASSES_ENTREGADORES" (venda_id, entregador_id, valor, pago)
    values (p_venda_id, nullif(p_venda->>'entregador_id', '')::bigint, coalesce((p_venda->>'taxa_entrega')::numeric, 0), false);
  end if;

  select jsonb_build_object(
    'venda', to_jsonb(v.*),
    'itens', coalesce((select jsonb_agg(to_jsonb(i.*)) from public."ITENS_VENDA" i where i.venda_id = p_venda_id), '[]'::jsonb)
  ) into v_new_snapshot
  from public."VENDAS" v
  where v.id = p_venda_id;

  v_alterado_por = coalesce(auth.uid()::text, '');

  insert into public."ALTERACOES_VENDA" (
    venda_id, dados_anteriores, dados_novos, alterado_por, motivo
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

grant execute on function public.aplicar_movimentacao_troco(text, numeric, text, bigint) to authenticated;
grant execute on function public.movimentar_troco_caixa(text, numeric, text, bigint) to authenticated;
grant execute on function public.registrar_venda_troco(jsonb, jsonb) to authenticated;
grant execute on function public.cancelar_venda_troco(bigint, text) to authenticated;
grant execute on function public.editar_venda_estoque(bigint, jsonb, jsonb, text) to authenticated;

select pg_notify('pgrst', 'reload schema');
