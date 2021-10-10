/// <reference types="p5/global" />

import getCSSVariables from './features/cssvars.js'
import onColorSchemeChange from './features/darkmode.js'
import createGravitationalMovement from './function.js'
import Scale from './scale.js'
import createTime from './time.js'

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

const FRAME_RATE = 60
/** @type {import('./scale').ScaleProperties} */
const scaleProperties = { transitionDuration: 300, transitionFunction: x => 1 - (1 - x) ** 3 }
/** @type {Scale} */
let scaleX
/** @type {Scale} */
let scaleY

globalThis.setup = () => {
	createCanvas(windowWidth, windowHeight)
	frameRate(FRAME_RATE)
	scaleX = new Scale(1, scaleProperties)
	scaleY = new Scale(GRAPH_SIZE_Y(), scaleProperties)
	setupUI()
	// @ts-ignore
	globalThis.draw = draw
}

globalThis.windowResized = () => {
	resizeCanvas(windowWidth, windowHeight)
	setupUI()
	draw()
}

const f = createGravitationalMovement({ y: 5, periodic: true })
// const f = Math.sqrt
/** @type {Coords[]} */
const coords = []
const time = createTime(1000 / FRAME_RATE)

function resetGraph() {
	time.reset()
	scaleX.reset(1)
	scaleY.reset(GRAPH_SIZE_Y())
	coords.length = 0
	setupUI()
}

function setupPlotContext() {
	translate(AXIS_Y_X_POS(), AXIS_X_Y_POS())
	scale(1, -1)

	strokeWeight(AXIS_STROKE_WEIGHT)
	stroke(theme.content)
}

/**
 * @param {Coords} p
 * @param {Coords} c
 */
function drawLine(p, c) {
	const sx = scaleX.scale
	const sy = scaleY.scale
	line(p.x * sx, p.y * sy, c.x * sx, c.y * sy)
}

function setupUI(fast = false) {
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

	push()
	setupPlotContext()

	const l = coords.length
	const increment = fast ? Math.log(l) | 0 : 1
	let lastIndexDrawn = 0

	for (let i = 0; i < coords.length - increment; i += increment) {
		let c
		for (let j = i + 1; j < i + increment; j++) {
			if (abs(coords[j].y) < 0.1) {
				c = coords[j]
				break
			}
		}
		if (c) {
			drawLine(coords[i], c)
			drawLine(c, coords[i + increment])
		} else {
			drawLine(coords[i], coords[i + increment])
		}
		lastIndexDrawn = i + increment
	}

	if (fast && lastIndexDrawn != l - 1) {
		drawLine(coords[lastIndexDrawn], coords[l - 1])
	}

	pop()
}

const TIME_REDUCTION = 1000
const ADDITIONAL_SAMPLES = 3

globalThis.draw = () => {
	const x = time()
	const y = f(x / TIME_REDUCTION)
	const drawStart = coords.length
	let addCoords = true
	if (coords.length > 0) {
		const { x: px, y: py } = coords[coords.length - 1]
		const sx = scaleX.scale
		const sy = scaleY.scale
		const dx = abs(x * sx - px * sx)
		const dy = abs(y * sy - py * sy)
		if (dx < 1 && dy < 1) {
			addCoords = false
		} else if (dx > 1 || dy > 1) {
			for (let i = 1; i <= ADDITIONAL_SAMPLES; i++) {
				const distance = i / (ADDITIONAL_SAMPLES + 1)
				const nx = lerp(px, x, distance)
				const ny = f(nx / TIME_REDUCTION)
				coords.push({ x: nx, y: ny })
			}
		}
	}
	if (addCoords) {
		coords.push({ x, y })
	}

	const growingOnX = scaleX.isGrowing
	const growingOnY = scaleY.isGrowing

	if (!addCoords && !growingOnX && !growingOnY) {
		return
	}

	if (!growingOnX && x * scaleX.scale > GRAPH_SIZE_X()) {
		scaleX.grow(x, 1 / 2)
	}

	const graphY = y * scaleY.scale
	const graphSizeY = GRAPH_SIZE_Y()
	if (!growingOnY && graphY > graphSizeY) {
		const growth = graphSizeY / graphY
		const standardGrowth = 3 / 5
		if (growth < standardGrowth) {
			scaleY.grow(Number.NaN, growth)
		} else {
			scaleY.grow(x, standardGrowth)
		}
	}

	if (scaleX.isGrowing || scaleY.isGrowing) {
		scaleX.grow(x)
		scaleY.grow(x)
		setupUI(scaleX.isGrowing || scaleY.isGrowing)

		return
	}

	if (coords.length <= 1) {
		return
	}

	push()
	setupPlotContext()
	for (let i = drawStart; i < coords.length; i++) {
		drawLine(coords[i - 1], coords[i])
	}
	pop()
}

globalThis.keyPressed = () => {
	if (keyCode === ENTER) {
		resetGraph()
	}
}

globalThis.touchEnded = () => {
	resetGraph()
}
