# Relatorio de integracao - Fumacinha

Data: 2026-07-10

## Status geral

A Fumacinha esta configurada como projeto independente da Confortti.

- Project URL: `https://rcjsezbqenjoxrfavmmg.supabase.co`
- Publishable Key: configurada em `.env` e gerada em `supabase-config.js`
- Banco: tabelas criadas no Supabase da Fumacinha via `supabase-completo.sql`
- Connection String: nao utilizada
- Supabase da Confortti: nenhuma referencia ativa no projeto Fumacinha
- WhatsApp da Fumacinha: `62991877597`

## Tabelas verificadas

`npm.cmd run verify:supabase` confirmou leitura REST com status 200 para:

- `PRODUTOS`
- `CATEGORIAS`
- `BANNERS_HOME`
- `SITE_CONFIG`
- `VENDAS`

## Estado dos dados

Consulta REST confirmou:

- `SITE_CONFIG`: 1 registro da Fumacinha
- `PRODUTOS`: 3 registros publicos de teste
- `CATEGORIAS`: 3 registros publicos de teste
- `BANNERS_HOME`: 2 registros publicos de teste
- `VENDAS`: protegida por RLS para usuarios autenticados

Foram criados `supabase-dados-exemplo.sql` e `DADOS_TESTE_FUMACINHA.sql` para popular dados iniciais de teste pelo SQL Editor da Fumacinha.

## Testes realizados

- Vitrine local: carregou em `http://localhost:5173`
- Marca: exibiu `Fumacinha`
- Rodape: exibiu `Fumacinha`
- Supabase: carregou com a Project URL da Fumacinha
- Categorias: exibiu `Essenciais`, `Presentes` e `Promocoes`
- Produtos: exibiu `Kit Fumacinha Inicial`, `Combo Fumacinha Premium` e `Produto Teste Estoque Baixo`
- Banners: exibiu carrossel ativo com 2 banners
- Carrinho: adicionou `Kit Fumacinha Inicial`, contador ficou em 1, checkout habilitou e exibiu `Total: R$ 129,90` com `Taxa de entrega: A combinar`
- WhatsApp: gerou URL `api.whatsapp.com/send` com produto, cliente de teste, bairro, quantidade, valor unitario e total com taxa de entrega a combinar
- Atualizacao do resumo: removidas as exibicoes de condicoes alternativas de pagamento da vitrine, carrinho, modal de pedido e mensagem de WhatsApp
- Novo WhatsApp: mensagem validada com `Nome`, `Bairro`, `Pedido`, `Quantidade`, `Valor unitario` e `Total + Taxa de entrega`
- WhatsApp final: botao `Finalizar pedido no WhatsApp` abriu `api.whatsapp.com/send/?phone=62991877597`
- Mensagem final validada:
  - `Nome: Cliente Teste`
  - `Bairro: Centro`
  - `Pedido`
  - `Quantidade: 1`
  - `Valor unitario: R$ 129,90`
  - `Total: R$ 129,90 + Taxa de entrega: A combinar`
- Termos removidos: nao apareceram `Pix`, `Parcelamento`, `Desconto`, `10x sem juros` ou `Cidade`
- Numero antigo: nao encontrado no projeto nem na mensagem gerada
- Conteudo visivel: vitrine validada sem mencao a Confortti
- Painel administrativo: abriu em `admin.html` com titulo `Painel Administrativo | Fumacinha`
- Cadastro sem login: bloqueado com mensagem `Faça login para editar produtos.`
- Escrita anonima via REST: bloqueada por RLS, como esperado
- Usuario de teste via Supabase Auth: criado sem sessao imediata, pois o projeto exige confirmacao de e-mail

## Testes que dependem de dados/login

Para testar cadastro real de categorias, produtos, banners, estoque e vendas pelo painel, confirme/crie um usuario no Supabase Auth da Fumacinha e entre pelo modo de edicao da loja.

Para testar vitrine completa, carrinho com produto e envio do pedido com itens, execute primeiro `supabase-dados-exemplo.sql` no SQL Editor.

## Ajuste opcional de dados de exemplo

O arquivo `CORRIGIR_BANNER_FUMACINHA.sql` corrige um texto legado de banner direto no Supabase, caso o dado antigo ainda exista no banco. A aplicacao tambem limpa esse texto ao renderizar, entao a vitrine validada nao mostra Confortti.

## Publicacao

O projeto esta preparado para GitHub e Vercel:

- `.gitignore` evita versionar `.env`, `node_modules`, `.vercel` e `dist`
- `.env.example` documenta as variaveis necessarias
- `package.json` possui `build`, `dev`, `start` e `verify:supabase`
- `vercel.json` usa `npm run build` e publica a pasta `dist`

Na Vercel, configure:

```env
FUMACINHA_SUPABASE_URL=https://rcjsezbqenjoxrfavmmg.supabase.co
FUMACINHA_SUPABASE_PUBLISHABLE_KEY=sb_publishable_tnP4JsqPllK-gsh2Mkp_Cw_NZDHL9W9
```
