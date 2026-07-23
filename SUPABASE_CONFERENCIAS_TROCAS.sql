-- Fumacinha Controle - persistencia dos horarios das trocas
-- Execute este arquivo no SQL Editor do Supabase da Fumacinha.
-- Idempotente: cria/ajusta a tabela sem apagar dados existentes.

create table if not exists public."CONFERENCIAS_TROCAS" (
  id bigserial primary key,
  data_caixa date not null,
  horario_rota text not null,
  quantidade_trocas integer not null default 0,
  trocas_retornadas integer not null default 0,
  conferido boolean not null default false,
  usuario_id uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conferencias_trocas_quantidade_check check (quantidade_trocas >= 0),
  constraint conferencias_trocas_retornadas_check check (trocas_retornadas >= 0),
  constraint conferencias_trocas_horario_check check (horario_rota in ('11:00', '13:00', '15:00', '17:00', '19:00', '21:00'))
);

alter table public."CONFERENCIAS_TROCAS"
  add column if not exists data_caixa date,
  add column if not exists horario_rota text,
  add column if not exists quantidade_trocas integer default 0,
  add column if not exists trocas_retornadas integer default 0,
  add column if not exists conferido boolean default false,
  add column if not exists usuario_id uuid default auth.uid(),
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

update public."CONFERENCIAS_TROCAS"
set
  quantidade_trocas = coalesce(quantidade_trocas, 0),
  trocas_retornadas = coalesce(trocas_retornadas, 0),
  conferido = coalesce(conferido, false),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now());

alter table public."CONFERENCIAS_TROCAS"
  alter column quantidade_trocas set default 0,
  alter column quantidade_trocas set not null,
  alter column trocas_retornadas set default 0,
  alter column trocas_retornadas set not null,
  alter column conferido set default false,
  alter column conferido set not null,
  alter column created_at set default now(),
  alter column created_at set not null,
  alter column updated_at set default now(),
  alter column updated_at set not null;

create unique index if not exists conferencias_trocas_data_horario_uidx
  on public."CONFERENCIAS_TROCAS" (data_caixa, horario_rota);

create index if not exists conferencias_trocas_data_idx
  on public."CONFERENCIAS_TROCAS" (data_caixa desc);

create or replace function public.set_conferencias_trocas_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  if new.usuario_id is null then
    new.usuario_id = auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_conferencias_trocas_updated_at on public."CONFERENCIAS_TROCAS";

create trigger trg_conferencias_trocas_updated_at
before insert or update on public."CONFERENCIAS_TROCAS"
for each row
execute function public.set_conferencias_trocas_updated_at();

alter table public."CONFERENCIAS_TROCAS" enable row level security;

grant select, insert, update, delete on public."CONFERENCIAS_TROCAS" to authenticated;
grant usage, select on sequence public."CONFERENCIAS_TROCAS_id_seq" to authenticated;

drop policy if exists "CONFERENCIAS_TROCAS_SELECT_AUTH" on public."CONFERENCIAS_TROCAS";
create policy "CONFERENCIAS_TROCAS_SELECT_AUTH"
on public."CONFERENCIAS_TROCAS"
for select
to authenticated
using (true);

drop policy if exists "CONFERENCIAS_TROCAS_INSERT_AUTH" on public."CONFERENCIAS_TROCAS";
create policy "CONFERENCIAS_TROCAS_INSERT_AUTH"
on public."CONFERENCIAS_TROCAS"
for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "CONFERENCIAS_TROCAS_UPDATE_AUTH" on public."CONFERENCIAS_TROCAS";
create policy "CONFERENCIAS_TROCAS_UPDATE_AUTH"
on public."CONFERENCIAS_TROCAS"
for update
to authenticated
using (auth.uid() is not null)
with check (auth.uid() is not null);

drop policy if exists "CONFERENCIAS_TROCAS_DELETE_AUTH" on public."CONFERENCIAS_TROCAS";
create policy "CONFERENCIAS_TROCAS_DELETE_AUTH"
on public."CONFERENCIAS_TROCAS"
for delete
to authenticated
using (auth.uid() is not null);

notify pgrst, 'reload schema';
