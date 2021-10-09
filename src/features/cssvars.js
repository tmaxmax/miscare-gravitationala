/** @typedef {Object<string, string>} CSSVariables */
/**
 *
 * @param {string} prefix
 * @returns {CSSVariables} The variables that match the given prefix.
 */
export default function getCSSVariables(prefix) {
	/** @type {CSSVariables} */
	const vars = {}
	const propPrefix = `--${prefix}-`
	const props = window.getComputedStyle(document.body)

	for (let i = 0; i < document.styleSheets.length; i++) {
		const sheet = document.styleSheets.item(i)
		if (sheet === null || !sheet.href?.startsWith(window.location.origin)) {
			continue
		}

		for (let j = 0; j < sheet.cssRules.length; j++) {
			const rule = sheet.cssRules.item(j)
			if (rule === null || !(rule instanceof CSSStyleRule) || rule.selectorText !== ':root') {
				continue
			}

			for (let k = 0; k < rule.style.length; k++) {
				const prop = rule.style.item(k)
				if (!prop.startsWith(propPrefix)) {
					continue
				}

				const value = props.getPropertyValue(prop)
				vars[prop.slice(propPrefix.length)] = value.trim()
			}
		}
	}

	return vars
}
