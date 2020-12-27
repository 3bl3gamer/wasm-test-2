import { getById, mustBeNotNull, mustBeInstanceOf, sleep } from './utils.js'
import { render as jsRenderInner } from './render.js'

const progressBox = getById('progressBox', HTMLDivElement)
const canvas = getById('canvas', HTMLCanvasElement)
const rc = mustBeNotNull(canvas.getContext('2d'))

const w = canvas.width
const h = canvas.height
const iters = 10 * 100
const samples = 500 * 1000
const imgData = rc.getImageData(0, 0, w, h)
const pix = imgData.data

;(async () => {
	const isWasm = !location.hash.startsWith('#js')
	const modeName = isWasm ? 'WASM' : 'JS'
	const otherModeName = isWasm ? 'JS' : 'WASM'
	const { buf, render } = isWasm ? await setupWASM(iters, w, h) : setupJS(iters, w, h)

	console.time('render ' + modeName)
	const stt = Date.now()
	const steps = 64
	for (let i = 0; i < steps; i++) {
		render(samples, 1 - (i + 1) * (3 / steps), 3 / steps)
		updateImageData(buf)
		progressBox.style.width = ((i + 1) / steps) * 100 + '%'
		await sleep(0)
	}
	console.log(buf)
	const delta = Date.now() - stt
	console.timeEnd('render ' + modeName)

	const msg = `${modeName} mode finished in ${delta.toLocaleString()} ms.\n\nRestart in ${otherModeName} mode?`
	if (confirm(msg)) {
		location.hash = isWasm ? '#js' : ''
		location.reload()
	}
})()

function updateImageData(buf) {
	let sum = 0
	for (let i = 0; i < w; i++) {
		for (let j = 0; j < h; j++) {
			const pos = (i + j * w) * 3
			sum += buf[pos + 0] + buf[pos + 1] + buf[pos + 2]
		}
	}
	const avg = sum / 3 / w / h
	const brightnessK = 0.07 / avg
	for (let i = 0; i < w; i++) {
		for (let j = 0; j < h; j++) {
			const pos = i + j * w
			pix[pos * 4 + 0] = Math.pow(buf[pos * 3 + 0] * brightnessK, 0.995) * 255
			pix[pos * 4 + 1] = Math.pow(buf[pos * 3 + 1] * brightnessK, 0.995) * 255
			pix[pos * 4 + 2] = Math.pow(buf[pos * 3 + 2] * brightnessK, 0.995) * 255
			pix[pos * 4 + 3] = 255
		}
	}
	rc.putImageData(imgData, 0, 0)
}

function setupJS(iters, w, h) {
	const buf = new Uint32Array(w * h * 3)
	const mtx = new Float64Array([0, 1, 0, 0, 1, 0, 0, 0])
	function render(samples, xOffset, xWidth) {
		jsRenderInner(buf, mtx, w, h, iters, samples, xOffset, xWidth)
	}
	return { buf, render }
}

async function setupWASM(iters, w, h) {
	const { instance } = await WebAssembly.instantiateStreaming(fetch('./render.wasm'))
	const exports = instance.exports

	const WA_memory = mustBeInstanceOf(exports.memory, WebAssembly.Memory)
	const WA_get_required_memory_size = /** @type {(iters:number, w:number, h:number) => number} */ (exports.get_required_memory_size)
	const WA_render = /** @type {(iters:number, w:number, h:number, samples:number, xOffset:number, xWidth:number) => void} */ (exports.render)
	const WS_color_buf_ptr = /** @type {() => number} */ (exports.get_color_buf_ptr)()

	const delta = WA_get_required_memory_size(iters, w, h) - WA_memory.buffer.byteLength
	const deltaPages = Math.ceil(delta / 65536)
	if (deltaPages > 0) WA_memory.grow(deltaPages)

	const buf = new Uint32Array(WA_memory.buffer, WS_color_buf_ptr, w * h * 3)
	function render(samples, xOffset, xWidth) {
		WA_render(iters, w, h, samples, xOffset, xWidth)
	}
	return { buf, render }
}
