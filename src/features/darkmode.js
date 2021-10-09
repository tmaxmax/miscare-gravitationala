/**
 * Execute some logic whenever the user's color scheme changes.
 * The given callback is also executed the first time this function is called.
 *
 * @param {(isDark: boolean, firstRun: boolean) => void} cb
 */
export default function onColorSchemeChange(cb) {
	if (!window.matchMedia) {
		cb(false, true)
		return
	}

	const media = window.matchMedia('(prefers-color-scheme: dark)')
	cb(media.matches, true)
	media.addEventListener('change', e => cb(e.matches, false))
}
