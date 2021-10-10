/// <reference types="p5/global" />

import getCSSVariables from './features/cssvars.js'
import onColorSchemeChange from './features/darkmode.js'
import createGravitationalMovement from './function.js'
import Scale from './scale.js'
import createTime from './time.js'
import input from './features/input.js'

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
/** @type {HTMLCanvasElement} */
let canvas

globalThis.setup = () => {
	const p5Canvas = createCanvas(windowWidth, windowHeight)
	p5Canvas.parent('app')
	canvas = p5Canvas.elt
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

const MIN_TIME_SPEED = 2000
const MAX_TIME_SPEED = 100

/** @type {Fn | undefined} */
let f
let velocity = Number.NaN,
	height = Number.NaN,
	gravity = Number.NaN,
	speedPercentage = 0.5

function createF() {
	if (Number.isNaN(velocity) || Number.isNaN(height) || Number.isNaN(gravity)) {
		return
	}

	const first = !f
	f = createGravitationalMovement({ v: velocity, y: height, g: gravity, periodic: true })
	if (!first) {
		resetGraph()
	}
}

input('#speed', v => {
	speedPercentage = v

	if (f) {
		resetGraph()
	}
})

input('#velocity', v => {
	velocity = v
	createF()
})

input('#height', v => {
	height = v
	createF()
})

input('#gravity', v => {
	gravity = v
	createF()
})

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
		let c,
			minpy = Infinity
		for (let j = i + 1; j < i + increment; j++) {
			const py = abs(coords[j].y) * scaleY.scale
			if (py <= 1 && py < minpy) {
				c = coords[j]
				minpy = py
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

globalThis.draw = () => {
	if (!f) {
		return
	}

	const x = time()
	const speed = lerp(MIN_TIME_SPEED, MAX_TIME_SPEED, speedPercentage)
	const y = f(x / speed)
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
			const samplingFactor = Math.log2(Math.max(dx, dy)) | 0
			const additionalSamples = (samplingFactor * (samplingFactor + 1)) / 2
			for (let i = 1; i <= additionalSamples; i++) {
				const nx = lerp(px, x, i / (additionalSamples + 1))
				const ny = f(nx / speed)
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

	const graphY = abs(y) * scaleY.scale
	const graphSizeY = GRAPH_SIZE_Y()
	if (!growingOnY && graphY > graphSizeY) {
		const growth = graphSizeY / graphY
		const standardGrowth = 3 / 5
		console.log({ growth, standardGrowth })
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

let touchPosX = Number.NaN
let touchPosY = Number.NaN

globalThis.touchStarted = () => {
	touchPosX = mouseX
	touchPosY = mouseY
}

/** @type {(e: TouchEvent) => void} */
globalThis.touchEnded = e => {
	const deltaX = abs(mouseX - touchPosX)
	const deltaY = abs(mouseY - touchPosY)
	if (deltaX > 10 || deltaY > 10 || e.target !== canvas) {
		return
	}

	resetGraph()
}

globalThis.keyPressed = () => {
	if (key === ' ') {
		resetGraph()
		return false
	}
}
