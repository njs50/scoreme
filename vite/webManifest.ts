export const THEME_COLOUR = '#2e7d4f';

/**
 * The web app manifest, written into the build next to index.html. URLs are
 * relative to the manifest, so the same file works under /scoreme/ and
 * /scoreme-preview/, and the two install as separate apps.
 */
export function webManifest({ preview }: { preview: boolean }) {
	return {
		id: './',
		name: preview ? 'scoreme (preview)' : 'scoreme',
		short_name: preview ? 'scoreme β' : 'scoreme',
		description: 'Score card for gin',
		start_url: './',
		scope: './',
		display: 'standalone',
		background_color: '#ffffff',
		theme_color: THEME_COLOUR,
		icons: [
			{ src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
			{ src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
			{ src: 'icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
			{ src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
			{ src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }
		]
	};
}
