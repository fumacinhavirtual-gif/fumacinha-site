-- Fumacinha - dados de exemplo para testar a loja.
-- Execute no SQL Editor do projeto Supabase da Fumacinha, depois de supabase-completo.sql.

insert into public."SITE_CONFIG" (
  id,
  titulo_principal,
  subtitulo,
  banners,
  textos_pagina_inicial,
  whatsapp,
  entrega,
  pix,
  parcelamento,
  carrossel_ativo,
  carrossel_intervalo
) values (
  1,
  'Fumacinha',
  'Produtos selecionados com estoque proprio e atendimento pelo WhatsApp.',
  '',
  'Escolha seus produtos favoritos e finalize seu pedido pelo WhatsApp da Fumacinha.',
  '62991877597',
  'Entrega combinada pelo WhatsApp',
  'Preco especial no Pix',
  'Parcelamento a combinar',
  true,
  5
) on conflict (id) do update set
  titulo_principal = excluded.titulo_principal,
  subtitulo = excluded.subtitulo,
  banners = excluded.banners,
  textos_pagina_inicial = excluded.textos_pagina_inicial,
  whatsapp = excluded.whatsapp,
  entrega = excluded.entrega,
  pix = excluded.pix,
  parcelamento = excluded.parcelamento,
  carrossel_ativo = excluded.carrossel_ativo,
  carrossel_intervalo = excluded.carrossel_intervalo;

insert into public."CATEGORIAS" (nome, imagem, ordem, ativo_home) values
  ('Essenciais', '', 1, true),
  ('Presentes', '', 2, true),
  ('Promocoes', '', 3, true)
on conflict (nome) do update set
  imagem = excluded.imagem,
  ordem = excluded.ordem,
  ativo_home = excluded.ativo_home;

insert into public."PRODUTOS" (nome, preco, pix, imagem, categoria, estoque, ativo, destaque_home, ocultar_home) values
  ('Kit Fumacinha Inicial', 129.90, 119.90, 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop', 'Essenciais', 12, true, true, false),
  ('Combo Fumacinha Premium', 249.90, 229.90, 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=1200&auto=format&fit=crop', 'Presentes', 8, true, true, false),
  ('Produto Teste Estoque Baixo', 59.90, 54.90, 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop', 'Promocoes', 2, true, false, false)
on conflict do nothing;

insert into public."BANNERS_HOME" (imagem, titulo, subtitulo, link, ordem, ativo) values
  ('https://images.unsplash.com/photo-1492724441997-5dc865305da7?q=80&w=1600&auto=format&fit=crop', 'Fumacinha chegou', 'Produtos selecionados, com estoque proprio.', '#produtos', 1, true),
  ('https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1600&auto=format&fit=crop', 'Teste de banners', 'Carrossel ativo no Supabase da Fumacinha.', '#produtos', 2, true)
on conflict do nothing;

insert into public."VENDAS" (
  produto_id,
  nome_produto,
  quantidade,
  valor_unitario,
  valor_total,
  custo_unitario,
  custo_total,
  data_venda
) values (
  'exemplo',
  'Venda de exemplo Fumacinha',
  1,
  129.90,
  129.90,
  80.00,
  80.00,
  now()
);
