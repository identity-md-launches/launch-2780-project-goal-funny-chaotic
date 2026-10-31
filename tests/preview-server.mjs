import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
};

export async function previewServer(root = "dist", rpc = null) {
  const base = resolve(root);
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      if (url.pathname === "/__rpc" && rpc) {
        let body = "";
        for await (const chunk of req) body += chunk;
        const upstream = await fetch(rpc, {
          method: "POST",
          body,
          headers: { "content-type": "application/json" },
        });
        res.writeHead(upstream.status, { "content-type": "application/json" });
        res.end(await upstream.text());
        return;
      }
      if (!url.pathname.startsWith("/preview/")) {
        res.writeHead(404);
        res.end();
        return;
      }
      const filename = resolve(
        base,
        decodeURIComponent(
          url.pathname.slice("/preview/".length) || "index.html",
        ),
      );
      if (!filename.startsWith(base + sep)) {
        res.writeHead(403);
        res.end();
        return;
      }
      const data = await readFile(filename);
      res.writeHead(200, {
        "content-type": mime[extname(filename)] ?? "application/octet-stream",
        "cache-control": "no-store",
      });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    url: `http://127.0.0.1:${server.address().port}/preview/`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
