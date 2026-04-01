import fs from 'fs/promises'
import path from 'path'
import { Jimp } from 'jimp'
import { Resvg, initWasm } from '@resvg/resvg-wasm'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

const PROJECT_ROOT = process.cwd()
const IMGS_DIR = path.resolve(PROJECT_ROOT, 'imgs')
const OUTPUT_FILE = path.resolve(PROJECT_ROOT, 'src/generated/imagePng64Map.ts')
const IMG_MAX_SIZE = [72, 58]

async function ensureDir(dir) {
	await fs.mkdir(dir, { recursive: true })
}

async function walk(dir) {
	const entries = await fs.readdir(dir, { withFileTypes: true })
	const files = []

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name)
		if (entry.isDirectory()) {
			files.push(...(await walk(fullPath)))
		} else {
			files.push(fullPath)
		}
	}

	return files
}

async function initResvg() {
	const wasmPath = require.resolve('@resvg/resvg-wasm/index_bg.wasm')
	const wasmBinary = await fs.readFile(wasmPath)
	await initWasm(wasmBinary)
}

async function svgFileToPng64(svgPath) {
	const svgBuffer = await fs.readFile(svgPath)

	const resvg = new Resvg(svgBuffer, {
		fitTo: {
			mode: 'original',
		},
	})

	const renderedPng = Buffer.from(resvg.render().asPng())

	const image = await Jimp.read(renderedPng)
	image.contain({ w: IMG_MAX_SIZE[0], h: IMG_MAX_SIZE[1] })

	const finalPngBuffer = await image.getBuffer('image/png')
	return finalPngBuffer.toString('base64')
}

function makeKeyFromSvgPath(svgPath) {
	const relativeFromProject = path.relative(PROJECT_ROOT, svgPath)
	return relativeFromProject
		.replace(/\\/g, '/')
		.replace(/\.svg$/i, '')
}

async function main() {
	await initResvg()

	const allFiles = await walk(IMGS_DIR)
	const svgFiles = allFiles.filter((file) => file.toLowerCase().endsWith('.svg'))

	const imageMap = {}

	for (const svgFile of svgFiles) {
		const key = makeKeyFromSvgPath(svgFile)
		imageMap[key] = await svgFileToPng64(svgFile)
		console.log(`Generated ${key}`)
	}

	const output = `/* auto-generated file: do not edit manually */
export const GENERATED_IMAGE_PNG64_MAP: Record<string, string> = ${JSON.stringify(imageMap, null, 2)} as const;
`

	await ensureDir(path.dirname(OUTPUT_FILE))
	await fs.writeFile(OUTPUT_FILE, output, 'utf8')
	console.log(`Wrote ${OUTPUT_FILE}`)
}

main().catch((err) => {
	console.error(err)
	process.exit(1)
})