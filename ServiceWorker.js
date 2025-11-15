// Update this version when you deploy new game builds
const CACHE_VERSION = '1.1.3'; // Change this each time you update!
const cacheName = `Andrew Dowsett-Carrot Commotion-${CACHE_VERSION}`;
const contentToCache = [];

self.addEventListener('install', function (e) {
    console.log('[Service Worker] Install');
    
    e.waitUntil((async function () {
      const cache = await caches.open(cacheName);
      console.log('[Service Worker] Caching only template files');
      await cache.addAll(contentToCache);
      self.skipWaiting();
    })());
});

self.addEventListener('activate', function(e) {
    console.log('[Service Worker] Activate');
    e.waitUntil((async function() {
        // Clean up old caches
        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames.map((name) => {
                if (name !== cacheName) {
                    console.log('[Service Worker] Deleting old cache:', name);
                    return caches.delete(name);
                }
            })
        );
        self.clients.claim();
    })());
});

self.addEventListener('fetch', function (e) {
    // Don't cache Unity WebGL files - always fetch fresh
    if (e.request.url.includes('Build/') || 
        e.request.url.includes('.wasm') || 
        e.request.url.includes('.data') || 
        e.request.url.includes('.js') ||
        e.request.url.includes('.mem') ||
        e.request.url.includes('.symbols.json')) {
        
        console.log(`[Service Worker] Bypassing cache for Unity file: ${e.request.url}`);
        e.respondWith(fetch(e.request));
        return;
    }
    
    // Cache other files normally
    e.respondWith((async function () {
      let response = await caches.match(e.request);
      console.log(`[Service Worker] Fetching resource: ${e.request.url}`);
      if (response) { return response; }

      response = await fetch(e.request);
      const cache = await caches.open(cacheName);
      console.log(`[Service Worker] Caching new resource: ${e.request.url}`);
      cache.put(e.request, response.clone());
      return response;
    })());
});
