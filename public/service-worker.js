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
	'style.css',
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

self.addEventListener('fetch', (event) => {
	// intercept the fetch event to check if file is cached
	event.respondWith(
		caches.open('cache-mercury').then(cache => {
			// if file matches cache return the cached response
			return cache.match(event.request)
				.then(cachedResponse => {
					return cachedResponse || fetch(event.request)
						.then(response => {
							// otherwise fetch the file from the network 
							// and put in cache
							cache.put(event.request, response.clone());
							return response;
						});
				})
		})
	);
});


// self.addEventListener('activate', (event) => {
// });