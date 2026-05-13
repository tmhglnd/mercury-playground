/*importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

if (workbox) {
	console.log('[workbox] loaded successfully');
	
	workbox.core.skipWaiting();
	
	workbox.precaching.precacheAndRoute([
		{ url: '/' },
		{ url: 'index.html' },
		{ url: 'bundle.js' },
		{ url: 'style.css' },
		{ url: 'manifest.json' },
	]);
	
	workbox.routing.registerRoute(({ url }) => url.origin === self.location.origin, 
		new workbox.strategies.StaleWhileRevalidate({
			cacheName: 'mercury-cache',
			plugins : [
				new workbox.expiration.ExpirationPlugin({
					maxAgeSeconds: 7 * 24 * 60 * 60,
				})
			]
		})
	);
} else {
	console.log('[workbox] failed to load');
}

self.addEventListener('activate', (event) => {
	const currentCaches = [
		workbox.core.cacheNames.precache,
		'mercury-cache'
	];

	event.waitUntil(
		caches.keys().then(cacheNames => {
			return Promise.all(
				cacheNames.map(cacheName => {
					if (!currentCaches.includes(cacheName)){
						return caches.delete(cacheName);
					}
				})
			);
		})
	);
});
*/

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
			return cache.match(event.request).then(response => {
				// return the matched cache but fetch an update for next time
				const fetchPromise = fetch(event.request)
					.then(networkResponse => {
						cache.put(event.request, networkResponse.clone());
						return networkResponse;
					});
				return response || fetchPromise;
			});
		})
	);
});

// .then(cachedResponse => {
// 	return cachedResponse || fetch(event.request)
// 		.then(response => {
// 			// otherwise fetch the file from the network 
// 			// and put in cache
// 			cache.put(event.request, response.clone());
// 			return response;
// 		});
// })