// Kopiert HTML, CSS und das Icon nach dist/, damit Electron sie findet.
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const copies = [
  ['src/renderer/index.html', 'dist/renderer/index.html'],
  ['src/renderer/style.css', 'dist/renderer/style.css'],
  ['build/icon.png', 'dist/icon.png'],
  // Lizenztext für die Lizenzseite im Windows-Installer (electron-builder nimmt build/license.txt automatisch)
  ['LICENSE', 'build/license.txt'],
];

for (const [from, to] of copies) {
  const target = path.join(root, to);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(root, from), target);
}
console.log('Statische Dateien kopiert.');
