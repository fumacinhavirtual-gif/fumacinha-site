# Fumacinha

Projeto independente criado a partir da base visual da Confortti, sem alterar a pasta, banco, GitHub ou Vercel da Confortti.

## Estrutura

```text
Fumacinha/
  assets/
    fumacinha-logo.png
    fumacinha-showroom.png
    whatsapp-logo.png
  scripts/
    write-supabase-config.js
    verify-supabase.js
    serve.js
  admin.css
  admin.html
  admin.js
  index.html
  preview-celular.html
  script.js
  style.css
  supabase-config.js
  supabase-completo.sql
  supabase-dados-exemplo.sql
  supabase-categorias-destaques.sql
  supabase-site-config.sql
  supabase-vendas-estoque.sql
  corrigir-site-config-utf8.sql
  .env
  .env.example
  .gitignore
  package.json
  vercel.json
  PUBLICACAO.md
```

## Arquivos alterados

- `index.html`: nome, metadados, textos e assets da Fumacinha.
- `script.js`: nome da loja, textos, logs, variaveis Supabase e mensagens da Fumacinha.
- `admin.html` e `admin.js`: painel apontando para variaveis da Fumacinha.
- `supabase-config.js`: placeholders da Fumacinha, sem URL/chave da Confortti.
- `supabase-*.sql`: defaults e comentarios adaptados para Fumacinha.
- `PUBLICACAO.md`: instrucoes de publicacao da Fumacinha.
- `assets/*`: arquivos renomeados para Fumacinha.
- `.env`, `.env.example`, `package.json`, `vercel.json`, `scripts/write-supabase-config.js`, `scripts/verify-supabase.js`: arquivos para ambiente, build, verificacao REST e deploy.

## Variaveis do .env

```env
FUMACINHA_SUPABASE_URL=https://SEU-PROJETO.supabase.co
FUMACINHA_SUPABASE_PUBLISHABLE_KEY=SUA_PUBLISHABLE_KEY
```

Use apenas dados do projeto Supabase novo da Fumacinha.

Nao use Connection String neste projeto. A aplicacao usa somente Project URL e Publishable Key.

## SQL do banco da Fumacinha

Execute o arquivo `supabase-completo.sql` no SQL Editor do Supabase novo da Fumacinha.

No painel atual do Supabase:

1. Abra o projeto Fumacinha.
2. Abra `SQL Editor`.
3. Clique em `New query`.
4. Cole todo o conteudo de `supabase-completo.sql`.
5. Clique em `Run`.

Esse SQL cria:

- `PRODUTOS`
- `CATEGORIAS`
- `BANNERS_HOME`
- `SITE_CONFIG`
- `VENDAS`
- politicas RLS
- triggers de `updated_at`

O SQL nao insere produtos da Confortti. Produtos, categorias, estoque, vendas e configuracoes comecam separados no banco novo.

Depois de executar o SQL, valide pelo REST usando somente Project URL + Publishable Key:

```bash
npm run verify:supabase
```

Para popular dados de teste, execute tambem `supabase-dados-exemplo.sql` no SQL Editor da Fumacinha.

## Executar localmente

1. Edite `.env` com a URL e Publishable Key do Supabase da Fumacinha.
2. Gere o arquivo de configuracao:

```bash
npm run build
```

3. Abra localmente:

```bash
npm run dev
```

4. Acesse:

```text
http://localhost:5173
```

O servidor local usa Node.js e nao depende de Python.

## Publicar no GitHub

Crie um repositorio novo chamado `fumacinha` e publique esta pasta, sem usar o repositorio da Confortti:

```bash
git init
git add .
git commit -m "Criar projeto Fumacinha"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/fumacinha.git
git push -u origin main
```

## Publicar na Vercel

1. Crie um projeto novo na Vercel.
2. Importe o repositorio GitHub `fumacinha`.
3. Configure as variaveis de ambiente:

```env
FUMACINHA_SUPABASE_URL=https://SEU-PROJETO.supabase.co
FUMACINHA_SUPABASE_PUBLISHABLE_KEY=SUA_PUBLISHABLE_KEY
```

4. Use:

```text
Build Command: npm run build
Output Directory: .
```

5. Publique em uma Vercel separada da Confortti.
