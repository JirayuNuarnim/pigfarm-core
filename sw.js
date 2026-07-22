/* THE CORE service worker — app-shell caching for speed + offline shell.
   - HTML navigations: network-first (always latest when online, cached shell offline)
   - same-origin static (css/js/png/ico/json): stale-while-revalidate (instant, refreshes in bg)
   - CDN libraries: cache-first
   - Supabase API/auth/storage: never cached (always live) */
const CACHE = "thecore-v3";
const CORE = [
  "./", "./dashboard.html", "./index.html",
  "./shared/style.css", "./shared/supabase-client.js", "./shared/auth-guard.js", "./shared/lightbox.js",
  "./favicon.ico", "./icon-192.png", "./icon-512.png", "./manifest.json",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // never intercept Supabase (data/auth/storage must stay live)
  if (url.hostname.endsWith("supabase.co")) return;

  // CDN libraries: cache-first
  if (url.hostname.endsWith("jsdelivr.net") || url.hostname.endsWith("unpkg.com")) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res;
    })));
    return;
  }

  if (url.origin === self.location.origin) {
    const isDoc = req.mode === "navigate" || req.destination === "document";
    if (isDoc) {
      // network-first so online users always get the latest page
      e.respondWith(
        fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })
          .catch(() => caches.match(req).then((hit) => hit || caches.match("./dashboard.html")))
      );
    } else {
      // static assets: stale-while-revalidate
      e.respondWith(caches.match(req).then((hit) => {
        const net = fetch(req).then((res) => {
          if (res && res.status === 200) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
          return res;
        }).catch(() => hit);
        return hit || net;
      }));
    }
  }
});
