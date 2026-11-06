import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { webManifest } from './webManifest.ts';

describe('webManifest', () => {
	it('describes an installable standalone app', () => {
		const manifest = webManifest({ preview: false });
		expect(manifest).toMatchObject({
			name: 'scoreme',
			short_name: 'scoreme',
			display: 'standalone',
			start_url: './',
			scope: './'
		});
	});

	it('names preview builds differently so both can be installed', () => {
		const preview = webManifest({ preview: true });
		expect(preview.name).toBe('scoreme (preview)');
		expect(preview.short_name).not.toBe(webManifest({ preview: false }).short_name);
	});

	it('uses relative URLs so it works under any base path', () => {
		const { start_url, scope, id, icons } = webManifest({ preview: false });
		for (const url of [start_url, scope, id, ...icons.map((icon) => icon.src)]) {
			expect(url).not.toMatch(/^\//);
		}
	});

	it('lists 192px and 512px icons for both purposes, all present in static/', () => {
		const { icons } = webManifest({ preview: false });
		for (const purpose of ['any', 'maskable']) {
			const sizes = icons.filter((icon) => icon.purpose === purpose).map((icon) => icon.sizes);
			expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512']));
		}
		for (const { src } of icons) {
			expect(existsSync(new URL(`../static/${src}`, import.meta.url)), src).toBe(true);
		}
	});
});
