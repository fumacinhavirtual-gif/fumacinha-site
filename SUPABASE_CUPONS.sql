-- Fumacinha - sistema de cupons de desconto
-- Execute este arquivo no SQL Editor do Supabase da Fumacinha.
-- Idempotente: cria/ajusta sem apagar cupons, pedidos ou dados existentes.

create extension if not exists pgcrypto;

create table if not exists public.cupons (
  id uuid primary key default gen_random_uuid(),
  nome_interno text,
  codigo text not null,
  codigo_normalizado text not null,
  tipo_desconto text not null default 'valor',
  valor numeric(12, 2) not null default 0,
  desconto_individual boolean not null default false,
  desconto_por_faixa boolean not null default false,
  faixa_menor_ate numeric(12, 2),
  faixa_menor_desconto numeric(12, 2),
  faixa_maior_de numeric(12, 2),
  faixa_maior_desconto numeric(12, 2),
  valor_minimo numeric(12, 2) not null default 0,
  inicio timestamptz,
  fim timestamptz,
  limite_uso integer,
  usos integer not null default 0,
  total_desconto numeric(12, 2) not null default 0,
  ultima_utilizacao timestamptz,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cupons_tipo_desconto_check check (tipo_desconto in ('valor', 'percentual')),
  constraint cupons_valor_check check (valor >= 0),
  constraint cupons_valor_minimo_check check (valor_minimo >= 0),
  constraint cupons_limite_uso_check check (limite_uso is null or limite_uso >= 0),
  constraint cupons_usos_check check (usos >= 0),
  constraint cupons_total_desconto_check check (total_desconto >= 0)
);

alter table public.cupons add column if not exists nome_interno text;
alter table public.cupons add column if not exists codigo text not null default '';
alter table public.cupons add column if not exists codigo_normalizado text not null default '';
alter table public.cupons add column if not exists tipo_desconto text not null default 'valor';
alter table public.cupons add column if not exists valor numeric(12, 2) not null default 0;
alter table public.cupons add column if not exists desconto_individual boolean not null default false;
alter table public.cupons add column if not exists desconto_por_faixa boolean not null default false;
alter table public.cupons add column if not exists faixa_menor_ate numeric(12, 2);
alter table public.cupons add column if not exists faixa_menor_desconto numeric(12, 2);
alter table public.cupons add column if not exists faixa_maior_de numeric(12, 2);
alter table public.cupons add column if not exists faixa_maior_desconto numeric(12, 2);
alter table public.cupons add column if not exists valor_minimo numeric(12, 2) not null default 0;
alter table public.cupons add column if not exists inicio timestamptz;
alter table public.cupons add column if not exists fim timestamptz;
alter table public.cupons add column if not exists limite_uso integer;
alter table public.cupons add column if not exists usos integer not null default 0;
alter table public.cupons add column if not exists total_desconto numeric(12, 2) not null default 0;
alter table public.cupons add column if not exists ultima_utilizacao timestamptz;
alter table public.cupons add column if not exists ativo boolean not null default true;
alter table public.cupons add column if not exists created_at timestamptz not null default now();
alter table public.cupons add column if not exists updated_at timestamptz not null default now();

create or replace function public.normalizar_codigo_cupom(p_codigo text)
returns text
language sql
immutable
as $$
  select upper(regexp_replace(trim(coalesce(p_codigo, '')), '\s+', '', 'g'));
$$;

update public.cupons
set codigo_normalizado = public.normalizar_codigo_cupom(codigo)
where codigo_normalizado = '' or codigo_normalizado is null;

create unique index if not exists cupons_codigo_normalizado_key
  on public.cupons (codigo_normalizado);

create index if not exists cupons_ativo_idx on public.cupons (ativo);
create index if not exists cupons_fim_idx on public.cupons (fim);
create index if not exists cupons_created_at_idx on public.cupons (created_at desc);

create or replace function public.set_cupons_normalizados()
returns trigger
language plpgsql
as $$
begin
  new.codigo := public.normalizar_codigo_cupom(new.codigo);
  new.codigo_normalizado := public.normalizar_codigo_cupom(coalesce(new.codigo_normalizado, new.codigo));
  new.tipo_desconto := coalesce(nullif(new.tipo_desconto, ''), 'valor');
  new.valor := round(coalesce(new.valor, 0), 2);
  new.desconto_individual := coalesce(new.desconto_individual, false);
  new.desconto_por_faixa := coalesce(new.desconto_por_faixa, false);
  new.faixa_menor_ate := case when new.faixa_menor_ate is null then null else round(greatest(new.faixa_menor_ate, 0), 2) end;
  new.faixa_menor_desconto := case when new.faixa_menor_desconto is null then null else round(greatest(new.faixa_menor_desconto, 0), 2) end;
  new.faixa_maior_de := case when new.faixa_maior_de is null then null else round(greatest(new.faixa_maior_de, 0), 2) end;
  new.faixa_maior_desconto := case when new.faixa_maior_desconto is null then null else round(greatest(new.faixa_maior_desconto, 0), 2) end;
  new.valor_minimo := round(coalesce(new.valor_minimo, 0), 2);
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_cupons_normalizados on public.cupons;
create trigger set_cupons_normalizados
before insert or update on public.cupons
for each row
execute function public.set_cupons_normalizados();

alter table public.cupons enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.cupons to authenticated;

drop policy if exists "Cupons leitura autenticada" on public.cupons;
drop policy if exists "Cupons inserir autenticado" on public.cupons;
drop policy if exists "Cupons editar autenticado" on public.cupons;
drop policy if exists "Cupons excluir autenticado" on public.cupons;

create policy "Cupons leitura autenticada" on public.cupons for select to authenticated using (true);
create policy "Cupons inserir autenticado" on public.cupons for insert to authenticated with check (true);
create policy "Cupons editar autenticado" on public.cupons for update to authenticated using (true) with check (true);
create policy "Cupons excluir autenticado" on public.cupons for delete to authenticated using (true);

alter table public."PEDIDOS" add column if not exists valor_subtotal numeric(12, 2) not null default 0;
alter table public."PEDIDOS" add column if not exists cupom_id uuid null;
alter table public."PEDIDOS" add column if not exists cupom_codigo text;
alter table public."PEDIDOS" add column if not exists cupom_desconto numeric(12, 2) not null default 0;
alter table public."PEDIDOS" add column if not exists valor_total_com_desconto numeric(12, 2) not null default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'pedidos_cupom_id_fkey'
      and conrelid = 'public."PEDIDOS"'::regclass
  ) then
    alter table public."PEDIDOS"
      add constraint pedidos_cupom_id_fkey
      foreign key (cupom_id) references public.cupons(id) on delete set null;
  end if;
end;
$$;

create index if not exists pedidos_cupom_id_idx on public."PEDIDOS" (cupom_id);

drop function if exists public.validar_cupom_checkout(text, numeric);
drop function if exists public.validar_cupom_checkout(text, numeric, integer);
drop function if exists public.validar_cupom_checkout(text, numeric, integer, jsonb);

create or replace function public.validar_cupom_checkout(
  p_codigo text,
  p_subtotal numeric,
  p_quantidade integer default 1,
  p_itens jsonb default '[]'::jsonb
)
returns table (
  valido boolean,
  mensagem text,
  cupom_id uuid,
  codigo text,
  tipo_desconto text,
  valor numeric,
  desconto_individual boolean,
  desconto numeric,
  total numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_codigo text;
  v_subtotal numeric(12, 2);
  v_quantidade integer;
  v_cupom public.cupons%rowtype;
  v_desconto numeric(12, 2);
  v_item jsonb;
  v_item_preco numeric(12, 2);
  v_item_quantidade integer;
begin
  v_codigo := public.normalizar_codigo_cupom(p_codigo);
  v_subtotal := round(greatest(coalesce(p_subtotal, 0), 0), 2);
  v_quantidade := greatest(coalesce(p_quantidade, 1), 1);

  if v_codigo = '' then
    return query select false, 'Digite seu cupom.', null::uuid, null::text, null::text, 0::numeric, false, 0::numeric, v_subtotal;
    return;
  end if;

  select *
    into v_cupom
  from public.cupons c
  where c.codigo_normalizado = v_codigo
  limit 1;

  if not found then
    return query select false, 'Cupom nao encontrado.', null::uuid, null::text, null::text, 0::numeric, false, 0::numeric, v_subtotal;
    return;
  end if;

  if v_cupom.ativo is false then
    return query select false, 'Cupom inativo.', null::uuid, v_cupom.codigo, v_cupom.tipo_desconto, v_cupom.valor, v_cupom.desconto_individual, 0::numeric, v_subtotal;
    return;
  end if;

  if v_cupom.inicio is not null and now() < v_cupom.inicio then
    return query select false, 'Cupom ainda nao esta disponivel.', null::uuid, v_cupom.codigo, v_cupom.tipo_desconto, v_cupom.valor, v_cupom.desconto_individual, 0::numeric, v_subtotal;
    return;
  end if;

  if v_cupom.fim is not null and now() > v_cupom.fim then
    return query select false, 'Cupom expirado.', null::uuid, v_cupom.codigo, v_cupom.tipo_desconto, v_cupom.valor, v_cupom.desconto_individual, 0::numeric, v_subtotal;
    return;
  end if;

  if v_cupom.limite_uso is not null and v_cupom.usos >= v_cupom.limite_uso then
    return query select false, 'Cupom ja atingiu o limite de usos.', null::uuid, v_cupom.codigo, v_cupom.tipo_desconto, v_cupom.valor, v_cupom.desconto_individual, 0::numeric, v_subtotal;
    return;
  end if;

  if v_cupom.valor_minimo > 0 and v_subtotal < v_cupom.valor_minimo then
    return query select false, 'Compra nao atende ao valor minimo.', null::uuid, v_cupom.codigo, v_cupom.tipo_desconto, v_cupom.valor, v_cupom.desconto_individual, 0::numeric, v_subtotal;
    return;
  end if;

  if v_cupom.tipo_desconto = 'percentual' then
    v_desconto := round(v_subtotal * least(v_cupom.valor, 100) / 100, 2);
  elsif v_cupom.desconto_por_faixa
    and jsonb_typeof(coalesce(p_itens, '[]'::jsonb)) = 'array'
    and jsonb_array_length(coalesce(p_itens, '[]'::jsonb)) > 0 then
    v_desconto := 0;

    for v_item in select * from jsonb_array_elements(coalesce(p_itens, '[]'::jsonb))
    loop
      v_item_quantidade := greatest(coalesce(nullif(v_item->>'quantidade', '')::integer, 1), 1);
      v_item_preco := round(greatest(coalesce(nullif(v_item->>'valor_unitario', '')::numeric, 0), 0), 2);

      if v_item_preco <= 0 and v_item_quantidade > 0 then
        v_item_preco := round(greatest(coalesce(nullif(v_item->>'subtotal', '')::numeric, 0), 0) / v_item_quantidade, 2);
      end if;

      if v_cupom.faixa_maior_de is not null
        and v_cupom.faixa_maior_desconto is not null
        and v_item_preco >= v_cupom.faixa_maior_de then
        v_desconto := v_desconto + (least(v_cupom.faixa_maior_desconto, v_item_preco) * v_item_quantidade);
      elsif v_cupom.faixa_menor_ate is not null
        and v_cupom.faixa_menor_desconto is not null
        and v_item_preco <= v_cupom.faixa_menor_ate then
        v_desconto := v_desconto + (least(v_cupom.faixa_menor_desconto, v_item_preco) * v_item_quantidade);
      end if;
    end loop;

    v_desconto := round(least(v_desconto, v_subtotal), 2);
  elsif v_cupom.desconto_por_faixa
    and v_cupom.faixa_maior_de is not null
    and v_cupom.faixa_maior_desconto is not null
    and v_subtotal >= v_cupom.faixa_maior_de then
    v_desconto := round(least(v_cupom.faixa_maior_desconto, v_subtotal), 2);
  elsif v_cupom.desconto_por_faixa
    and v_cupom.faixa_menor_ate is not null
    and v_cupom.faixa_menor_desconto is not null
    and v_subtotal <= v_cupom.faixa_menor_ate then
    v_desconto := round(least(v_cupom.faixa_menor_desconto, v_subtotal), 2);
  elsif v_cupom.desconto_individual then
    v_desconto := round(least(v_cupom.valor * v_quantidade, v_subtotal), 2);
  else
    v_desconto := round(least(v_cupom.valor, v_subtotal), 2);
  end if;

  return query select true, 'Cupom aplicado com sucesso.', v_cupom.id, v_cupom.codigo, v_cupom.tipo_desconto, v_cupom.valor, v_cupom.desconto_individual, v_desconto, round(v_subtotal - v_desconto, 2);
end;
$$;

create or replace function public.existe_cupom_ativo_checkout()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.cupons c
    where c.ativo = true
      and (c.inicio is null or now() >= c.inicio)
      and (c.fim is null or now() <= c.fim)
      and (c.limite_uso is null or c.usos < c.limite_uso)
    limit 1
  );
$$;

create or replace function public.registrar_uso_cupom(
  p_cupom_id uuid,
  p_desconto numeric
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated integer;
begin
  update public.cupons
  set
    usos = usos + 1,
    total_desconto = round(total_desconto + greatest(coalesce(p_desconto, 0), 0), 2),
    ultima_utilizacao = now(),
    updated_at = now()
  where id = p_cupom_id
    and ativo = true
    and (limite_uso is null or usos < limite_uso);

  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

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
  v_subtotal numeric(12, 2) := 0;
  v_desconto numeric(12, 2) := 0;
  v_total numeric(12, 2) := 0;
  v_cliente_id uuid := null;
  v_cupom_id uuid := null;
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
    v_subtotal := v_subtotal + round(coalesce((v_item->>'subtotal')::numeric, 0), 2);
  end loop;

  if coalesce(p_pedido->>'cliente_id', '') <> '' then
    v_cliente_id := (p_pedido->>'cliente_id')::uuid;
  end if;

  if coalesce(p_pedido->>'cupom_id', '') <> '' then
    v_cupom_id := (p_pedido->>'cupom_id')::uuid;
  end if;

  v_desconto := round(least(greatest(coalesce((p_pedido->>'cupom_desconto')::numeric, 0), 0), v_subtotal), 2);
  v_total := round(greatest(v_subtotal - v_desconto, 0), 2);

  insert into public."PEDIDOS" (
    cliente_id,
    cliente_nome,
    cliente_bairro,
    cliente_telefone,
    origem,
    status,
    valor_produtos,
    valor_subtotal,
    cupom_id,
    cupom_codigo,
    cupom_desconto,
    valor_total_com_desconto
  )
  values (
    v_cliente_id,
    trim(p_pedido->>'cliente_nome'),
    coalesce(trim(p_pedido->>'cliente_bairro'), ''),
    coalesce(nullif(regexp_replace(coalesce(p_pedido->>'cliente_telefone', ''), '\D', '', 'g'), ''), ''),
    coalesce(nullif(trim(p_pedido->>'origem'), ''), 'Site'),
    'Aguardando confirmacao',
    v_total,
    v_subtotal,
    v_cupom_id,
    nullif(public.normalizar_codigo_cupom(p_pedido->>'cupom_codigo'), ''),
    v_desconto,
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
    'valor_subtotal', v_pedido.valor_subtotal,
    'cupom_id', v_pedido.cupom_id,
    'cupom_codigo', v_pedido.cupom_codigo,
    'cupom_desconto', v_pedido.cupom_desconto,
    'valor_total_com_desconto', v_pedido.valor_total_com_desconto,
    'created_at', v_pedido.created_at
  );
end;
$$;

revoke all on function public.validar_cupom_checkout(text, numeric, integer, jsonb) from public;
revoke all on function public.existe_cupom_ativo_checkout() from public;
revoke all on function public.registrar_uso_cupom(uuid, numeric) from public;
grant execute on function public.validar_cupom_checkout(text, numeric, integer, jsonb) to anon, authenticated;
grant execute on function public.existe_cupom_ativo_checkout() to anon, authenticated;
grant execute on function public.registrar_uso_cupom(uuid, numeric) to anon, authenticated;
grant execute on function public.registrar_pedido_site(jsonb, jsonb) to anon, authenticated;

select pg_notify('pgrst', 'reload schema');
