import { version } from '$app/env';
import { assets, immutable, prerendered } from '$app/manifest';
import { asset, resolve } from '$app/paths';
import { self } from '$app/service-worker';
import { cacheName, isStaleCache, precacheList, strategyFor } from '../lib/serviceWorkerPolicy.ts';

// The scope is the app's base path ("/scoreme/" or "/scoreme-preview/"), without the slash.
const base = new URL(self.registration.scope).pathname.replace(/\/$/, '');

const CACHE = cacheName(base, version);
const IMMUTABLE = new Set(
	precacheList([
		...immutable.map(({ path }) => resolve(path as Parameters<typeof resolve>[0])),
		...assets.map(({ path }) => asset(path))
	])
);
const PRECACHE = [...IMMUTABLE, ...precacheList(prerendered.map(({ path }) => resolve(path)))];

self.addEventListener('install', (event) => {
	event.waitUntil(
		(async () => {
			const cache = await caches.open(CACHE);
			await cache.addAll(PRECACHE);
			// Take over straight away. The open page keeps running its current code,
			// so nothing reloads (and no scores are lost) mid-game.
			await self.skipWaiting();
		})()
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			for (const key of await caches.keys()) {
				if (isStaleCache(key, base, version)) await caches.delete(key);
			}
			await self.clients.claim();
		})()
	);
});

self.addEventListener('fetch', (event) => {
	const strategy = strategyFor(event.request, self.location.origin, base, IMMUTABLE);
	if (!strategy) return;
	event.respondWith(
		strategy === 'cache-first' ? cacheFirst(event.request) : networkFirst(event.request)
	);
});

// Precached requests carry no Origin header but module imports do, so `Vary: Origin`
// (sent by some servers) would otherwise make every cached script miss.
const MATCH = { cacheName: CACHE, ignoreVary: true };

async function cacheFirst(request: Request): Promise<Response> {
	const cached = await caches.match(request, MATCH);
	if (cached) return cached;
	return fetchAndCache(request);
}

async function networkFirst(request: Request): Promise<Response> {
	try {
		return await fetchAndCache(request);
	} catch (error) {
		const cached = await caches.match(request, MATCH);
		if (cached) return cached;
		throw error;
	}
}

async function fetchAndCache(request: Request): Promise<Response> {
	const response = await fetch(request);
	if (response.ok && response.type === 'basic') {
		const cache = await caches.open(CACHE);
		await cache.put(request, response.clone());
	}
	return response;
}
