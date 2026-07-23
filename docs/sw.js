const CACHE_NAME = 'leet-dashboard-v5';
const ASSETS = [
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (e) => {
  self.skipWaiting(); // Force the waiting service worker to become the active service worker
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      return self.clients.claim(); // Instantly take control of all open clients
    })
  );
});

self.addEventListener('fetch', (e) => {
  // Only handle http/https requests — skip chrome-extension://, data:, etc.
  if (!e.request.url.startsWith('http')) {
    return;
  }

  // Skip cross-origin requests (e.g. external badge/counter services)
  // Let the browser handle them directly without SW interference
  try {
    const requestUrl = new URL(e.request.url);
    if (requestUrl.origin !== self.location.origin) {
      return;
    }
  } catch {
    return;
  }

  // Let api requests bypass SW cache to prevent stale grading or note data
  if (e.request.url.includes('/api/')) {
    return;
  }
  
  // HTML document & JSON data check: Always Network-First to guarantee fresh data & categories
  const isDynamicContent = e.request.mode === 'navigate' || 
                           e.request.url.endsWith('/') || 
                           e.request.url.includes('/index.html') ||
                           e.request.url.includes('.json');

  if (isDynamicContent) {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          const responseCopy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseCopy);
          });
          return response;
        })
        .catch(() => {
          return caches.match(e.request);
        })
    );
    return;
  }

  // Assets (JS, CSS, Images, Fonts) use Cache-First, dynamically caching new assets
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseCopy = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseCopy);
        });
        return response;
      }).catch(() => {
        // Silent catch
      });
    })
  );
});
