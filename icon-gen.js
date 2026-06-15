/**
 * HealthVault PWA Icon Generator
 * Run: node icon-gen.js
 * Requires: sharp  (npm install sharp --save-dev)
 *
 * Produces:
 *   public/icons/icon-{size}x{size}.png          — purpose: any
 *   public/icons/icon-maskable-{size}x{size}.png — purpose: maskable
 *                                                   (logo at 80 % with #1A3C34 background
 *                                                    so the "safe zone" is respected on all
 *                                                    platforms that clip to a circle/squircle)
 */

import sharp from 'sharp';
import fs   from 'node:fs';
import path from 'node:path';

// ── SVG source ────────────────────────────────────────────────────────────────
const SVG_SOURCE = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" fill="#1A3C34"/>
  <path d="M50 10L15 30v40l35 20 35-20V30L50 10z"
        stroke="#5A8A72" stroke-width="3" fill="none"/>
  <path d="M50 35v30M35 50h30"
        stroke="#FFFFFF" stroke-width="5" stroke-linecap="round"/>
</svg>`;

/**
 * Maskable icon: logo placed at 80 % scale centred on #1A3C34 background.
 * The W3C safe zone is a circle inscribed at 80 % of the icon diameter,
 * so the 10 % padding on each side keeps the logo fully visible on every
 * platform regardless of clipping shape.
 */
function maskableSvg(size) {
  const padding = Math.round(size * 0.10);           // 10 % each side
  const logoSize = size - padding * 2;               // 80 % of canvas
  return `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#1A3C34"/>
  <image
    href="data:image/svg+xml;base64,${Buffer.from(SVG_SOURCE).toString('base64')}"
    x="${padding}" y="${padding}"
    width="${logoSize}" height="${logoSize}"
  />
</svg>`;
}

// ── Sizes ─────────────────────────────────────────────────────────────────────
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const MASKABLE_SIZES = [192, 512];   // only the two required by the spec

// ── Output dir ────────────────────────────────────────────────────────────────
const OUT = path.resolve('public/icons');
fs.mkdirSync(OUT, { recursive: true });

// ── Generate ──────────────────────────────────────────────────────────────────
async function generate() {
  const svgBuf = Buffer.from(SVG_SOURCE);

  // purpose: any
  await Promise.all(
    SIZES.map(size =>
      sharp(svgBuf)
        .resize(size, size)
        .png()
        .toFile(path.join(OUT, `icon-${size}x${size}.png`))
        .then(() => console.log(`✓  icon-${size}x${size}.png`))
    )
  );

  // purpose: maskable
  await Promise.all(
    MASKABLE_SIZES.map(size => {
      const buf = Buffer.from(maskableSvg(size));
      return sharp(buf)
        .resize(size, size)
        .png()
        .toFile(path.join(OUT, `icon-maskable-${size}x${size}.png`))
        .then(() => console.log(`✓  icon-maskable-${size}x${size}.png`));
    })
  );

  console.log('\nAll icons written to public/icons/');
}

generate().catch(err => { console.error(err); process.exit(1); });
