/**
 * @param {number} initialMedian
 * @param {number} [tolerance]
 */
export default function createTime(initialMedian, tolerance = 1) {
	let first = Number.NaN,
		prev = Number.NaN,
		median = initialMedian

	const time = () => {
		const now = performance.now()
		const firstInstant = Number.isNaN(first)
		if (firstInstant) {
			first = now
		}
		const instant = now - first
		if (firstInstant) {
			prev = instant
			return instant
		}
		const delta = instant - prev
		const medianDiff = delta - median
		prev = instant
		if (medianDiff < -tolerance || medianDiff > tolerance) {
			prev -= medianDiff
			first += medianDiff
			return prev
		}
		median = lerp(median, delta, 0.5)
		return prev
	}

	time.reset = () => {
		first = prev = Number.NaN
		median = initialMedian
	}

	return time
}
