import { copyFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, '..');

copyFileSync(
  path.resolve(frontendRoot, 'public/logo.webp'),
  path.resolve(frontendRoot, 'public/favicon.webp')
);
