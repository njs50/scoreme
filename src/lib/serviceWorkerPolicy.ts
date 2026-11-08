export type Strategy = 'cache-first' | 'network-first';

/**
 * Cache Storage is shared by every project site on njs50.github.io (tfecat,
 * scoreme, scoreme-preview…), so names carry the base path and cleanup only
 * ever touches this app's own caches.
 */
export function cacheName(base: string, version: string): string {
	return `scoreme:${base}:${version}`;
}

export function isStaleCache(key: string, base: string, version: string): boolean {
	return key.startsWith(`scoreme:${base}:`) && key !== cacheName(base, version);
}

/**
 * What to download when the worker installs. Dotfiles (.nojekyll) aren't served
 * by GitHub Pages and would fail the whole install; version.json must never be
 * answered from a cache.
 */
export function precacheList(paths: readonly string[]): string[] {
	return paths.filter((path) => !/\/\.[^/]*$/.test(path) && !path.endsWith('/version.json'));
}

/**
 * How the worker answers a request, or null to leave it to the browser.
 * Hashed build output and static files never change at a URL, so they come
 * from the cache. Pages go to the network first so a new deploy shows up
 * straight away, with the cached copy as the offline fallback.
 */
export function strategyFor(
	request: { method: string; url: string },
	origin: string,
	base: string,
	immutable: ReadonlySet<string>
): Strategy | null {
	if (request.method !== 'GET') return null;
	const url = new URL(request.url);
	if (url.origin !== origin) return null;
	if (url.pathname !== base && !url.pathname.startsWith(`${base}/`)) return null;
	if (url.pathname === `${base}/version.json`) return null;
	return immutable.has(url.pathname) ? 'cache-first' : 'network-first';
}
