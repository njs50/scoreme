import { describe, expect, it } from 'vitest';
import { previewLabel } from './preview.ts';

describe('previewLabel', () => {
	it('shows the branch and short SHA for preview builds', () => {
		expect(previewLabel('cursor/foo', '0123456789abcdef')).toBe('cursor/foo · 0123456');
	});

	it.each([
		['', ''],
		['cursor/foo', ''],
		['', '0123456789abcdef']
	])('is empty unless both are set (%j, %j)', (ref, sha) => {
		expect(previewLabel(ref, sha)).toBe('');
	});
});
