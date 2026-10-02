const CACHE = 'uot-v1';
const ASSETS = [
  '/', '/index.html',
  '/pages/login.html', '/pages/dashboard.html', '/pages/calendar.html',
  '/pages/reports.html', '/pages/employees.html',
  '/css/variables.css', '/css/global.css', '/css/mobile.css',
  '/css/components.css', '/css/calendar.css',
  '/js/app.js', '/js/supabase.js', '/js/auth.js', '/js/attendance.js',
  '/js/calculator.js', '/js/geolocation.js', '/js/calendar.js',
  '/js/reports.js', '/js/settings.js',
  '/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => cached)
    )
  );
});
