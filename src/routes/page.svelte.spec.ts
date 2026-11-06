import { createRawSnippet } from 'svelte';
import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Layout from './+layout.svelte';
import Page from './+page.svelte';

describe('+page.svelte', () => {
	it('renders the scorecard', async () => {
		await render(Page);

		await expect.element(page.getByRole('button', { name: 'Add player' })).toBeVisible();
		expect(document.title).toBe('Score');
	});
});

describe('+layout.svelte', () => {
	it('renders the page inside <main> with the preview watermark', async () => {
		const children = createRawSnippet(() => ({ render: () => '<p>page content</p>' }));
		const { container } = await render(Layout, { props: { children } as never });

		await expect.element(page.getByRole('main')).toHaveTextContent('page content');
		// The client test project defines __PREVIEW_REF__ / __PREVIEW_SHA__ like a preview build.
		expect(container.querySelector('.preview-watermark')?.textContent).toBe(
			'test-branch · abcdef1'
		);
	});
});
