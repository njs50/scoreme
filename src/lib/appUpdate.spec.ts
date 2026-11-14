import { describe, expect, it, vi } from 'vitest';
import {
	readServedSha,
	reloadPage,
	requestServiceWorkerUpdate,
	updateAvailable
} from './appUpdate.ts';

function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' }
	});
}

describe('updateAvailable', () => {
	it('is true only when the served commit differs from this build', () => {
		expect(updateAvailable('abc', 'def')).toBe(true);
		expect(updateAvailable('abc', 'abc')).toBe(false);
		expect(updateAvailable('', 'def')).toBe(false);
		expect(updateAvailable('dev', 'def')).toBe(false);
		expect(updateAvailable('abc', null)).toBe(false);
	});
});

describe('readServedSha', () => {
	it('returns the sha from version.json', async () => {
		const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ sha: 'abc', builtAt: 't' }));
		await expect(readServedSha(fetchImpl, 'version.json')).resolves.toBe('abc');
		expect(fetchImpl).toHaveBeenCalledWith('version.json', { cache: 'no-store' });
	});

	it('returns null when the check cannot be trusted', async () => {
		await expect(
			readServedSha(vi.fn().mockResolvedValue(jsonResponse({ sha: 'abc' }, 404)), 'version.json')
		).resolves.toBeNull();
		await expect(
			readServedSha(vi.fn().mockResolvedValue(jsonResponse('abc')), 'version.json')
		).resolves.toBeNull();
		await expect(
			readServedSha(vi.fn().mockResolvedValue(jsonResponse(null)), 'version.json')
		).resolves.toBeNull();
		await expect(
			readServedSha(vi.fn().mockResolvedValue(jsonResponse({})), 'version.json')
		).resolves.toBeNull();
		await expect(
			readServedSha(vi.fn().mockResolvedValue(jsonResponse({ sha: 1 })), 'version.json')
		).resolves.toBeNull();
		await expect(
			readServedSha(vi.fn().mockResolvedValue(jsonResponse({ sha: '' })), 'version.json')
		).resolves.toBeNull();
		await expect(
			readServedSha(
				vi.fn().mockResolvedValue({ ok: true, json: () => Promise.reject(new Error('bad')) }),
				'version.json'
			)
		).resolves.toBeNull();
		await expect(
			readServedSha(vi.fn().mockRejectedValue(new Error('offline')), 'version.json')
		).resolves.toBeNull();
	});
});

describe('requestServiceWorkerUpdate', () => {
	it('does nothing without a service worker', async () => {
		await expect(requestServiceWorkerUpdate(null)).resolves.toBeUndefined();
	});

	it('asks the registration to check for a new script', async () => {
		const update = vi.fn().mockResolvedValue(undefined);
		const serviceWorker = { getRegistration: vi.fn().mockResolvedValue({ update }) };
		await requestServiceWorkerUpdate(serviceWorker);
		expect(update).toHaveBeenCalledOnce();
	});

	it('does nothing when the page has no registration yet', async () => {
		const serviceWorker = { getRegistration: vi.fn().mockResolvedValue(undefined) };
		await expect(requestServiceWorkerUpdate(serviceWorker)).resolves.toBeUndefined();
	});

	it('swallows a failed check', async () => {
		await expect(
			requestServiceWorkerUpdate({ getRegistration: vi.fn().mockRejectedValue(new Error('no')) })
		).resolves.toBeUndefined();
		const update = vi.fn().mockRejectedValue(new Error('no'));
		await expect(
			requestServiceWorkerUpdate({ getRegistration: vi.fn().mockResolvedValue({ update }) })
		).resolves.toBeUndefined();
	});
});

describe('reloadPage', () => {
	it('reloads the current page', () => {
		const reload = vi.fn();
		vi.stubGlobal('location', { reload });
		reloadPage();
		expect(reload).toHaveBeenCalledOnce();
		vi.unstubAllGlobals();
	});
});
