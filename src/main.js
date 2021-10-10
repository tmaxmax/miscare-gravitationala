/// <reference types="p5/global" />

import getCSSVariables from './features/cssvars.js'
import onColorSchemeChange from './features/darkmode.js'
import detectFrameRate from './features/refreshrate.js'
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

/** @type {import('./scale').ScaleProperties} */
const scaleProperties = { transitionDuration: 300, transitionFunction: x => 1 - (1 - x) ** 3 }
/** @type {Scale} */
let scaleX
/** @type {Scale} */
let scaleY
/** @type {ReturnType<createTime>} */
let time

globalThis.setup = async () => {
	const framerate = await detectFrameRate()
	createCanvas(windowWidth, windowHeight)
	frameRate(framerate)
	time = createTime(1000 / framerate)
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
/** @type {Coords[]} */
const coords = []

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

function setupUI() {
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

	for (let i = 1; i < coords.length; i++) {
		drawLine(coords[i - 1], coords[i])
	}

	pop()
}

function draw() {
	const x = time()
	const y = f(x / 500)
	coords.push({ x, y })

	if (!scaleX.isGrowing && x * scaleX.scale > GRAPH_SIZE_X()) {
		scaleX.grow(x, 1 / 2)
	}
	const graphY = y * scaleY.scale
	const graphSizeY = GRAPH_SIZE_Y()
	if (!scaleY.isGrowing && graphY > graphSizeY) {
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
		setupUI()

		return
	}

	const l = coords.length
	if (l === 1) {
		return
	}

	push()
	setupPlotContext()
	drawLine(coords[l - 2], coords[l - 1])
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
