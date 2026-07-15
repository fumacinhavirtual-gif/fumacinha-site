-- Corrige somente o registro existente do Duke.
-- Nao cria produto e nao altera nome, categoria, estoque, imagem, custo ou preco.

begin;

do $$
declare
  duke_count integer;
begin
  select count(*)
    into duke_count
    from public."PRODUTOS"
   where nome ilike '%duke%';

  if duke_count = 0 then
    raise exception 'Nenhum produto Duke foi encontrado';
  end if;
end
$$;

select
  'antes' as fase,
  id,
  nome,
  categoria,
  estoque,
  ativo,
  preco,
  imagem,
  custo,
  destaque_home,
  ocultar_home,
  created_at,
  updated_at
from public."PRODUTOS"
where nome ilike '%duke%';

update public."PRODUTOS"
   set ativo = true
 where nome ilike '%duke%'
   and estoque > 0
   and ativo = false;

select
  'depois' as fase,
  id,
  nome,
  categoria,
  estoque,
  ativo,
  preco,
  imagem,
  custo,
  destaque_home,
  ocultar_home,
  created_at,
  updated_at
from public."PRODUTOS"
where nome ilike '%duke%';

commit;
