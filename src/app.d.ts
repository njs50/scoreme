// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	// Set by vite.config.ts from PUBLIC_PREVIEW_REF / PUBLIC_PREVIEW_SHA.
	// Empty unless a preview deploy baked them in.
	const __PREVIEW_REF__: string;
	const __PREVIEW_SHA__: string;
	// Commit this page was built from. Compared with version.json to offer an update.
	const __BUILD_SHA__: string;

	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
