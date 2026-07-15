create table if not exists public."SITE_CONFIG" (
  id bigint primary key default 1
);

alter table public."SITE_CONFIG"
  add column if not exists loja_online boolean not null default true;

alter table public."SITE_CONFIG"
  add column if not exists mensagem_loja_fechada text not null default 'Loja temporariamente fechada. Voltaremos em breve.';

update public."SITE_CONFIG"
set
  loja_online = coalesce(loja_online, true),
  mensagem_loja_fechada = coalesce(nullif(mensagem_loja_fechada, ''), 'Loja temporariamente fechada. Voltaremos em breve.')
where id = 1;

alter table public."SITE_CONFIG" enable row level security;

grant select on public."SITE_CONFIG" to anon, authenticated;
grant insert, update on public."SITE_CONFIG" to authenticated;

drop policy if exists "SITE_CONFIG leitura publica status loja" on public."SITE_CONFIG";
drop policy if exists "SITE_CONFIG inserir autenticado status loja" on public."SITE_CONFIG";
drop policy if exists "SITE_CONFIG atualizar autenticado status loja" on public."SITE_CONFIG";

create policy "SITE_CONFIG leitura publica status loja"
on public."SITE_CONFIG"
for select
to anon, authenticated
using (true);

create policy "SITE_CONFIG inserir autenticado status loja"
on public."SITE_CONFIG"
for insert
to authenticated
with check (true);

create policy "SITE_CONFIG atualizar autenticado status loja"
on public."SITE_CONFIG"
for update
to authenticated
using (true)
with check (true);

select pg_notify('pgrst', 'reload schema');
