// Renders static/icons/icon.svg to the PNG sizes the web manifest, iOS and
// browsers ask for. Run `pnpm icons` after editing the SVG and commit the PNGs.
// Uses the Playwright Chromium the tests already need, so it adds no dependency.
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const svg = await readFile(new URL('../static/icons/icon.svg', import.meta.url), 'utf8');

// Launchers crop maskable icons (and iOS rounds apple-touch-icon) themselves, so
// those get square corners and the card shrunk well inside the 80% safe circle.
const maskableSvg = svg
	.replace('rx="112"', 'rx="0"')
	.replace(
		'<g transform="rotate(-6 256 256)">',
		'<g transform="translate(256 256) scale(0.9) translate(-256 -256) rotate(-6 256 256)">'
	);
if (maskableSvg === svg) throw new Error('icon.svg no longer matches the maskable rewrite');

const outputs = [
	{ file: 'static/icons/icon-192.png', size: 192, source: svg },
	{ file: 'static/icons/icon-512.png', size: 512, source: svg },
	{ file: 'static/icons/maskable-192.png', size: 192, source: maskableSvg },
	{ file: 'static/icons/maskable-512.png', size: 512, source: maskableSvg },
	{ file: 'static/icons/apple-touch-icon.png', size: 180, source: maskableSvg },
	{ file: 'static/favicon.png', size: 64, source: svg }
];

const browser = await chromium.launch();
try {
	const page = await browser.newPage();
	for (const { file, size, source } of outputs) {
		await page.setViewportSize({ width: size, height: size });
		const src = `data:image/svg+xml;base64,${Buffer.from(source).toString('base64')}`;
		await page.setContent(
			`<body style="margin:0"><img src="${src}" style="display:block;width:${size}px;height:${size}px"></body>`
		);
		await page.screenshot({ path: file, omitBackground: true });
		console.log(`wrote ${file}`);
	}
} finally {
	await browser.close();
}
