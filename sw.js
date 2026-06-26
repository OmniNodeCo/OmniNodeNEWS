const CACHE_NAME = 'omninode-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/css/variables.css',
    '/css/base.css',
    '/css/layout.css',
    '/css/components.css',
    '/css/sections.css',
    '/css/modal.css',
    '/css/command-palette.css',
    '/css/heatmap.css',
    '/css/contributors.css',
    '/css/status.css',
    '/css/responsive.css',
    '/js/utils.js',
    '/js/api.js',
    '/js/theme.js',
    '/js/navigation.js',
    '/js/terminal.js',
    '/js/profile.js',
    '/js/repos.js',
    '/js/releases.js',
    '/js/activity.js',
    '/js/heatmap.js',
    '/js/contributors.js',
    '/js/readme-modal.js',
    '/js/command-palette.js',
    '/js/settings.js',
    '/js/ticker.js',
    '/js/pwa.js',
    '/js/app.js',
];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    // Network-first for API, cache-first for assets
    if (e.request.url.includes('api.github.com')) {
        e.respondWith(
            fetch(e.request)
                .then(res => {
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
                    return res;
                })
                .catch(() => caches.match(e.request))
        );
    } else {
        e.respondWith(
            caches.match(e.request).then(cached => cached || fetch(e.request))
        );
    }
});