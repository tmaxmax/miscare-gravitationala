const KNOWN_FRAME_RATES = [60, 75, 90, 120, 144, 160, 165, 240]

/**
 * @returns {Promise<number>}
 */
export default async function detectFrameRate() {
	const refresh = await new Promise(resolve => {
		requestAnimationFrame(t1 => requestAnimationFrame(t2 => resolve(t2 - t1)))
	})
	const detected = 1000 / refresh

	let minDelta = Number.POSITIVE_INFINITY
	let framerate = 0
	for (const f of KNOWN_FRAME_RATES) {
		const delta = Math.abs(f - detected)
		if (delta < minDelta) {
			minDelta = delta
			framerate = f
		}
	}

	return framerate
}
