create table if not exists public."SITE_CONFIG" (
  id integer primary key default 1,
  titulo_principal text default 'Fumacinha',
  subtitulo text default 'Loja Fumacinha com produtos separados, estoque proprio e atendimento pelo WhatsApp.',
  banners text default '',
  textos_pagina_inicial text default '',
  whatsapp text default '62991877597',
  entrega text default 'Para todo o Brasil',
  pix text default 'Preço especial à vista',
  parcelamento text default 'Em até 10x sem juros',
  updated_at timestamptz default now(),
  constraint site_config_single_row check (id = 1)
);

insert into public."SITE_CONFIG" (
  id,
  titulo_principal,
  subtitulo,
  banners,
  textos_pagina_inicial,
  whatsapp,
  entrega,
  pix,
  parcelamento
) values (
  1,
  'Fumacinha',
  'Loja Fumacinha com produtos separados, estoque proprio e atendimento pelo WhatsApp.',
  '',
  '',
  '62991877597',
  'Para todo o Brasil',
  'Preço especial à vista',
  'Em até 10x sem juros'
) on conflict (id) do nothing;

alter table public."SITE_CONFIG" enable row level security;

drop policy if exists "SITE_CONFIG leitura publica" on public."SITE_CONFIG";
create policy "SITE_CONFIG leitura publica"
on public."SITE_CONFIG"
for select
using (true);

drop policy if exists "SITE_CONFIG inserir pelo site" on public."SITE_CONFIG";
create policy "SITE_CONFIG inserir pelo site"
on public."SITE_CONFIG"
for insert
with check (id = 1);

drop policy if exists "SITE_CONFIG editar pelo site" on public."SITE_CONFIG";
create policy "SITE_CONFIG editar pelo site"
on public."SITE_CONFIG"
for update
using (id = 1)
with check (id = 1);
