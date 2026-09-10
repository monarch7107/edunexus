/* EduNexus PWA — cache only the public shell. Never cache /api or private data. */
const CACHE = "edunexus-shell-v2";
const SHELL = ["/", "/login", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

function isSafeToCache(url) {
  if (url.pathname.startsWith("/api/")) return false;
  if (url.pathname.startsWith("/dashboard")) return false;
  if (url.pathname.startsWith("/academics")) return false;
  if (url.pathname.startsWith("/planner")) return false;
  if (url.pathname.startsWith("/learning")) return false;
  if (url.pathname.startsWith("/insights")) return false;
  if (url.pathname.startsWith("/profile")) return false;
  if (url.pathname.startsWith("/onboarding")) return false;
  return (
    url.pathname === "/" ||
    url.pathname === "/login" ||
    url.pathname === "/register" ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/icon.svg" ||
    url.pathname.startsWith("/_next/static/")
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.pathname.startsWith("/api/")) return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && url.origin === self.location.origin && isSafeToCache(url)) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match("/"))),
  );
});
