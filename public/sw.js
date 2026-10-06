/* Service worker: shows reminder notifications and (in production) caches the app shell for offline use. */
const CACHE = "lb-shell-v1";
const CACHE_ENABLED = new URL(self.location.href).searchParams.get("cache") === "1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  if (!CACHE_ENABLED) return;
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin || url.pathname === "/sw.js") return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req);
    const net = fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  })());
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const tab = (e.notification.data && e.notification.data.tab) || "dashboard";
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of all) {
      await c.focus();
      c.postMessage({ type: "open-tab", tab });
      return;
    }
    await self.clients.openWindow("/#" + tab);
  })());
});
