export type ServiceWorkerUpdateTarget = {
	getRegistration: () => Promise<{ update: () => Promise<unknown> } | undefined>;
};

/**
 * A deploy is ready when version.json names a different commit than the one
 * this page was built from. Dev builds and a failed check stay quiet.
 */
export function updateAvailable(runningSha: string, servedSha: string | null): boolean {
	if (runningSha === '' || runningSha === 'dev' || servedSha === null || servedSha === runningSha) {
		return false;
	}
	return true;
}

/** version.json is never cached. A failure (offline, 404) means "no news". */
export async function readServedSha(fetchImpl: typeof fetch, url: string): Promise<string | null> {
	try {
		const response = await fetchImpl(url, { cache: 'no-store' });
		if (!response.ok) return null;
		const body: unknown = await response.json();
		if (typeof body !== 'object' || body === null || !('sha' in body)) return null;
		const sha = body.sha;
		return typeof sha === 'string' && sha !== '' ? sha : null;
	} catch {
		return null;
	}
}

/**
 * Ask the browser to fetch the service worker script. Browsers otherwise wait
 * for the next navigation, which is the close-and-reopen this avoids.
 */
export async function requestServiceWorkerUpdate(
	serviceWorker: ServiceWorkerUpdateTarget | null
): Promise<void> {
	if (!serviceWorker) return;
	try {
		const registration = await serviceWorker.getRegistration();
		if (!registration) return;
		await registration.update();
	} catch {
		// The running copy stays until the next check.
	}
}

export function reloadPage(): void {
	location.reload();
}
