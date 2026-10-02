import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const startupDir = path.join(os.homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
const batSource = path.join(projectRoot, 'start-auto.bat');
const batDest = path.join(startupDir, 'KaushalSaathi-AutoStart.bat');

try {
  if (!fs.existsSync(startupDir)) fs.mkdirSync(startupDir, { recursive: true });
  fs.copyFileSync(batSource, batDest);
  console.log(`Auto-start installed: ${batDest}`);
  console.log('App will run automatically on every Windows login.');
} catch (e) {
  console.error('Auto-start install failed. Copy start-auto.bat manually to:', startupDir);
  console.error(e.message);
}
