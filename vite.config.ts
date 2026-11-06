import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig(({ command, isPreview }) => ({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({
				pages: 'docs',
				assets: 'docs'
			}),
			paths: {
				// GitHub Pages serves the site from https://njs50.github.io/scoreme/
				base: command === 'build' || isPreview ? '/scoreme' : ''
			}
		})
	],
	server: {
		host: '0.0.0.0'
	}
}));
