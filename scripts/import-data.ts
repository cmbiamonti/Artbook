// scripts/import-data.ts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import initSqlJs from 'sql.js';
import type { Database as SqlJsDatabase } from 'sql.js';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

// ESM __dirname alternative
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ArtistCSV {
  name: string;
  birth_year?: string;
  death_year?: string;
  nationality?: string;
  biography?: string;
}

interface ArtworkCSV {
  title: string;
  artist_name?: string;
  category?: string;
  year?: string;
  technique?: string;
  dimensions?: string;
  estimated_value?: string;
  description?: string;
  image_filename?: string;
}

class DataImporter {
  private db: SqlJsDatabase | null = null;
  private dbPath: string;
  private SQL: any;
  private artistMap: Map<string, string> = new Map();

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  async init() {
    this.SQL = await initSqlJs();
    
    if (fs.existsSync(this.dbPath)) {
      const buffer = fs.readFileSync(this.dbPath);
      this.db = new this.SQL.Database(buffer);
      console.log('📂 Loaded existing database');
    } else {
      this.db = new this.SQL.Database();
      console.log('🆕 Created new database');
    }
    
    this.initDatabase();
  }

  private initDatabase() {
    if (!this.db) return;
    
    this.db.run(`
      CREATE TABLE IF NOT EXISTS artists (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        birth_year INTEGER,
        death_year INTEGER,
        nationality TEXT,
        biography TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      
      CREATE TABLE IF NOT EXISTS artworks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        artist_id TEXT,
        category TEXT NOT NULL,
        year INTEGER,
        technique TEXT,
        dimensions TEXT,
        estimated_value REAL,
        image_path TEXT,
        description TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE SET NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_artworks_artist ON artworks(artist_id);
      CREATE INDEX IF NOT EXISTS idx_artworks_category ON artworks(category);
    `);
    
    this.save();
  }

  private save() {
    if (!this.db) return;
    const data = this.db.export();
    const buffer = Buffer.from(data);
    
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(this.dbPath, buffer);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async importArtists(filePath: string): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    
    console.log(`\n📚 Importing artists from: ${filePath}`);
    
    const data = this.readFile<ArtistCSV>(filePath);
    let count = 0;

    for (const row of data) {
      if (!row.name || !row.name.trim()) continue;

      const id = this.generateId();
      
      try {
        this.db.run(`
          INSERT INTO artists (id, name, birth_year, death_year, nationality, biography, created_at)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        `, [
          id,
          row.name.trim(),
          row.birth_year ? parseInt(row.birth_year) : null,
          row.death_year ? parseInt(row.death_year) : null,
          row.nationality?.trim() || null,
          row.biography?.trim() || null
        ]);

        this.artistMap.set(row.name.trim(), id);
        count++;
        console.log(`  ✅ ${row.name}`);
      } catch (error) {
        console.error(`  ❌ Error importing artist "${row.name}":`, error);
      }
    }

    this.save();
    console.log(`\n✨ Imported ${count} artists`);
    return count;
  }

  async importArtworks(filePath: string, imagesDir?: string): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    
    console.log(`\n🎨 Importing artworks from: ${filePath}`);
    
    const data = this.readFile<ArtworkCSV>(filePath);
    let count = 0;

    for (const row of data) {
      if (!row.title || !row.title.trim()) continue;

      const id = this.generateId();
      let artistId: string | null = null;

      if (row.artist_name && row.artist_name.trim()) {
        const artistName = row.artist_name.trim();
        artistId = this.artistMap.get(artistName) || null;
        
        if (!artistId) {
          const stmt = this.db.prepare('SELECT id FROM artists WHERE name = ?');
          stmt.bind([artistName]);
          
          if (stmt.step()) {
            const result = stmt.getAsObject();
            artistId = result.id as string;
            this.artistMap.set(artistName, artistId);
          }
          stmt.free();
        }
        
        if (!artistId) {
          console.warn(`  ⚠️  Artist not found: ${artistName}`);
        }
      }

      let imagePath: string | null = null;
      if (row.image_filename && imagesDir) {
        const sourceImagePath = path.join(imagesDir, row.image_filename);
        if (fs.existsSync(sourceImagePath)) {
          imagePath = row.image_filename;
        } else {
          console.warn(`  ⚠️  Image not found: ${row.image_filename}`);
        }
      }

      try {
        this.db.run(`
          INSERT INTO artworks (
            id, title, artist_id, category, year, technique,
            dimensions, estimated_value, image_path, description,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `, [
          id,
          row.title.trim(),
          artistId,
          row.category?.trim() || 'Dipinti',
          row.year ? parseInt(row.year) : null,
          row.technique?.trim() || null,
          row.dimensions?.trim() || null,
          row.estimated_value ? parseFloat(row.estimated_value.replace(/[^0-9.-]/g, '')) : null,
          imagePath,
          row.description?.trim() || null
        ]);

        count++;
        const artistInfo = row.artist_name ? ` - ${row.artist_name}` : '';
        console.log(`  ✅ ${row.title}${artistInfo}`);
      } catch (error) {
        console.error(`  ❌ Error importing artwork "${row.title}":`, error);
      }
    }

    this.save();
    console.log(`\n✨ Imported ${count} artworks`);
    return count;
  }

  private readFile<T>(filePath: string): T[] {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.csv') {
      return this.readCSV<T>(filePath);
    } else if (ext === '.xlsx' || ext === '.xls') {
      return this.readExcel<T>(filePath);
    } else {
      throw new Error(`Unsupported file format: ${ext}. Use .csv, .xlsx, or .xls`);
    }
  }

  private readCSV<T>(filePath: string): T[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    const result = Papa.parse<T>(content, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase().replace(/ /g, '_'),
    });

    if (result.errors.length > 0) {
      console.warn('⚠️  CSV parsing warnings:', result.errors);
    }

    return result.data;
  }

  private readExcel<T>(filePath: string): T[] {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    const data = XLSX.utils.sheet_to_json<any>(sheet, {
      raw: false,
      defval: null,
      header: 1,
    });

    if (data.length === 0) return [];
    
    const headers = (data[0] as any[]).map((h: any) => 
      String(h).trim().toLowerCase().replace(/ /g, '_')
    );
    
    return data.slice(1).map((row: any) => {
      const obj: any = {};
      headers.forEach((header: string, index: number) => {
        obj[header] = row[index] || null;
      });
      return obj as T;
    });
  }

  getStats() {
    if (!this.db) return { artists: 0, artworks: 0, totalValue: 0 };

    try {
      const artistsResult = this.db.exec('SELECT COUNT(*) as count FROM artists');
      const artworksResult = this.db.exec('SELECT COUNT(*) as count FROM artworks');
      const totalValueResult = this.db.exec('SELECT COALESCE(SUM(estimated_value), 0) as total FROM artworks');

      return {
        artists: artistsResult[0]?.values[0]?.[0] as number || 0,
        artworks: artworksResult[0]?.values[0]?.[0] as number || 0,
        totalValue: totalValueResult[0]?.values[0]?.[0] as number || 0,
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return { artists: 0, artworks: 0, totalValue: 0 };
    }
  }

  listArtists(): void {
    if (!this.db) return;

    console.log('\n📋 Artists in database:');
    const stmt = this.db.prepare('SELECT name, birth_year, death_year FROM artists ORDER BY name');
    
    let count = 0;
    while (stmt.step()) {
      const row = stmt.getAsObject();
      const years = row.birth_year ? `(${row.birth_year}${row.death_year ? `-${row.death_year}` : ''})` : '';
      console.log(`  • ${row.name} ${years}`);
      count++;
    }
    stmt.free();
    
    if (count === 0) {
      console.log('  (nessun artista presente)');
    }
  }

  close() {
    if (this.db) {
      this.save();
      this.db.close();
    }
  }
}

async function main() {
  console.log('🚀 ArtBook Data Importer\n');

  const projectRoot = path.join(__dirname, '..');
  const dbPath = path.join(projectRoot, 'data', 'artbook.db');
  const artistsFile = path.join(projectRoot, 'import', 'artists.csv');
  const artworksFile = path.join(projectRoot, 'import', 'artworks.csv');
  const imagesDir = path.join(projectRoot, 'images');

  const importer = new DataImporter(dbPath);

  try {
    await importer.init();

    if (fs.existsSync(artistsFile)) {
      await importer.importArtists(artistsFile);
    } else {
      console.log(`⚠️  Artists file not found: ${artistsFile}`);
      console.log('   Create this file to import artists');
    }

    importer.listArtists();

    if (fs.existsSync(artworksFile)) {
      await importer.importArtworks(artworksFile, imagesDir);
    } else {
      console.log(`\n⚠️  Artworks file not found: ${artworksFile}`);
      console.log('   Create this file to import artworks');
    }

    const stats = importer.getStats();
    console.log('\n📊 Database Statistics:');
    console.log(`   Artists:  ${stats.artists}`);
    console.log(`   Artworks: ${stats.artworks}`);
    console.log(`   Total Value: €${stats.totalValue.toLocaleString('it-IT')}`);
    
  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  } finally {
    importer.close();
  }

  console.log('\n✅ Import completed successfully!\n');
}

main();