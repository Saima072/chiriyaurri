#!/usr/bin/env node
// Renders resources/*.svg into every icon/splash file the Capacitor Android
// and iOS platforms expect, at their exact required pixel dimensions.
//
// Why not @capacitor/assets (the official generator)? It depends on sharp,
// which needs a prebuilt native binary from GitHub releases — unavailable
// in some sandboxed/offline CI environments. This script only needs
// Playwright (`npx playwright install chromium` once), which is already a
// project devDependency, and renders each SVG at each target size directly
// so quality stays crisp — no upscale/downscale generation pass.
//
// Run after editing the SVGs in resources/: npm run mobile:assets

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const res = (rel) => path.join(REPO, rel);

// The headless browser has no Glacial Indifference installed; embed the
// app's own woff2 as a data URI so rendered splash text matches the app.
const fontB64 = fs
  .readFileSync(path.join(REPO, 'public/fonts/glacial-indifference-700.woff2'))
  .toString('base64');
const fontFace = `@font-face{font-family:'Glacial Indifference';font-weight:700;src:url(data:font/woff2;base64,${fontB64}) format('woff2')}`;

async function renderSvgToPng(browser, svgPath, width, height, outPath, transparent = false) {
  const svg = fs.readFileSync(svgPath, 'utf8');
  const page = await browser.newPage({ viewport: { width, height } });
  await page.setContent(
    `<!doctype html><meta charset="utf-8"><style>${fontFace}
      html,body{margin:0;padding:0;width:${width}px;height:${height}px;overflow:hidden;background:${transparent ? 'transparent' : '#fff'}}
      svg{display:block;width:${width}px;height:${height}px}
    </style>${svg}`
  );
  await page.evaluate(() => document.fonts.ready);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await page.screenshot({ path: outPath, omitBackground: transparent });
  await page.close();
}

/** Apple's App Store Connect rejects app icons that carry an alpha channel
 *  at all, even fully opaque ones — strip it from the 1024 marketing icon. */
function stripAlpha(pngPath) {
  const src = PNG.sync.read(fs.readFileSync(pngPath));
  const out = new PNG({ width: src.width, height: src.height });
  out.data = Buffer.from(src.data);
  fs.writeFileSync(pngPath, PNG.sync.write(out, { colorType: 2 }));
}

// Most setups just need `npx playwright install chromium` once and can
// launch with no options. PLAYWRIGHT_CHROMIUM_PATH is an escape hatch for
// environments with a browser pre-installed at a nonstandard path.
const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
    : {}
);

const androidRes = (rel) => res(`android/app/src/main/res/${rel}`);

// ── Android legacy launcher icon (flat, opaque) — used pre-Android-8 ──
const legacySizes = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
for (const [density, size] of Object.entries(legacySizes)) {
  await renderSvgToPng(browser, res('resources/icon-source.svg'), size, size,
    androidRes(`mipmap-${density}/ic_launcher.png`));
  await renderSvgToPng(browser, res('resources/icon-round.svg'), size, size,
    androidRes(`mipmap-${density}/ic_launcher_round.png`));
}

// ── Android adaptive icon foreground layer (transparent bg, glyph only) ──
const foregroundSizes = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };
for (const [density, size] of Object.entries(foregroundSizes)) {
  await renderSvgToPng(browser, res('resources/icon-foreground.svg'), size, size,
    androidRes(`mipmap-${density}/ic_launcher_foreground.png`), true);
}

// ── Android splash screen, per density, portrait + landscape ──
const portraitSizes = {
  mdpi: [320, 480], hdpi: [480, 800], xhdpi: [720, 1280], xxhdpi: [960, 1600], xxxhdpi: [1280, 1920],
};
const landscapeSizes = {
  mdpi: [480, 320], hdpi: [800, 480], xhdpi: [1280, 720], xxhdpi: [1600, 960], xxxhdpi: [1920, 1280],
};
for (const [density, [w, h]] of Object.entries(portraitSizes)) {
  await renderSvgToPng(browser, res('resources/splash-source.svg'), w, h,
    androidRes(`drawable-port-${density}/splash.png`));
}
for (const [density, [w, h]] of Object.entries(landscapeSizes)) {
  await renderSvgToPng(browser, res('resources/splash-source.svg'), w, h,
    androidRes(`drawable-land-${density}/splash.png`));
}
await renderSvgToPng(browser, res('resources/splash-source.svg'), 480, 320,
  androidRes('drawable/splash.png'));

// ── iOS app icon: single 1024x1024 "universal" slot (Xcode 14+) ──
const iosIcon = res('ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png');
await renderSvgToPng(browser, res('resources/icon-source.svg'), 1024, 1024, iosIcon);
stripAlpha(iosIcon);

// ── iOS splash: one 2732x2732 image reused for all three scale entries ──
const iosSplashDir = res('ios/App/App/Assets.xcassets/Splash.imageset');
for (const name of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) {
  await renderSvgToPng(browser, res('resources/splash-source.svg'), 2732, 2732,
    path.join(iosSplashDir, name));
}

await browser.close();
console.log('Mobile icons and splash screens regenerated from resources/*.svg');
