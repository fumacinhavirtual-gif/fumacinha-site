-- Integra clientes com vendas manuais e pedidos do site publico.
-- Rode este arquivo no SQL Editor do Supabase depois de SUPABASE_CLIENTES.sql.

create extension if not exists pgcrypto;

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  whatsapp text not null,
  whatsapp_normalizado text not null,
  observacao text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clientes enable row level security;

create unique index if not exists clientes_whatsapp_normalizado_key
  on public.clientes (whatsapp_normalizado);

create index if not exists clientes_nome_idx
  on public.clientes (nome);

create or replace function public.set_clientes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_clientes_updated_at on public.clientes;
create trigger set_clientes_updated_at
before update on public.clientes
for each row
execute function public.set_clientes_updated_at();

drop policy if exists "Clientes select authenticated" on public.clientes;
create policy "Clientes select authenticated"
on public.clientes
for select
to authenticated
using (true);

drop policy if exists "Clientes insert authenticated" on public.clientes;
create policy "Clientes insert authenticated"
on public.clientes
for insert
to authenticated
with check (true);

drop policy if exists "Clientes update authenticated" on public.clientes;
create policy "Clientes update authenticated"
on public.clientes
for update
to authenticated
using (true)
with check (true);

alter table public."VENDAS"
  add column if not exists cliente_id uuid null references public.clientes(id);

alter table public."PEDIDOS"
  add column if not exists cliente_id uuid null references public.clientes(id);

create index if not exists vendas_cliente_id_idx
  on public."VENDAS" (cliente_id);

create index if not exists pedidos_cliente_id_idx
  on public."PEDIDOS" (cliente_id);

create or replace function public.normalizar_whatsapp_cliente(p_whatsapp text)
returns text
language sql
immutable
as $$
  select case
    when length(regexp_replace(coalesce(p_whatsapp, ''), '\D', '', 'g')) in (12, 13)
      and regexp_replace(coalesce(p_whatsapp, ''), '\D', '', 'g') like '55%'
      then substring(regexp_replace(coalesce(p_whatsapp, ''), '\D', '', 'g') from 3)
    else regexp_replace(coalesce(p_whatsapp, ''), '\D', '', 'g')
  end;
$$;

create or replace function public.identificar_cliente_checkout(
  p_nome text,
  p_whatsapp text,
  p_observacao text default null
)
returns table (cliente_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nome text;
  v_whatsapp text;
  v_cliente_id uuid;
begin
  v_nome := nullif(trim(regexp_replace(coalesce(p_nome, ''), '\s+', ' ', 'g')), '');
  v_whatsapp := public.normalizar_whatsapp_cliente(p_whatsapp);

  if v_nome is null or length(v_whatsapp) not in (10, 11) then
    return;
  end if;

  select c.id
    into v_cliente_id
  from public.clientes c
  where c.whatsapp_normalizado = v_whatsapp
  limit 1;

  if v_cliente_id is null then
    insert into public.clientes (nome, whatsapp, whatsapp_normalizado, observacao, ativo)
    values (v_nome, v_whatsapp, v_whatsapp, nullif(trim(coalesce(p_observacao, '')), ''), true)
    on conflict (whatsapp_normalizado) do nothing
    returning id into v_cliente_id;

    if v_cliente_id is null then
      select c.id
        into v_cliente_id
      from public.clientes c
      where c.whatsapp_normalizado = v_whatsapp
      limit 1;
    end if;
  end if;

  return query select v_cliente_id;
end;
$$;

revoke all on function public.identificar_cliente_checkout(text, text, text) from public;
grant execute on function public.identificar_cliente_checkout(text, text, text) to anon, authenticated;

notify pgrst, 'reload schema';
