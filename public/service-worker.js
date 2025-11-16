importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

if (workbox) {
	console.log('[workbox] loaded successfully');
} else {
	console.log('[workbox] failed to load');
}

// import { registerRoute } from 'workbox-routing';
// import { CacheFirst } from 'workbox-strategies';
// import { CacheableResponsePlugin } from 'workbox-cacheable-response'
// import { RangeRequestsPlugin } from 'workbox-range-requests'

workbox.routing.registerRoute(
  ({ request }) => request.destination === 'audio',
  new workbox.strategies.CacheFirst({
    cacheName: 'audio-cache',
  }),
);

// workbox.core.skipWaiting();
// workbox.core.clientsClaim();

