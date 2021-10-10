/**
 * @param {string} selector
 * @param {(value: number) => unknown} handler
 */
export default function input(selector, handler) {
	/** @type {HTMLInputElement | null} */
	const e = document.querySelector(selector)
	if (e === null) {
		throw new Error(`Element "${selector}" does not exist in DOM"`)
	}

	const initialValue = parseFloat(e.value)
	handler(initialValue)

	e.addEventListener('change', () => handler(parseFloat(e.value)))
}
