import { copyFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, '..');
const LOGO_FILE = 'logo(1).webp';
const sourceLogo = path.resolve(frontendRoot, 'website-logo', LOGO_FILE);

const publicTargets = [
  path.resolve(frontendRoot, 'public/logo.webp'),
  path.resolve(frontendRoot, 'public/favicon.webp'),
];

for (const target of publicTargets) {
  copyFileSync(sourceLogo, target);
}
