// importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');
// import { staticResourceCache } from 'workbox-recipes';
// if (workbox) {
// 	console.log('[workbox] loaded successfully');
// } else {
// 	console.log('[workbox] failed to load');
// }

const cacheName = 'cache-mercury';
const precacheResources = [
	'/',
	'index.html',
	'bundle.js',
	'style.css'
]

self.addEventListener('install', (event) => {
	console.log('[serviceworker] install');
	event.waitUntil(
		caches.open(cacheName)
		.then(cache => {
			return cache.addAll(precacheResources);
		})
	)
});

// self.addEventListener('activate', (event) => {

// });

self.addEventListener('fetch', (event) => {
	// event.request.url
	event.respondWith(
		caches.match(event.request)
		.then(cachedResponse => {
			return cachedResponse || fetch(event.request)
		})
	);
});

