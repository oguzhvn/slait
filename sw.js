// Offline support: the app shell and the bundled libraries are cached; AI requests always go to the network.
// Bump CACHE when vendor/ changes so clients drop the old copies.
var CACHE = 'slaity-v2';
var SHELL = ['./', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png',
  './vendor/pdfjs/pdf.min.js', './vendor/pdfjs/pdf.worker.min.js',
  './vendor/katex/katex.min.css', './vendor/katex/katex.min.js', './vendor/katex/contrib/auto-render.min.js'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request, url = req.url;
  if (req.method !== 'GET') return;
  if (url.indexOf(self.registration.scope) !== 0) return;
  // The page itself: network first so updates arrive, cache when offline.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(function (r) {
      var copy = r.clone(); caches.open(CACHE).then(function (c) { c.put('./', copy); }); return r;
    }).catch(function () { return caches.match('./'); }));
    return;
  }
  // Everything else (icons, vendor libraries, KaTeX fonts): cache first, filled on first use.
  e.respondWith(caches.match(req, { ignoreVary: true }).then(function (hit) {
    return hit || fetch(req).then(function (r) {
      if (r.ok || r.type === 'opaque') { var copy = r.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      return r;
    });
  }));
});
