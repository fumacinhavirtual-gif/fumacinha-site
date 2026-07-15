-- Fumacinha - Realtime para pedidos pendentes
-- Execute no SQL Editor do Supabase da Fumacinha.
-- Idempotente: ajusta colunas/indices e habilita publicacao sem apagar dados.

alter table public."PEDIDOS" add column if not exists cliente_telefone text not null default '';

create index if not exists pedidos_status_created_at_idx
on public."PEDIDOS" (status, created_at desc);

create index if not exists pedidos_cliente_telefone_idx
on public."PEDIDOS" (cliente_telefone);

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'PEDIDOS'
    ) then
      alter publication supabase_realtime add table public."PEDIDOS";
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'ITENS_PEDIDO'
    ) then
      alter publication supabase_realtime add table public."ITENS_PEDIDO";
    end if;
  end if;
end;
$$;

select pg_notify('pgrst', 'reload schema');
