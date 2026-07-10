alter table public."PRODUTOS"
add column if not exists estoque integer not null default 0;

alter table public."PRODUTOS"
add column if not exists ativo boolean not null default true;

update public."PRODUTOS"
set ativo = false
where estoque <= 0;

create table if not exists public."VENDAS" (
  id bigserial primary key,
  produto_id text not null,
  nome_produto text not null,
  quantidade integer not null check (quantidade > 0),
  valor_unitario numeric(12, 2) not null check (valor_unitario >= 0),
  valor_total numeric(12, 2) not null check (valor_total >= 0),
  data_venda timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public."VENDAS" enable row level security;

drop policy if exists "VENDAS leitura pelo site" on public."VENDAS";
create policy "VENDAS leitura pelo site"
on public."VENDAS"
for select
using (true);

drop policy if exists "VENDAS inserir pelo site" on public."VENDAS";
create policy "VENDAS inserir pelo site"
on public."VENDAS"
for insert
with check (true);

drop policy if exists "VENDAS excluir pelo site" on public."VENDAS";
create policy "VENDAS excluir pelo site"
on public."VENDAS"
for delete
using (true);

drop policy if exists "PRODUTOS leitura publica" on public."PRODUTOS";
create policy "PRODUTOS leitura publica"
on public."PRODUTOS"
for select
using (true);

drop policy if exists "PRODUTOS editar pelo site" on public."PRODUTOS";
create policy "PRODUTOS editar pelo site"
on public."PRODUTOS"
for update
using (true)
with check (true);

drop policy if exists "PRODUTOS inserir pelo site" on public."PRODUTOS";
create policy "PRODUTOS inserir pelo site"
on public."PRODUTOS"
for insert
with check (true);
