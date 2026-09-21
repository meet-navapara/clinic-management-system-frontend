import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import { copyFileSync } from 'fs';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../website-logo');
const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public');

async function makeTransparent(srcName, outName, opts = {}) {
  const src = path.join(dir, srcName);
  const out = path.join(dir, outName);
  const img = sharp(src).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const thr = opts.threshold ?? 28;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r <= thr && g <= thr && b <= thr) data[i + 3] = 0;
  }
  let pipeline = sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  });
  if (opts.trim !== false) pipeline = pipeline.trim({ threshold: 8 });
  await pipeline.png().toFile(out);
  console.log('wrote', outName, info.width + 'x' + info.height);
  return out;
}

const clear = await makeTransparent('Z-Health-logo.png', 'Z-Health-logo-clear.png');
const mark = await makeTransparent('logo.webp', 'Z-Health-mark-clear.png');

// Prefer clear lockup as main brand asset
copyFileSync(clear, path.join(dir, 'Z-Health-logo.png'));
copyFileSync(mark, path.join(publicDir, 'logo.webp'));
copyFileSync(mark, path.join(publicDir, 'favicon.webp'));
console.log('synced branding assets');
