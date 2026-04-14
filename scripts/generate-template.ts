// scripts/generate-template.ts
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const artistsTemplate = [
  { 
    name: 'Leonardo da Vinci', 
    birth_year: 1452, 
    death_year: 1519, 
    nationality: 'Italiana', 
    biography: 'Pittore, scultore e inventore italiano del Rinascimento' 
  },
  { 
    name: 'Pablo Picasso', 
    birth_year: 1881, 
    death_year: 1973, 
    nationality: 'Spagnola', 
    biography: 'Pittore e scultore spagnolo, cofondatore del cubismo' 
  }
];

const artworksTemplate = [
  { 
    title: 'La Gioconda',
    artist_name: 'Leonardo da Vinci',
    category: 'Dipinti',
    year: 1503,
    technique: 'Olio su tavola',
    dimensions: '77 x 53 cm',
    estimated_value: 860000000,
    description: 'Ritratto di Lisa Gherardini',
    image_filename: 'gioconda.jpg'
  }
];

async function generateTemplates() {
  const projectRoot = path.join(__dirname, '..');
  const importDir = path.join(projectRoot, 'import');
  
  if (!fs.existsSync(importDir)) {
    fs.mkdirSync(importDir, { recursive: true });
  }

  // Excel template
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(artistsTemplate), 'Artists');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(artworksTemplate), 'Artworks');
  XLSX.writeFile(wb, path.join(importDir, 'template.xlsx'));

  // CSV templates
  const artistsCsv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(artistsTemplate));
  const artworksCsv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(artworksTemplate));
  
  fs.writeFileSync(path.join(importDir, 'artists.csv'), artistsCsv);
  fs.writeFileSync(path.join(importDir, 'artworks.csv'), artworksCsv);

  console.log('✅ Templates created:');
  console.log(`   ${path.join(importDir, 'template.xlsx')}`);
  console.log(`   ${path.join(importDir, 'artists.csv')}`);
  console.log(`   ${path.join(importDir, 'artworks.csv')}`);
}

generateTemplates();