const CACHE = "spoon-tasks-v11";
const SHELL = ["./", "index.html", "manifest.json", "firebase-config.js", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {}))))); self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const u = new URL(e.request.url);
  if (!(u.origin === location.origin || u.hostname === "www.gstatic.com")) return;
  // The page itself: always try the network first, so updates show up on the next open.
  if (e.request.mode === "navigate") {
    e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put("index.html", c)); return r; }).catch(() => caches.match("index.html")));
    return;
  }
  // Everything else: cached copy first, refreshed in the background.
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(e.request, {ignoreSearch: true});
    const net = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r }).catch(() => hit);
    return hit || net;
  }));
});

// Push notifications (sent by the scheduled reminder job through Firebase Cloud Messaging).
self.addEventListener("push", e => {
  let p = {};
  try { p = e.data ? e.data.json() : {}; } catch (x) { try { p = { data: { body: e.data.text() } }; } catch (y) {} }
  const d = p.data || {}, n = p.notification || {};
  const title = d.title || n.title || "\u{1F944} Spoon Tasks";
  e.waitUntil(self.registration.showNotification(title, {
    body: d.body || n.body || "",
    tag: d.tag || undefined,
    icon: "icon-192.png",
    badge: "icon-192.png"
  }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    for (const c of list) { if ("focus" in c) return c.focus(); }
    return clients.openWindow("./");
  }));
});
