-- Execute no SQL Editor do projeto Supabase da Fumacinha antes de registrar trocas.
-- Registros de taxa de troca nao sao vendas nem movimentam estoque.

create table if not exists public."TAXAS_TROCAS" (
  id bigserial primary key,
  data_troca date not null,
  entregador_id bigint not null references public."ENTREGADORES"(id),
  entregador_nome text not null,
  produto_descricao text not null default '',
  forma_pagamento text not null check (forma_pagamento in ('Pix', 'QR Code Pix', 'Dinheiro')),
  taxa_entrega numeric(12, 2) not null check (taxa_entrega > 0),
  cancelada boolean not null default false,
  cancelada_em timestamptz,
  usuario_id uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists taxas_trocas_data_idx
  on public."TAXAS_TROCAS" (data_troca desc);
create index if not exists taxas_trocas_entregador_idx
  on public."TAXAS_TROCAS" (entregador_id, data_troca desc);

create or replace function public.validar_taxa_troca_caixa_aberto()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (
    select 1 from public."FECHAMENTOS_CAIXA" fechamento
    where fechamento.data_caixa = new.data_troca and fechamento.status = 'fechado'
  ) then
    raise exception 'Reabra o fechamento deste dia antes de registrar ou alterar a taxa de troca.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_validar_taxa_troca_caixa_aberto on public."TAXAS_TROCAS";
create trigger trg_validar_taxa_troca_caixa_aberto
  before insert or update on public."TAXAS_TROCAS"
  for each row execute function public.validar_taxa_troca_caixa_aberto();

alter table public."TAXAS_TROCAS" enable row level security;
grant select, insert, update on public."TAXAS_TROCAS" to authenticated;
grant usage, select on sequence public."TAXAS_TROCAS_id_seq" to authenticated;

drop policy if exists "TAXAS_TROCAS_SELECT_AUTH" on public."TAXAS_TROCAS";
create policy "TAXAS_TROCAS_SELECT_AUTH" on public."TAXAS_TROCAS"
  for select to authenticated using (auth.uid() is not null);
drop policy if exists "TAXAS_TROCAS_INSERT_AUTH" on public."TAXAS_TROCAS";
create policy "TAXAS_TROCAS_INSERT_AUTH" on public."TAXAS_TROCAS"
  for insert to authenticated with check (usuario_id = auth.uid() and cancelada = false);
drop policy if exists "TAXAS_TROCAS_UPDATE_AUTH" on public."TAXAS_TROCAS";
create policy "TAXAS_TROCAS_UPDATE_AUTH" on public."TAXAS_TROCAS"
  for update to authenticated using (auth.uid() is not null)
  with check (auth.uid() is not null);

notify pgrst, 'reload schema';
