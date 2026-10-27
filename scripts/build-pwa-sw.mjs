// Produce a versioned offline app-shell cache after Vite has emitted hashed
// JavaScript and CSS. API requests, live audio, and personal data are excluded.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const dist = path.resolve('dist');
const assets = path.join(dist, 'assets');
const appShell = ['/', '/index.html', '/manifest.webmanifest', '/pwa-icon-192.png', '/pwa-icon-512.png', '/apple-touch-icon.png'];
function walk(directory, base = 'assets') {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory()
      ? walk(path.join(directory, entry.name), base + '/' + entry.name)
      : /\.(?:js|css)$/.test(entry.name) ? ['/' + base + '/' + entry.name] : []
  );
}
const precache = [...new Set([...appShell, ...walk(assets)])].sort();
const version = crypto.createHash('sha256').update(precache.join('\n')).digest('hex').slice(0, 12);
const script = `/* JOE Tutor: offline static shell only. Voice conversations require Internet. */
const CACHE = 'joe-tutor-shell-${version}';
const SHELL = ${JSON.stringify(precache)};
const ALLOWED = new Set(SHELL);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('joe-tutor-shell-') && name !== CACHE).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/') || request.headers.has('range')) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(async () =>
      (await caches.match('/index.html')) || Response.error()
    ));
    return;
  }
  if (!ALLOWED.has(url.pathname)) return;
  event.respondWith(caches.match(request).then(hit => hit || fetch(request)));
});
`;
fs.writeFileSync(path.join(dist, 'sw.js'), script);
console.log('Generated offline app shell service worker with', precache.length, 'static assets.');
