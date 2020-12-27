export function render(buf, mtx, w, h, iters, samples, xOffset, xWidth) {
	const m0 = mtx[0]
	const m1 = mtx[1]
	const m2 = mtx[2]
	const m3 = mtx[3]
	const m4 = mtx[4]
	const m5 = mtx[5]
	const m6 = mtx[6]
	const m7 = mtx[7]

	const iterXBuf = new Float64Array(iters)
	const iterYBuf = new Float64Array(iters)
	const iterABuf = new Float64Array(iters)
	const iterBBuf = new Float64Array(iters)
	for (let i = 0; i < samples; i++) {
		const cx = rand() * xWidth + xOffset
		const cy = rand() * 4 - 2
		let a = cx
		let b = cy
		let iter = iters
		while (iter > 0) {
			iter--
			const aa = a * a
			const bb = b * b
			// if (aa + bb > 4) break
			if (aa > 4 || bb > 4) break
			b = 2 * a * b + cy
			a = aa - bb + cx
			iterXBuf[iter] = a * m0 + b * m1 + cx * m2 + cy * m3
			iterYBuf[iter] = a * m4 + b * m5 + cx * m6 + cy * m7
			iterABuf[iter] = a
			iterBBuf[iter] = b
		}
		if (iter !== 0) {
			for (let k = iter + 1; k < iters - 1; k++) {
				const a = iterABuf[k]
				const b = iterBBuf[k]
				const x = Math.floor(((iterXBuf[k] + 2) / 4) * w)
				const y = Math.floor(((iterYBuf[k] + 2) / 4) * h)
				if (x >= 0 && y >= 0 && x < w && y < h) {
					const yk = 1
					const angle0 = atan2((b - iterBBuf[k - 1]) * yk, a - iterABuf[k - 1])
					const angle1 = atan2((iterBBuf[k + 1] - b) * yk, iterABuf[k + 1] - a)
					let dak = Math.abs(angle1 - angle0) / Math.PI
					if (dak > 1) dak = 2 - dak
					hslToRgb(dak, 1, 0.5, buf, (x + y * w) * 3)
				}
			}
		}
	}
}

function atan2(y, x) {
	//http://pubs.opengroup.org/onlinepubs/009695399/functions/atan2.html
	//Volkan SALMA

	const ONEQTR_PI = Math.PI / 4.0
	const THRQTR_PI = (3.0 * Math.PI) / 4.0
	let r, angle
	let abs_y = Math.abs(y) + 1e-10 // kludge to prevent 0/0 condition
	if (x < 0.0) {
		r = (x + abs_y) / (abs_y - x)
		angle = THRQTR_PI
	} else {
		r = (x - abs_y) / (x + abs_y)
		angle = ONEQTR_PI
	}
	angle += (0.1963 * r * r - 0.9817) * r
	if (y < 0.0) return -angle
	// negate if in quad III or IV
	else return angle
}

// it is slower than Math.random() but matches wasm wersion
let seed = 123456789
function rand() {
	const m = 0x7fffffff
	const a = 48271
	const c = 0
	seed = (a * seed + c) % m
	return seed / m
}

/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * Adds r, g, and b (in the set [0, 255]) to RGB buffer at offset.
 *
 * @param   {number}  h       The hue
 * @param   {number}  s       The saturation
 * @param   {number}  l       The lightness
 * @param {Uint32Array} buf
 * @param {number}      offset
 */
function hslToRgb(h, s, l, buf, offset) {
	var r, g, b

	if (s == 0) {
		r = g = b = l // achromatic
	} else {
		var q = l < 0.5 ? l * (1 + s) : l + s - l * s
		var p = 2 * l - q
		r = hue2rgb(p, q, h + 1 / 3)
		g = hue2rgb(p, q, h)
		b = hue2rgb(p, q, h - 1 / 3)
	}

	// return [Math.floor(r * 255.999), Math.floor(g * 255.999), Math.floor(b * 255.999)]
	buf[offset + 0] += Math.floor(r * 255.999)
	buf[offset + 1] += Math.floor(g * 255.999)
	buf[offset + 2] += Math.floor(b * 255.999)
}
function hue2rgb(p, q, t) {
	if (t < 0) t += 1
	if (t > 1) t -= 1
	if (t < 1 / 6) return p + (q - p) * 6 * t
	if (t < 1 / 2) return q
	if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
	return p
}
