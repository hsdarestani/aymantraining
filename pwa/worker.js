/* BD_RELEASE is prepended by the versioned /sw.js handler. */
const STATIC = "bd-static-v3:" + BD_RELEASE;
const MEDIA = "bd-exercise-media-v2";
const OFFLINE = "/offline.html";

self.addEventListener("install", event => event.waitUntil((async () => {
  const cache = await caches.open(STATIC);
  await cache.add(new Request(OFFLINE, { cache: "reload" }));
  await self.skipWaiting();
})()));

self.addEventListener("activate", event => event.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter(key => key.startsWith("bd-static-") && key !== STATIC).map(key => caches.delete(key)));
  await self.clients.claim();
})()));

function publicExercise(url) {
  return url.origin === self.location.origin && /^\/api\/media\/[^/]+$/.test(url.pathname) && url.pathname !== "/api/media/preload";
}

function cacheableMedia(response) {
  return response.status === 200 && response.headers.get("x-bd-exercise-media") === "1" &&
    /\bpublic\b/i.test(response.headers.get("cache-control") || "");
}

async function fetchExercise(request) {
  const cache = await caches.open(MEDIA);
  let response;
  try {
    response = await fetch(request);
  } catch {
    const hit = await cache.match(request);
    return hit && cacheableMedia(hit) ? hit : Response.error();
  }
  if (cacheableMedia(response)) {
    await cache.put(request, response.clone()).catch(() => {});
  } else if (response.ok || [401, 403, 404, 410].includes(response.status)) {
    // A previously public exercise can be moved into a protected chapter.
    await cache.delete(request).catch(() => {});
  }
  return response;
}

self.addEventListener("message", event => {
  const data = event.data;
  if (data?.type !== "PRELOAD_MEDIA" || !Array.isArray(data.urls)) return;
  event.waitUntil((async () => {
    for (const value of data.urls.slice(0, 100)) {
      if (typeof value !== "string") continue;
      try {
        const url = new URL(value, self.location.origin);
        if (publicExercise(url)) await fetchExercise(new Request(url, { credentials: "omit" }));
      } catch {}
    }
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    // Keep signed-in HTML, RSC payloads and private API responses out of Cache Storage.
    event.respondWith(fetch(request).catch(async () => (await caches.match(OFFLINE, { cacheName: STATIC })) || Response.error()));
    return;
  }
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith((async () => {
      const cache = await caches.open(STATIC);
      const hit = await cache.match(request);
      if (hit) return hit;
      const response = await fetch(request);
      if (response.ok && /\bimmutable\b/i.test(response.headers.get("cache-control") || "")) {
        await cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    })());
    return;
  }
  if (publicExercise(url) && !request.headers.has("range")) event.respondWith(fetchExercise(request));
});
