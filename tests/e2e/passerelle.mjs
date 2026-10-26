// Reproduit l'adresse unique de Supabase : /auth/v1 → Auth, /rest/v1 → PostgREST.
import http from "node:http";

const cibles = { "/auth/v1": 54390, "/rest/v1": 54391 };

http
  .createServer((req, res) => {
    const prefixe = Object.keys(cibles).find((p) => req.url.startsWith(p));
    if (!prefixe) return res.writeHead(404).end();
    const amont = http.request(
      { host: "127.0.0.1", port: cibles[prefixe], method: req.method, path: req.url.slice(prefixe.length) || "/", headers: req.headers },
      (r) => {
        res.writeHead(r.statusCode, r.headers);
        r.pipe(res);
      },
    );
    amont.on("error", () => res.writeHead(502).end());
    req.pipe(amont);
  })
  .listen(54321, "127.0.0.1");
