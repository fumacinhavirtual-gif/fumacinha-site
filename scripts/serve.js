const fs = require("fs");
const http = require("http");
const path = require("path");

const root = path.resolve(__dirname, "..");
const port = Number(process.env.PORT || 5173);

const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

function resolvePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const clean = decoded === "/" ? "/index.html" : decoded;
  const filePath = path.resolve(root, `.${clean}`);
  if (!filePath.startsWith(root)) return null;
  return filePath;
}

const server = http.createServer((request, response) => {
  const filePath = resolvePath(request.url || "/");
  if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Arquivo nao encontrado.");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  response.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(response);
});

server.listen(port, () => {
  console.log(`Fumacinha local: http://localhost:${port}`);
});
