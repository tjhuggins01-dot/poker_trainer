const VIRTUAL_MODULE_ID = 'virtual:pwa-register';
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;

export function VitePWA(options = {}) {
  const includeAssets = options.includeAssets ?? [];
  const manifest = options.manifest ?? {};

  return {
    name: 'vite-plugin-pwa-local',
    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) return RESOLVED_VIRTUAL_MODULE_ID;
      return null;
    },
    load(id) {
      if (id !== RESOLVED_VIRTUAL_MODULE_ID) return null;
      return `
export const registerSW = (options = {}) => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return () => {};
  const register = () => navigator.serviceWorker.register('/sw.js');
  if (options?.immediate) {
    register();
  } else {
    window.addEventListener('load', register, { once: true });
  }
  return () => {};
};
`;
    },
    generateBundle(_, bundle) {
      const files = Object.keys(bundle)
        .filter((name) => !name.endsWith('.map'))
        .map((name) => `/${name}`);

      const manifestAssets = [
        ...includeAssets.map((asset) => `/${asset}`),
        ...((manifest.icons ?? []).map((icon) => icon.src) || []),
      ];

      const precache = Array.from(new Set(['/', '/index.html', '/manifest.webmanifest', ...files, ...manifestAssets]));

      const swCode = `
const CACHE_NAME = 'preflop-range-drill-cache-v1';
const PRECACHE_URLS = ${JSON.stringify(precache)};

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match('/index.html'));
    })
  );
});
`;

      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: swCode,
      });

      this.emitFile({
        type: 'asset',
        fileName: 'manifest.webmanifest',
        source: JSON.stringify(manifest, null, 2),
      });
    },
  };
}
