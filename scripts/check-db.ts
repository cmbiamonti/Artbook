import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import initSqlJs from 'sql.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkDatabase() {
  const dbPath = path.join(__dirname, '..', 'data', 'artbook.db');
  
  if (!fs.existsSync(dbPath)) {
    console.log('❌ Database not found at:', dbPath);
    console.log('\nRun: npm run import');
    return;
  }
  
  console.log('✅ Database found\n');
  
  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(buffer);
  
  // Count artists
  const artistsResult = db.exec('SELECT COUNT(*) as count FROM artists');
  const artistsCount = artistsResult[0]?.values[0]?.[0] || 0;
  console.log(`👥 Artists: ${artistsCount}`);
  
  // List artists
  if (artistsCount > 0) {
    const artists = db.exec('SELECT name FROM artists LIMIT 5');
    console.log('\nArtists:');
    artists[0]?.values.forEach((row: any) => {
      console.log(`  - ${row[0]}`);
    });
  }
  
  // Count artworks
  const artworksResult = db.exec('SELECT COUNT(*) as count FROM artworks');
  const artworksCount = artworksResult[0]?.values[0]?.[0] || 0;
  console.log(`\n🎨 Artworks: ${artworksCount}`);
  
  // List artworks
  if (artworksCount > 0) {
    const artworks = db.exec('SELECT title, category FROM artworks LIMIT 5');
    console.log('\nArtworks:');
    artworks[0]?.values.forEach((row: any) => {
      console.log(`  - ${row[0]} (${row[1]})`);
    });
  }
  
  db.close();
}

checkDatabase();