const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const envPath = path.join(root, ".env");

function loadLocalEnv() {
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

function jsString(value) {
  return JSON.stringify(value || "");
}

function writeSupabaseConfig(options = {}) {
  const outputPath = options.outputPath || path.join(root, "supabase-config.js");
  const requireEnv = Boolean(options.requireEnv);

  loadLocalEnv();

  const url = process.env.FUMACINHA_SUPABASE_URL;
  const key = process.env.FUMACINHA_SUPABASE_PUBLISHABLE_KEY;

  if (requireEnv && (!url || !key)) {
    throw new Error("Configure FUMACINHA_SUPABASE_URL e FUMACINHA_SUPABASE_PUBLISHABLE_KEY na Vercel antes do deploy.");
  }

  const content = [
    `window.FUMACINHA_SUPABASE_URL = ${jsString(url || "COLE_AQUI_A_PROJECT_URL_DA_FUMACINHA")};`,
    `window.FUMACINHA_SUPABASE_PUBLISHABLE_KEY = ${jsString(key || "COLE_AQUI_A_PUBLISHABLE_KEY_DA_FUMACINHA")};`,
    "",
  ].join("\n");

  fs.writeFileSync(outputPath, content, "utf8");
  console.log(`supabase-config.js gerado em ${outputPath}.`);
}

if (require.main === module) {
  writeSupabaseConfig();
}

module.exports = { writeSupabaseConfig };
