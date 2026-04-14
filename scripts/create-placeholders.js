import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.join(__dirname, '..', 'images');

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

const placeholders = ['gioconda.jpg', 'guernica.jpg', 'notte_stellata.jpg'];

placeholders.forEach(filename => {
  const filepath = path.join(imagesDir, filename);
  if (!fs.existsSync(filepath)) {
    // Crea un file vuoto come placeholder
    fs.writeFileSync(filepath, '');
    console.log(`Created placeholder: ${filename}`);
  }
});

console.log('✅ Placeholders created');