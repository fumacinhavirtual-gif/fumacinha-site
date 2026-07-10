const fs = require("fs");
const path = require("path");
const { writeSupabaseConfig } = require("./write-supabase-config");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

const ignored = new Set([".env", ".env.local", ".git", ".vercel", "dist", "node_modules"]);

function shouldIgnore(name) {
  return ignored.has(name);
}

function copyRecursive(source, target) {
  const stats = fs.statSync(source);
  if (stats.isDirectory()) {
    fs.mkdirSync(target, { recursive: true });
    for (const entry of fs.readdirSync(source)) {
      if (shouldIgnore(entry)) continue;
      copyRecursive(path.join(source, entry), path.join(target, entry));
    }
    return;
  }

  fs.copyFileSync(source, target);
}

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const entry of fs.readdirSync(root)) {
  if (shouldIgnore(entry)) continue;
  copyRecursive(path.join(root, entry), path.join(dist, entry));
}

writeSupabaseConfig({ outputPath: path.join(dist, "supabase-config.js"), requireEnv: true });
console.log("Build da Fumacinha gerado em dist/.");
