import { afterEach, describe, expect, it } from 'vitest';
import { blurOnEscape, selectTextOnFocus } from './inputDirectives.ts';

function mountInput(value = 'Greer') {
	const input = document.createElement('input');
	input.value = value;
	document.body.append(input);
	return input;
}

afterEach(() => {
	document.body.replaceChildren();
});

describe('selectTextOnFocus', () => {
	it('selects the whole value when focused', () => {
		const input = mountInput();
		selectTextOnFocus(input);

		input.focus();

		expect(input.selectionStart).toBe(0);
		expect(input.selectionEnd).toBe(input.value.length);
	});

	it('stops selecting after destroy', () => {
		const input = mountInput();
		selectTextOnFocus(input).destroy();
		input.setSelectionRange(2, 2);

		input.focus();

		expect(input.selectionStart).toBe(2);
		expect(input.selectionEnd).toBe(2);
	});
});

describe('blurOnEscape', () => {
	it('blurs on Escape', () => {
		const input = mountInput();
		blurOnEscape(input);
		input.focus();

		input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

		expect(document.activeElement).not.toBe(input);
	});

	it('ignores other keys', () => {
		const input = mountInput();
		blurOnEscape(input);
		input.focus();

		input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

		expect(document.activeElement).toBe(input);
	});

	it('stops blurring after destroy', () => {
		const input = mountInput();
		blurOnEscape(input).destroy();
		input.focus();

		input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

		expect(document.activeElement).toBe(input);
	});
});
