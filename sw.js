/* Team N!TRO service worker: lets the site be installed as an app and open
   without a connection. Pages always come from the network first so new
   content shows straight away; fonts, scripts and images are reused from
   the device once downloaded and refreshed in the background. */
var CACHE = "nitro-v1";
var SHELL = ["/", "/sponsor", "/catalyst", "/favicon.svg", "/logo-192.png", "/logo-team-nitro.webp",
  "/logo-team-nitro-lg.webp", "/fonts/archivo-latin.woff2", "/fonts/jetbrains-mono-latin.woff2", "/js/lenis-1.3.4.min.js"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function save(req, res) {
  if (res.ok && res.type === "basic") { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
  return res;
}

self.addEventListener("fetch", function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin || url.pathname.indexOf("/_vercel/") === 0) return;
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(function (res) { return save(req, res); }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (hit) { return hit || caches.match("/"); });
    }));
    return;
  }
  // reuse the saved copy at once, and refresh it in the background
  e.respondWith(caches.match(req).then(function (hit) {
    var fresh = fetch(req).then(function (res) { return save(req, res); });
    if (hit) { e.waitUntil(fresh.catch(function () {})); return hit; }
    return fresh;
  }));
});
