/**
 * @typedef {(x: number) => number} Fn
 * @typedef {{
 *   y: number
 *   v: number
 *   g: number
 *   periodic: boolean
 * }} GravitationalMovementProperties
 */

const defaultG = 9.80665

/**
 * @param {Partial<GravitationalMovementProperties>} [props]
 * @return {Fn}
 */
export default function createGravitationalMovement(props = {}) {
	/** @type {GravitationalMovementProperties} */
	const { y, v, g, periodic } = {
		y: props.y || 0,
		v: props.v || 0,
		g: props.g || defaultG,
		periodic: props.periodic || false,
	}

	// TODO: Handle negative velocity values
	if (v < 0) {
		throw new Error(`Initial velocity must be positive or 0, got ${v}`)
	}

	const k = g / 2
	/** @type {Fn} */
	const base = t => y + t * (v - k * t)
	if (!periodic) {
		return base
	}

	const hmax = v <= 0 ? y : y + (v * v) / (2 * g)
	const tc = Math.sqrt((2 * hmax) / g)
	const ti = v / g
	const period = 2 * tc

	return t => {
		t = t - ((t / period) | 0) * period

		if (t > tc + ti) {
			t = t - tc - ti
			return g * tc * t - k * t * t
		}

		return base(t)
	}
}
