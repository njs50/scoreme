import { execSync } from 'node:child_process';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { playwright } from '@vitest/browser-playwright';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

/** Commit the build came from. Preview deploys set PUBLIC_BUILD_ID to github.sha. */
function buildSha(): string {
	const fromEnv = process.env.PUBLIC_BUILD_ID || process.env.GITHUB_SHA;
	if (fromEnv) return fromEnv;
	try {
		return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
	} catch {
		return 'dev';
	}
}

/** version.json lets callers confirm which SHA GitHub Pages is actually serving. */
function versionJson(): Plugin {
	return {
		name: 'scoreme-version-json',
		apply: 'build',
		generateBundle() {
			const outDir = this.environment?.config.build.outDir ?? '';
			// SvelteKit runs this hook for the server build too; only the client build is published.
			if (!outDir.endsWith('/client') && !outDir.endsWith('\\client')) return;
			this.emitFile({
				type: 'asset',
				fileName: 'version.json',
				source: `${JSON.stringify({ sha: buildSha(), builtAt: new Date().toISOString() }, null, 2)}\n`
			});
		}
	};
}

/**
 * GitHub Pages project path. Production is /scoreme; preview-deploy.yml sets
 * SCOREME_BASE=/scoreme-preview. Dev serves from the root.
 */
function siteBase(command: string, isPreview: boolean): '' | `/${string}` {
	if (command !== 'build' && !isPreview) return '';
	const raw = (process.env.SCOREME_BASE ?? '/scoreme').trim().replace(/\/+$/, '');
	if (!raw.startsWith('/') || raw.includes('//')) {
		throw new Error(`SCOREME_BASE must be a single root-relative path (got "${raw}")`);
	}
	return raw as `/${string}`;
}

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
				base: siteBase(command, isPreview === true)
			}
		}),
		versionJson()
	],
	define: {
		__PREVIEW_REF__: JSON.stringify(process.env.PUBLIC_PREVIEW_REF ?? ''),
		__PREVIEW_SHA__: JSON.stringify(process.env.PUBLIC_PREVIEW_SHA ?? '')
	},
	server: {
		host: '0.0.0.0'
	},
	test: {
		expect: { requireAssertions: true },
		coverage: {
			provider: 'v8',
			include: ['src/**/*.{ts,svelte}'],
			exclude: ['src/**/*.{test,spec}.ts', 'src/**/*.d.ts'],
			thresholds: {
				'src/**/*.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
				// Branches are left out for components: the Svelte compiler wraps template
				// expressions in `?? ''` fallbacks that can never be reached.
				'src/**/*.svelte': { statements: 100, functions: 100, lines: 100 }
			}
		},
		projects: [
			{
				extends: './vite.config.ts',
				define: {
					__PREVIEW_REF__: JSON.stringify('test-branch'),
					__PREVIEW_SHA__: JSON.stringify('abcdef1234567890')
				},
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.ts']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.ts'],
					exclude: ['src/**/*.svelte.{test,spec}.ts']
				}
			}
		]
	}
}));
