export default class Time {
	/** @type {number | undefined} */
	#first

	constructor() {}

	/**
	 * @returns {number}
	 */
	instant() {
		const now = performance.now()
		if (typeof this.#first === 'undefined') {
			this.#first = now
		}
		return now - this.#first
	}

	reset() {
		this.#first = undefined
	}
}
