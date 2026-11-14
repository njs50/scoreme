import { describe, expect, it } from 'vitest';
import {
	actionFromKey,
	appliedShift,
	chipScrollLeft,
	commitExpression,
	entryFromScore,
	formatExpression,
	previewValue,
	pressKey,
	sheetShift,
	type Entry,
	type Key
} from './keypad.ts';

const entry = (expression: string, replace = false): Entry => ({ expression, replace });

describe('entryFromScore', () => {
	it('replaces a filled cell on the next digit and appends to a blank one', () => {
		expect(entryFromScore('15')).toEqual({ expression: '15', replace: true });
		expect(entryFromScore('')).toEqual({ expression: '', replace: false });
	});
});

describe('commitExpression', () => {
	it('evaluates addition and subtraction from left to right, and multiplication first', () => {
		expect(commitExpression('1+2-3')).toBe('0');
		expect(commitExpression('1-2+3')).toBe('2');
		expect(commitExpression('-5+2')).toBe('-3');
		expect(commitExpression('3000000000')).toBe('3000000000');
		expect(commitExpression('2*3')).toBe('6');
		expect(commitExpression('10+2*3')).toBe('16');
		expect(commitExpression('10*2+3')).toBe('23');
		expect(commitExpression('-4*5')).toBe('-20');
		expect(commitExpression('2*3*4')).toBe('24');
	});

	it('ignores a trailing operator and turns -0 into 0', () => {
		expect(commitExpression('12+')).toBe('12');
		expect(commitExpression('12+5+')).toBe('17');
		expect(commitExpression('-0')).toBe('0');
	});

	it('clears on an empty expression and waits while the entry is unfinished', () => {
		expect(commitExpression('')).toBe('');
		expect(commitExpression('-')).toBeNull();
		expect(commitExpression('--')).toBeNull();
		expect(commitExpression('*')).toBeNull();
		expect(commitExpression('+5')).toBeNull();
		expect(commitExpression('10++')).toBeNull();
		expect(commitExpression('10*+2')).toBeNull();
		expect(commitExpression('12.5')).toBeNull();
	});
});

describe('previewValue', () => {
	it('shows a result only once the expression is more than that result', () => {
		expect(previewValue('1+2')).toBe('3');
		expect(previewValue('1+')).toBe('1');
		expect(previewValue('2*')).toBe('2');
		expect(previewValue('3')).toBeNull();
		expect(previewValue('')).toBeNull();
		expect(previewValue('-')).toBeNull();
	});
});

describe('formatExpression', () => {
	it('spaces operators without detaching a leading minus', () => {
		expect(formatExpression('1+2-3')).toBe('1 + 2 - 3');
		expect(formatExpression('10+2*3')).toBe('10 + 2 × 3');
		expect(formatExpression('-5+2')).toBe('-5 + 2');
		expect(formatExpression('-5')).toBe('-5');
		expect(formatExpression('')).toBe('');
	});
});

describe('actionFromKey', () => {
	it.each([
		['5', '5'],
		['+', '+'],
		['-', '-'],
		['*', '*'],
		['Backspace', 'backspace'],
		['Enter', 'equals'],
		['=', 'equals'],
		['Escape', 'close'],
		['ArrowDown', 'next-row'],
		['ArrowLeft', 'prev-player'],
		['ArrowRight', 'next-player']
	] as const)('maps %s to %s', (key, action) => {
		expect(actionFromKey(key)).toBe(action);
	});

	it('ignores keys the keypad does not use', () => {
		expect(actionFromKey('a')).toBeNull();
		expect(actionFromKey('ArrowUp')).toBeNull();
	});
});

describe('pressKey', () => {
	it('clears, deletes the selection, and deletes one character', () => {
		expect(pressKey(entry('15', true), 'clear')).toEqual(entry(''));
		expect(pressKey(entry('15', true), 'backspace')).toEqual(entry(''));
		expect(pressKey(entry('15'), 'backspace')).toEqual(entry('1'));
		expect(pressKey(entry(''), 'backspace')).toEqual(entry(''));
	});

	it('replaces a selected score with the next digit and collapses an expression on equals', () => {
		expect(pressKey(entry('15', true), '4')).toEqual(entry('4'));
		expect(pressKey(entry('1+2'), 'equals')).toEqual(entry('3', true));
	});

	it('leaves an unfinished minus alone on equals', () => {
		const unfinished = entry('-');
		expect(pressKey(unfinished, 'equals')).toBe(unfinished);
	});

	it('continues from the selected score, or starts a negative from a blank cell', () => {
		expect(pressKey(entry('8', true), '+')).toEqual(entry('8+'));
		expect(pressKey(entry('8', true), '-')).toEqual(entry('8-'));
		expect(pressKey(entry('', true), '-')).toEqual(entry('-'));
		const selectedBlank = entry('', true);
		expect(pressKey(selectedBlank, '+')).toBe(selectedBlank);
		expect(pressKey(entry(''), '-')).toEqual(entry('-'));
		const blank = entry('');
		expect(pressKey(blank, '+')).toBe(blank);
		expect(pressKey(blank, '*')).toBe(blank);
		expect(pressKey(entry('-'), '-')).toEqual(entry('-'));
		const negative = entry('-');
		expect(pressKey(negative, '+')).toBe(negative);
	});

	it('swaps a trailing operator and refuses to grow past the display', () => {
		expect(pressKey(entry('8+'), '-')).toEqual(entry('8-'));
		expect(pressKey(entry('8-'), '*')).toEqual(entry('8*'));
		expect(pressKey(entry('8', true), '*')).toEqual(entry('8*'));
		expect(pressKey(entry('8-'), '+')).toEqual(entry('8+'));
		const full = entry('123456789012');
		expect(pressKey(full, '+')).toBe(full);
		expect(pressKey(entry('12345678901'), '+')).toEqual(entry('12345678901+'));
	});

	it('types digits, dropping a leading zero and stopping at the display limit', () => {
		const type = (start: string, ...digits: Key[]) =>
			digits.reduce((current, digit) => pressKey(current, digit), entry(start));

		expect(type('', '1', '0', '+', '5')).toEqual(entry('10+5'));
		expect(type('0', '5')).toEqual(entry('5'));
		expect(type('-0', '5')).toEqual(entry('-5'));
		expect(type('1+0', '5')).toEqual(entry('1+5'));
		expect(type('1*0', '5')).toEqual(entry('1*5'));
		expect(type('1+0', '0')).toEqual(entry('1+0'));
		expect(pressKey(entry('123456789012'), '4')).toEqual(entry('123456789012'));
	});
});

describe('sheetShift', () => {
	it('slides a covered row up, and leaves a visible row where it is', () => {
		expect(sheetShift(40, 80, 0, 500)).toBe(0);
		expect(sheetShift(700, 760, 0, 500)).toBe(260);
		expect(sheetShift(10, 400, 0, 200)).toBe(10);
		expect(sheetShift(-20, 40, 0, 30)).toBe(0);
	});
});

describe('appliedShift', () => {
	it('reads the translate already on the sheet', () => {
		expect(appliedShift('none')).toBe(0);
		expect(appliedShift('')).toBe(0);
		expect(appliedShift('matrix(1, 0, 0, 1, 0, -40)')).toBe(-40);
	});
});

describe('chipScrollLeft', () => {
	it('scrolls the least amount that keeps the chip in view', () => {
		expect(chipScrollLeft(0, 200, 10, 80)).toBe(0);
		expect(chipScrollLeft(0, 100, 250, 80)).toBe(230);
		expect(chipScrollLeft(300, 100, 10, 80)).toBe(10);
	});
});
