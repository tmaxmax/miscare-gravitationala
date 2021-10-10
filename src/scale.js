/**
 * @typedef {{
 *   transitionDuration: number
 *   transitionFunction: (t: number) => number
 * }} ScaleProperties
 */

export default class Scale {
	#transitionStart = Number.NaN
	#start = Number.NaN
	#end = Number.NaN
	#props
	#scale

	/**
	 * @param {number} initialScale
	 * @param {ScaleProperties} props
	 */
	constructor(initialScale, props) {
		this.#props = props
		this.#scale = initialScale
	}

	get scale() {
		return this.#scale
	}

	get target() {
		return Number.isNaN(this.#end) ? this.scale : this.#end
	}

	get isGrowing() {
		return !Number.isNaN(this.#start)
	}

	/**
	 * @param {number} timestamp
	 * @param {number} [growthFactor]
	 */
	grow(timestamp, growthFactor = Number.NaN) {
		if (Number.isNaN(growthFactor)) {
			this.#grow(timestamp)
		} else {
			this.#transitionStart = timestamp
			this.#start = this.scale
			this.#end = this.#start * growthFactor
		}
	}

	/**
	 * @param {number} scale
	 */
	reset(scale) {
		this.#stopGrow()
		this.#scale = scale
	}

	/**
	 * @param {number} timestamp
	 */
	#grow(timestamp) {
		if (Number.isNaN(this.#start)) {
			return
		}

		const elapsed = timestamp - this.#transitionStart
		if (elapsed < 0) {
			throw new Error(`Scale: given timestamp ${timestamp} is previous transition start for X ${this.#transitionStart}`)
		}

		const { transitionFunction: fn, transitionDuration: d } = this.#props
		const progress = elapsed / d

		if (Number.isNaN(progress) || !Number.isFinite(progress)) {
			this.#scale = this.#end
			this.#stopGrow()
			return
		}

		this.#scale = lerp(this.#start, this.#end, fn(elapsed / d))
		if (progress >= 1) {
			this.#stopGrow()
		}
	}

	#stopGrow() {
		this.#start = this.#end = this.#transitionStart = Number.NaN
	}
}
