// Update this version when you deploy new game builds
const CACHE_VERSION = '0.4.7'; // Change this each time you update!
const cacheName = `Andrew Dowsett-Carrot Commotion-${CACHE_VERSION}`;
const contentToCache = [];

self.addEventListener('install', function (e) {
    console.log('[Service Worker] Install');
    
    e.waitUntil((async function () {
      const cache = await caches.open(cacheName);
      console.log('[Service Worker] Caching all: app shell and content');
      await cache.addAll(contentToCache);
      
      // Skip waiting to activate immediately
      self.skipWaiting();
    })());
});

self.addEventListener('fetch', function (e) {
    // Don't cache Unity WebGL files - always fetch fresh from network
    if (e.request.url.includes('.wasm') || 
        e.request.url.includes('.data') || 
        e.request.url.includes('.js') ||
        e.request.url.includes('.mem') ||
        e.request.url.includes('Build/') ||
        e.request.url.includes('.symbols.json')) {
        
        console.log(`[Service Worker] Bypassing cache for Unity file: ${e.request.url}`);
        e.respondWith(fetch(e.request));
        return;
    }
    
    // Handle other requests with caching
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

// Clean up old caches when service worker activates
self.addEventListener('activate', function(e) {
    console.log('[Service Worker] Activate');
    e.waitUntil((async function() {
        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames.map((name) => {
                if (name !== cacheName) {
                    console.log('[Service Worker] Deleting old cache:', name);
                    return caches.delete(name);
                }
            })
        );
        
        // Take control of all clients immediately
        self.clients.claim();
    })());
});