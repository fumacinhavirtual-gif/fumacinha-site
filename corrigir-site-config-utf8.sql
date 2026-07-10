-- Correção de acentuação UTF-8 da Fumacinha
-- Execute no Supabase SQL Editor se a tabela SITE_CONFIG ficou com textos quebrados.

update public."SITE_CONFIG"
set
  titulo_principal = 'Fumacinha',
  subtitulo = 'Loja Fumacinha com produtos separados, estoque proprio e atendimento pelo WhatsApp.',
  entrega = 'Para todo o Brasil',
  pix = 'Preço especial à vista',
  parcelamento = 'Em até 10x sem juros',
  updated_at = now()
where id = 1;
