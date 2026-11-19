// Service worker di Flowdesk.
// 1) Senza rete: le pagine già aperte si rivedono dall'ultima copia salvata; le altre mostrano /offline.html.
//    I file statici dell'app (JS, CSS, icone) restano in memoria e si caricano subito.
// 2) Notifiche push: le mostra, aggiorna il numero sull'icona e al tocco apre la pagina giusta.
// Cambiando questo file, aumentare VERSION: i vecchi archivi vengono cancellati.
const VERSION = "v1";
const STATIC_CACHE = `flowdesk-static-${VERSION}`;
const PAGES_CACHE = `flowdesk-pages-${VERSION}`;
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll([OFFLINE_URL, "/icon-192.png"])).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => ![STATIC_CACHE, PAGES_CACHE].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return; // azioni e salvataggi: sempre in rete
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // File statici con nome versionato: prima la memoria, poi la rete.
  if (url.pathname.startsWith("/_next/static/") || /\.(png|svg|ico|webmanifest)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          })
      )
    );
    return;
  }

  // Pagine: prima la rete (dati sempre aggiornati); senza rete l'ultima copia o la pagina "offline".
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && response.type === "basic" && !response.redirected) {
            const copy = response.clone();
            caches.open(PAGES_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request).then((hit) => hit || caches.match(OFFLINE_URL)))
    );
  }
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Flowdesk";
  const jobs = [
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: data.tag,
      data: { url: data.url || "/home" },
    }),
  ];
  // Numero sull'icona dell'app (daily ancora da fare oggi).
  if (typeof data.badge === "number" && "setAppBadge" in navigator) {
    jobs.push(data.badge > 0 ? navigator.setAppBadge(data.badge) : navigator.clearAppBadge());
  }
  event.waitUntil(Promise.all(jobs).catch(() => {}));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/home", self.location.origin).toString();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if ("focus" in client) {
          client.navigate(target).catch(() => {});
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
