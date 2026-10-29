// Service worker de PGM MUANDA DIGITAL : rend l'application installable (icône sur le
// téléphone ou l'ordinateur). Il ne met aucune donnée en cache : les informations des
// membres restent sur le serveur. Sans connexion, il affiche une page d'explication.
const HORS_LIGNE = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pas de connexion · PGM Muanda</title></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0b1f4b;color:#fff;font-family:system-ui,sans-serif;text-align:center;padding:24px">
<div><p style="font-size:22px;font-weight:700;margin:0 0 8px">Pas de connexion Internet</p>
<p style="opacity:.8;margin:0 0 24px">Vérifiez votre connexion, puis réessayez.</p>
<button onclick="location.reload()" style="font-size:16px;font-weight:600;padding:14px 24px;border:0;border-radius:12px;background:#d4a72c;color:#0b1f4b">Réessayer</button></div>
</body></html>`;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  if (e.request.mode !== "navigate") return;
  e.respondWith(fetch(e.request).catch(() => new Response(HORS_LIGNE, { headers: { "Content-Type": "text/html; charset=utf-8" } })));
});
