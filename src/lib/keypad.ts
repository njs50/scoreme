/** One tap on the score keypad. Navigation keys are handled by the sheet. */
export type Key =
	| '0'
	| '1'
	| '2'
	| '3'
	| '4'
	| '5'
	| '6'
	| '7'
	| '8'
	| '9'
	| '+'
	| '-'
	| 'backspace'
	| 'clear'
	| 'equals';

/** What the keypad is showing, and whether the next digit replaces it. */
export type Entry = {
	expression: string;
	replace: boolean;
};

/** A keypad key, or a key that moves around the sheet instead of editing. */
export type Action = Key | 'close' | 'next-row' | 'prev-player' | 'next-player';

const MAX_EXPRESSION_LENGTH = 12;

/** Open a cell showing its saved score. A filled cell is replaced by the next digit. */
export function entryFromScore(score: string): Entry {
	return { expression: score, replace: score !== '' };
}

/**
 * The score to store for an expression.
 * '' clears the cell. null leaves it alone (a lone "-" is not a score yet).
 * A trailing + or - is ignored, so "12+" is still 12.
 */
export function commitExpression(expression: string): string | null {
	if (expression === '') return '';
	const match = /^(-?\d+)((?:[+-]\d+)*)([+-])?$/.exec(expression);
	if (!match) return null;
	let value = Number.parseInt(match[1], 10);
	for (const part of match[2].matchAll(/([+-])(\d+)/g)) {
		const amount = Number.parseInt(part[2], 10);
		value = part[1] === '+' ? value + amount : value - amount;
	}
	return String(value);
}

/** The running result, when it is different from the expression on the display. */
export function previewValue(expression: string): string | null {
	const value = commitExpression(expression);
	if (value === null || value === expression) return null;
	return value;
}

/** Spaces around the operators, leaving a leading minus attached to its digit. */
export function formatExpression(expression: string): string {
	return expression.replace(/(?<=\d)([+-])/g, ' $1 ');
}

/** Map a physical key to a keypad action. Anything else is ignored. */
export function actionFromKey(key: string): Action | null {
	if (/^[0-9]$/.test(key)) return key as Key;
	switch (key) {
		case '+':
		case '-':
			return key;
		case 'Backspace':
			return 'backspace';
		case 'Enter':
		case '=':
			return 'equals';
		case 'Escape':
			return 'close';
		case 'ArrowDown':
			return 'next-row';
		case 'ArrowLeft':
			return 'prev-player';
		case 'ArrowRight':
			return 'next-player';
		default:
			return null;
	}
}

function appendDigit(expression: string, digit: string): string {
	if (expression === '0') return digit;
	if (expression === '-0') return `-${digit}`;
	if (/[+-]0$/.test(expression)) return expression.slice(0, -1) + digit;
	if (expression.length >= MAX_EXPRESSION_LENGTH) return expression;
	return expression + digit;
}

/** Apply one keypad tap. The sheet stores {@link commitExpression} of the result. */
export function pressKey(entry: Entry, key: Key): Entry {
	if (key === 'clear') return { expression: '', replace: false };
	if (key === 'backspace') {
		if (entry.replace) return { expression: '', replace: false };
		return { expression: entry.expression.slice(0, -1), replace: false };
	}
	if (key === 'equals') {
		const committed = commitExpression(entry.expression);
		if (committed === null) return entry;
		return { expression: committed, replace: true };
	}
	if (key === '+' || key === '-') {
		if (entry.replace) {
			if (entry.expression === '') {
				return key === '-' ? { expression: '-', replace: false } : entry;
			}
			return { expression: entry.expression + key, replace: false };
		}
		if (entry.expression === '' || entry.expression === '-') {
			return key === '-' ? { expression: '-', replace: false } : entry;
		}
		if (/[+-]$/.test(entry.expression)) {
			return { expression: entry.expression.slice(0, -1) + key, replace: false };
		}
		if (entry.expression.length >= MAX_EXPRESSION_LENGTH) return entry;
		return { expression: entry.expression + key, replace: false };
	}
	if (entry.replace) return { expression: key, replace: false };
	return { expression: appendDigit(entry.expression, key), replace: false };
}

/** Keep the active player chip inside the row scroller without moving the page. */
export function chipScrollLeft(
	scrollLeft: number,
	view: number,
	chipLeft: number,
	chipWidth: number
): number {
	const right = chipLeft + chipWidth;
	if (chipLeft < scrollLeft) return chipLeft;
	if (right > scrollLeft + view) return right - view;
	return scrollLeft;
}
