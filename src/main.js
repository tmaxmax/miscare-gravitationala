/// <reference types="p5/global" />

import getCSSVariables from './features/cssvars.js'
import onColorSchemeChange from './features/darkmode.js'
import createGravitationalMovement from './function.js'
import Time from './time.js'

/**
 * @typedef {{
 *   background: string
 *   content: string
 *   accent: string
 *   accentLight: string
 *   accentDark: string
 * }} Theme
 * @typedef {{ x: number, y: number }} Coords
 * @typedef {import('./function').Fn} Fn
 */

/** @type {Theme} */
let theme

onColorSchemeChange((_isDark, firstRun) => {
	// @ts-ignore We expect these CSS variables to be defined
	theme = getCSSVariables('theme')
	if (!firstRun) {
		setupUI()
		draw()
	}
})

const AXIS_STROKE_WEIGHT = 5
const AXIS_LABEL_WEIGHT = 2
const AXIS_Y_X_POS = () => 0.1 * windowWidth
const AXIS_Y_Y_START = () => 0.1 * windowHeight
const AXIS_Y_Y_END = () => windowHeight - AXIS_Y_Y_START()
const AXIS_Y_LABEL = 'y'
const AXIS_X_X_START = () => 0.05 * windowWidth - textWidth(AXIS_X_LABEL) / 2
const AXIS_X_X_END = () => windowWidth - AXIS_X_X_START() - textWidth(AXIS_X_LABEL) / 2
const AXIS_X_Y_POS = () => 0.5 * windowHeight
const AXIS_X_LABEL = 't'
const AXIS_ORIGIN_LABEL = 'O'
const GRAPH_SIZE_Y = () => AXIS_X_Y_POS() - AXIS_Y_Y_START()
const GRAPH_SIZE_X = () => AXIS_X_X_END() - AXIS_Y_X_POS()

/**
 * @param {number} [sx]
 * @param {number} [sy]
 */
function setupUI(sx, sy) {
	sx = sx == null ? GRAPH_SIZE_X() : sx
	sy = sy == null ? 1 : sy

	push()

	background(theme.background)

	stroke(theme.content)
	strokeWeight(AXIS_LABEL_WEIGHT)
	fill(theme.content)
	textSize(24)

	const axisXYPos = AXIS_X_Y_POS()
	const axisXXStart = AXIS_X_X_START()
	const axisXXEnd = AXIS_X_X_END()
	const axisYXPos = AXIS_Y_X_POS()
	const axisYYStart = AXIS_Y_Y_START()
	const axisYYEnd = AXIS_Y_Y_END()
	const textSz = textSize()

	text(AXIS_Y_LABEL, axisYXPos - textWidth(AXIS_Y_LABEL) / 2, axisYYStart - (textSz / 3) * 2)
	text(AXIS_X_LABEL, axisXXEnd + textWidth(AXIS_X_LABEL), axisXYPos + textSz / 4)
	text(AXIS_ORIGIN_LABEL, axisYXPos - textWidth(AXIS_ORIGIN_LABEL) - AXIS_STROKE_WEIGHT - 1, axisXYPos + textSz)

	stroke(theme.accentLight)
	strokeWeight(AXIS_STROKE_WEIGHT)
	line(axisYXPos, axisYYStart, axisYXPos, axisYYEnd)
	line(axisXXStart, axisXYPos, axisXXEnd, axisXYPos)

	pop()
}

globalThis.setup = () => {
	createCanvas(windowWidth, windowHeight)
	frameRate(120)
	setupUI()
}

globalThis.windowResized = () => {
	resizeCanvas(windowWidth, windowHeight)
	setupUI()
	draw()
}

const f = createGravitationalMovement({ v: 10, y: 5, periodic: true })
const time = new Time()
/** @type {Coords[]} */
const coords = []

/** @type {number | undefined} */
let maxY

function resetGraph() {
	time.reset()
	maxY = undefined
	coords.length = 0
	setupUI()
}

globalThis.draw = () => {
	const x = time.instant()
	const y = f(x / 1000)
	const absy = abs(y)
	if (!maxY || absy > maxY) {
		maxY = absy
	}
	const sx = GRAPH_SIZE_X() / max(x, GRAPH_SIZE_X())
	const sy = max(GRAPH_SIZE_Y() / max(maxY, 1), 10)
	coords.push({ x, y })

	if (sy !== GRAPH_SIZE_Y() || sx !== 1) {
		setupUI(sx, sy)
	}

	push()
	translate(AXIS_Y_X_POS(), AXIS_X_Y_POS())
	scale(1, -1)

	strokeWeight(AXIS_STROKE_WEIGHT)
	stroke(theme.content)

	/** @type {Coords | undefined} */
	let prevC
	for (const c of coords) {
		const prev = prevC || c
		prevC = c
		line(prev.x * sx, prev.y * sy, c.x * sx, c.y * sy)
	}

	pop()
}

globalThis.keyPressed = () => {
	if (keyCode === ENTER) {
		resetGraph()
	}
}
