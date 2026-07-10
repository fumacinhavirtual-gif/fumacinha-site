# Publicacao do site Fumacinha

O site Fumacinha agora usa Supabase para:

- produtos
- categorias
- banners
- configuracoes do site
- estoque
- vendas
- financeiro

## 1. Criar tabelas no Supabase

No Supabase, abra:

SQL Editor > New query

Cole e execute o arquivo:

```text
supabase-completo.sql
```

Esse SQL cria/atualiza:

- `PRODUTOS`
- `CATEGORIAS`
- `BANNERS_HOME`
- `SITE_CONFIG`
- `VENDAS`
- politicas RLS
- gatilhos de `updated_at`

Nao use Connection String. A criacao do banco deve ser feita pela interface atual do Supabase, no SQL Editor.

Depois de executar, valide:

```bash
npm run verify:supabase
```

Para testar vitrine, carrinho, categorias, banners, estoque e financeiro com dados iniciais, execute tambem:

```text
supabase-dados-exemplo.sql
```

## 2. Configurar URL e Publishable Key

Abra:

```text
supabase-config.js
```

Confira:

```js
window.FUMACINHA_SUPABASE_URL = "SUA_PROJECT_URL";
window.FUMACINHA_SUPABASE_PUBLISHABLE_KEY = "SUA_PUBLISHABLE_KEY";
```

Os valores ficam no painel do projeto Fumacinha, nas configuracoes de API/Data API do Supabase. Use somente:

- Project URL
- Publishable Key

## 3. Publicar na Vercel

O arquivo `vercel.json` na raiz do projeto usa o build:

```text
npm run build
```

Na Vercel:

1. Importe o projeto.
2. Configure `FUMACINHA_SUPABASE_URL` e `FUMACINHA_SUPABASE_PUBLISHABLE_KEY`.
3. Use o deploy padrao com `Output Directory` igual a `.`.
4. Depois conecte o dominio proprio.

## Observacao de seguranca

As politicas RLS deixam o cliente comum apenas com leitura publica dos dados necessarios do site.

O visitante anonimo pode visualizar:

- produtos ativos e com estoque
- categorias ativas na Home
- banners ativos
- configuracoes publicas do site

Apenas usuarios logados pelo Supabase Auth podem:

- criar, editar ou excluir produtos
- alterar estoque
- registrar, editar ou excluir vendas
- editar categorias
- editar banners
- editar configuracoes

Com essas politicas, qualquer painel interno precisa ter uma sessao valida do Supabase Auth para salvar alteracoes.

