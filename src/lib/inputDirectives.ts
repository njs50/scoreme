/** Selects the input's text when it is focused, so typing replaces the old value */
export function selectTextOnFocus(node: HTMLInputElement) {
	const handleFocus = () => node.select();

	node.addEventListener('focus', handleFocus);

	return {
		destroy() {
			node.removeEventListener('focus', handleFocus);
		}
	};
}

/** Blurs the input when Escape is pressed */
export function blurOnEscape(node: HTMLInputElement) {
	const handleKey = (event: KeyboardEvent) => {
		if (event.key === 'Escape') node.blur();
	};

	node.addEventListener('keydown', handleKey);

	return {
		destroy() {
			node.removeEventListener('keydown', handleKey);
		}
	};
}
