import { copyFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, '..');
const markPng = path.resolve(frontendRoot, 'website-logo/Z-Health-mark-clear.png');

await sharp(markPng).webp({ quality: 90 }).toFile(path.resolve(frontendRoot, 'public/logo.webp'));
await sharp(markPng).resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp({ quality: 90 }).toFile(path.resolve(frontendRoot, 'public/favicon.webp'));
copyFileSync(markPng, path.resolve(frontendRoot, 'public/logo.png'));
console.log('Synced transparent logo + favicon');
