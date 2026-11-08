import { describe, expect, it } from 'vitest';
import { cacheName, isStaleCache, precacheList, strategyFor } from './serviceWorkerPolicy.ts';

const origin = 'https://njs50.github.io';
const base = '/scoreme';
const immutable = new Set(['/scoreme/_app/immutable/entry/start.abc.js', '/scoreme/favicon.png']);
const get = (path: string, method = 'GET') => ({ method, url: `${origin}${path}` });

describe('cache names', () => {
	it('include the base path and build version', () => {
		expect(cacheName(base, '123')).toBe('scoreme:/scoreme:123');
	});

	it('only treat older caches for the same base path as stale', () => {
		expect(isStaleCache('scoreme:/scoreme:100', base, '123')).toBe(true);
		expect(isStaleCache('scoreme:/scoreme:123', base, '123')).toBe(false);
		expect(isStaleCache('scoreme:/scoreme-preview:100', base, '123')).toBe(false);
		expect(isStaleCache('tfecat-assets-v1', base, '123')).toBe(false);
	});
});

describe('precacheList', () => {
	it('skips dotfiles and version.json', () => {
		expect(
			precacheList([
				'/scoreme/_app/immutable/entry/start.abc.js',
				'/scoreme/.nojekyll',
				'/scoreme/version.json',
				'/scoreme/icons/icon-192.png',
				'/scoreme/'
			])
		).toEqual([
			'/scoreme/_app/immutable/entry/start.abc.js',
			'/scoreme/icons/icon-192.png',
			'/scoreme/'
		]);
	});
});

describe('strategyFor', () => {
	it('serves build output and static files from the cache', () => {
		expect(strategyFor(get('/scoreme/favicon.png'), origin, base, immutable)).toBe('cache-first');
	});

	it('goes to the network first for pages and anything else in scope', () => {
		expect(strategyFor(get('/scoreme/'), origin, base, immutable)).toBe('network-first');
		expect(strategyFor(get('/scoreme'), origin, base, immutable)).toBe('network-first');
		expect(strategyFor(get('/scoreme/manifest.webmanifest'), origin, base, immutable)).toBe(
			'network-first'
		);
	});

	it('never answers version.json from a cache', () => {
		expect(strategyFor(get('/scoreme/version.json'), origin, base, immutable)).toBeNull();
	});

	it('leaves other sites on the same origin alone', () => {
		expect(strategyFor(get('/scoreme-preview/'), origin, base, immutable)).toBeNull();
		expect(strategyFor(get('/tfecat/'), origin, base, immutable)).toBeNull();
	});

	it('ignores other origins and non-GET requests', () => {
		expect(
			strategyFor({ method: 'GET', url: 'https://example.com/scoreme/' }, origin, base, immutable)
		).toBeNull();
		expect(strategyFor(get('/scoreme/', 'POST'), origin, base, immutable)).toBeNull();
	});

	it('handles an app served from the root (dev server)', () => {
		expect(strategyFor(get('/'), origin, '', new Set())).toBe('network-first');
		expect(strategyFor(get('/version.json'), origin, '', new Set())).toBeNull();
	});
});
