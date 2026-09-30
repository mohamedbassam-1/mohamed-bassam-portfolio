import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { gzipSync } from "node:zlib";

const root = resolve(process.argv.includes("--production") ? "dist" : ".");
const port = Number(process.env.PORT || 8000);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
  ".xml": "application/xml",
};
createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
    const path = resolve(
      root,
      "." + (pathname === "/" ? "/index.html" : pathname),
    );
    if (
      !path.startsWith(root + sep) ||
      pathname.split("/").some((part) => part.startsWith("."))
    )
      throw new Error("Not found");
    if (!(await stat(path)).isFile()) throw new Error("Not found");
    const content = await readFile(path);
    const compressed =
      process.argv.includes("--production") &&
      /\.(html|css|js|svg|txt|xml)$/.test(path) &&
      request.headers["accept-encoding"]?.includes("gzip");
    response.writeHead(200, {
      "Content-Type": types[extname(path)] || "application/octet-stream",
      "Cache-Control": "no-cache",
      ...(compressed
        ? { "Content-Encoding": "gzip", Vary: "Accept-Encoding" }
        : {}),
    });
    response.end(compressed ? gzipSync(content) : content);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
}).listen(port, "127.0.0.1", () =>
  console.log(`Portfolio preview: http://localhost:${port}`),
);
