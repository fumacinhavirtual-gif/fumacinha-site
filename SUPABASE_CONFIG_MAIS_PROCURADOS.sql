-- Fumacinha - configuracao da secao Mais Procurados
-- Execute no SQL Editor do projeto Supabase da Fumacinha.
-- Pode ser executado mais de uma vez sem apagar dados existentes.

alter table public."SITE_CONFIG"
add column if not exists mostrar_mais_procurados boolean not null default true;

update public."SITE_CONFIG"
set mostrar_mais_procurados = true
where id = 1
  and mostrar_mais_procurados is null;

alter table public."SITE_CONFIG" enable row level security;

grant select on public."SITE_CONFIG" to anon, authenticated;
grant insert, update on public."SITE_CONFIG" to authenticated;

drop policy if exists "SITE_CONFIG leitura publica" on public."SITE_CONFIG";
drop policy if exists "SITE_CONFIG inserir pelo site" on public."SITE_CONFIG";
drop policy if exists "SITE_CONFIG editar pelo site" on public."SITE_CONFIG";
drop policy if exists "SITE_CONFIG inserir autenticado" on public."SITE_CONFIG";
drop policy if exists "SITE_CONFIG editar autenticado" on public."SITE_CONFIG";

create policy "SITE_CONFIG leitura publica"
on public."SITE_CONFIG"
for select
to anon, authenticated
using (true);

create policy "SITE_CONFIG inserir autenticado"
on public."SITE_CONFIG"
for insert
to authenticated
with check (id = 1);

create policy "SITE_CONFIG editar autenticado"
on public."SITE_CONFIG"
for update
to authenticated
using (id = 1)
with check (id = 1);

select pg_notify('pgrst', 'reload schema');
