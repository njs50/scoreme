import { page } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import AppUpdate from './AppUpdate.svelte';

function jsonResponse(body: unknown): Response {
	return new Response(JSON.stringify(body), {
		status: 200,
		headers: { 'Content-Type': 'application/json' }
	});
}

describe('AppUpdate', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('stays hidden when this build is current', async () => {
		const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ sha: 'abc' }));
		await render(AppUpdate, {
			props: {
				runningSha: 'abc',
				fetchImpl,
				serviceWorker: null
			}
		});

		await expect.poll(() => fetchImpl.mock.calls.length).toBeGreaterThan(0);
		await new Promise((resolve) => setTimeout(resolve, 30));
		expect(document.querySelector('.update')).toBeNull();
	});

	it('offers a reload when a newer build is published', async () => {
		const reload = vi.fn();
		const update = vi.fn().mockResolvedValue(undefined);
		await render(AppUpdate, {
			props: {
				runningSha: 'older',
				fetchImpl: vi.fn().mockResolvedValue(jsonResponse({ sha: 'newer', builtAt: 't' })),
				reload,
				serviceWorker: { getRegistration: vi.fn().mockResolvedValue({ update }) }
			}
		});

		await page.getByRole('button', { name: 'Click here to update' }).click();
		expect(reload).toHaveBeenCalledOnce();
		expect(update).toHaveBeenCalled();
	});

	it('checks again when the page is shown and on a timer, then stops', async () => {
		const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ sha: 'abc' }));
		const view = await render(AppUpdate, {
			props: {
				runningSha: 'abc',
				fetchImpl,
				intervalMs: 30,
				serviceWorker: null
			}
		});

		await expect.poll(() => fetchImpl.mock.calls.length).toBeGreaterThan(0);
		document.dispatchEvent(new Event('visibilitychange'));
		await expect.poll(() => fetchImpl.mock.calls.length).toBeGreaterThan(1);
		await expect.poll(() => fetchImpl.mock.calls.length).toBeGreaterThan(2);

		const calls = fetchImpl.mock.calls.length;
		view.unmount();
		await new Promise((resolve) => setTimeout(resolve, 80));
		expect(fetchImpl.mock.calls.length).toBe(calls);
	});
});
