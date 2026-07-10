const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const envPath = path.join(root, ".env");

function loadEnv() {
  if (!fs.existsSync(envPath)) {
    throw new Error("Arquivo .env nao encontrado.");
  }

  return Object.fromEntries(
    fs
      .readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      })
  );
}

function normalizeSupabaseUrl(value) {
  return String(value || "").replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

async function readTable(baseUrl, key, table) {
  const url = `${baseUrl}/rest/v1/${encodeURIComponent(table)}?select=*&limit=1`;
  const response = await fetch(url, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  const body = await response.text();
  return { table, status: response.status, ok: response.ok, body };
}

async function main() {
  const env = loadEnv();
  const baseUrl = normalizeSupabaseUrl(env.FUMACINHA_SUPABASE_URL);
  const key = env.FUMACINHA_SUPABASE_PUBLISHABLE_KEY;
  const tables = ["PRODUTOS", "CATEGORIAS", "BANNERS_HOME", "SITE_CONFIG", "VENDAS"];

  if (!baseUrl || baseUrl.includes("COLE_AQUI")) throw new Error("FUMACINHA_SUPABASE_URL nao configurada.");
  if (!key || key.includes("COLE_AQUI")) throw new Error("FUMACINHA_SUPABASE_PUBLISHABLE_KEY nao configurada.");

  console.log(`Supabase Fumacinha: ${baseUrl}`);

  let hasError = false;
  for (const table of tables) {
    const result = await readTable(baseUrl, key, table);
    if (result.ok) {
      console.log(`OK ${table}: leitura publica respondeu ${result.status}`);
      continue;
    }

    hasError = true;
    console.log(`ERRO ${table}: HTTP ${result.status} ${result.body}`);
  }

  if (hasError) {
    console.log("");
    console.log("Execute supabase-completo.sql no SQL Editor da Fumacinha e rode este verificador novamente.");
    process.exit(1);
  }

  console.log("");
  console.log("Banco da Fumacinha verificado com Project URL + Publishable Key.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
