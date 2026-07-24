-- Cadastro de clientes da Fumacinha
-- Execute este arquivo no SQL Editor do Supabase do projeto correto.

create extension if not exists "pgcrypto";

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  whatsapp text not null,
  whatsapp_normalizado text not null,
  observacao text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clientes_nome_not_empty check (length(trim(nome)) > 0),
  constraint clientes_whatsapp_not_empty check (length(trim(whatsapp_normalizado)) >= 10),
  constraint clientes_whatsapp_normalizado_unique unique (whatsapp_normalizado)
);

create index if not exists idx_clientes_nome on public.clientes using btree (nome);
create index if not exists idx_clientes_whatsapp_normalizado on public.clientes using btree (whatsapp_normalizado);
create index if not exists idx_clientes_ativo_nome on public.clientes using btree (ativo, nome);

create or replace function public.set_clientes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_clientes_updated_at on public.clientes;
create trigger trg_clientes_updated_at
before update on public.clientes
for each row execute function public.set_clientes_updated_at();

alter table public.clientes enable row level security;

drop policy if exists "Clientes: leitura autenticada" on public.clientes;
create policy "Clientes: leitura autenticada"
on public.clientes
for select
to authenticated
using (auth.role() = 'authenticated');

drop policy if exists "Clientes: cadastro autenticado" on public.clientes;
create policy "Clientes: cadastro autenticado"
on public.clientes
for insert
to authenticated
with check (auth.role() = 'authenticated');

drop policy if exists "Clientes: edicao autenticada" on public.clientes;
create policy "Clientes: edicao autenticada"
on public.clientes
for update
to authenticated
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

grant select, insert, update on table public.clientes to authenticated;

notify pgrst, 'reload schema';
