-- Fumacinha - correcao da coluna logo_url em SITE_CONFIG
-- Execute este arquivo no SQL Editor do Supabase da Fumacinha.
-- Pode executar mais de uma vez. Nao apaga dados.

alter table public."SITE_CONFIG"
add column if not exists logo_url text not null default '';

update public."SITE_CONFIG"
set logo_url = ''
where logo_url is null;

comment on column public."SITE_CONFIG".logo_url
is 'URL publica da foto de perfil/logo da loja Fumacinha.';

grant select on public."SITE_CONFIG" to anon;
grant select, insert, update on public."SITE_CONFIG" to authenticated;

select pg_notify('pgrst', 'reload schema');
