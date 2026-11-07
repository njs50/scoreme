import { describe, expect, it } from 'vitest';
import * as layout from './+layout.ts';

describe('+layout.ts', () => {
	// adapter-static only emits pages that are prerendered.
	it('prerenders every page', () => {
		expect(layout.prerender).toBe(true);
	});
});
