importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

import { staticResourceCache } from 'workbox-recipes';

if (workbox) {
	console.log('[workbox] loaded successfully');
} else {
	console.log('[workbox] failed to load');
}

