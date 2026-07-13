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

function stampAssetVersion() {
  const versionSource = process.env.VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_DEPLOYMENT_ID || String(Date.now());
  const version = versionSource.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24);
  const files = [
    {
      file: "index.html",
      replacements: [
        [/\.\/style\.css(?:\?v=[^"]*)?/g, `./style.css?v=${version}`],
        [/\.\/script\.js(?:\?v=[^"]*)?/g, `./script.js?v=${version}`],
      ],
    },
    {
      file: "controle.html",
      replacements: [
        [/\.\/controle\.css(?:\?v=[^"]*)?/g, `./controle.css?v=${version}`],
        [/\.\/controle\.js(?:\?v=[^"]*)?/g, `./controle.js?v=${version}`],
      ],
    },
  ];

  files.forEach(({ file, replacements }) => {
    const filePath = path.join(dist, file);
    if (!fs.existsSync(filePath)) return;
    const html = fs.readFileSync(filePath, "utf8");
    const stamped = replacements.reduce((content, [pattern, replacement]) => content.replace(pattern, replacement), html);
    fs.writeFileSync(filePath, stamped);
  });
}

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const entry of fs.readdirSync(root)) {
  if (shouldIgnore(entry)) continue;
  copyRecursive(path.join(root, entry), path.join(dist, entry));
}

stampAssetVersion();
writeSupabaseConfig({ outputPath: path.join(dist, "supabase-config.js"), requireEnv: true });
console.log("Build da Fumacinha gerado em dist/.");
