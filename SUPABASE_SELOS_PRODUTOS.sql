-- Execute no SQL Editor do Supabase da Fumacinha.
-- Mantem os dados e as policies existentes. Pode ser executado novamente.
begin;

alter table public."PRODUTOS"
  add column if not exists selo_produto text not null default '';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public."PRODUTOS"'::regclass
      and conname = 'produtos_selo_produto_check'
  ) then
    alter table public."PRODUTOS"
      add constraint produtos_selo_produto_check
      check (selo_produto in ('', 'novidade', 'lancamento'));
  end if;
end;
$$;

comment on column public."PRODUTOS".selo_produto is
  'Selo publico do produto: vazio, novidade ou lancamento. Edicao segue a RLS existente.';

notify pgrst, 'reload schema';
commit;
