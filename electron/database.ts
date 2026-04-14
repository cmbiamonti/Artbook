import initSqlJs from 'sql.js';
import type { Database as SqlJsDatabase } from 'sql.js';
import { app, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

import type { 
  Artwork, 
  Artist, 
  ArtworkImage,
  CreateArtworkData, 
  UpdateArtworkData, 
  CreateArtistData,
  UpdateArtistData,
  ArtworkFilters 
} from './types';

export class ArtBookDatabase {
  private db: SqlJsDatabase | null = null;
  private dbPath: string;
  private SQL: any;
  private isClosing: boolean = false;
  
  constructor(dataPath?: string) {
    let dbDirectory: string;
    
    if (dataPath) {
      dbDirectory = dataPath;
    } else {
      const userDataPath = app.getPath('userData');
      dbDirectory = path.join(userDataPath, 'database');
    }
    
    try {
      if (!fs.existsSync(dbDirectory)) {
        fs.mkdirSync(dbDirectory, { recursive: true });
      }
      
      const testFile = path.join(dbDirectory, '.write-test-' + Date.now());
      fs.writeFileSync(testFile, 'test-content');
      
      if (!fs.existsSync(testFile) || fs.readFileSync(testFile, 'utf-8') !== 'test-content') {
        throw new Error('Write test failed');
      }
      
      fs.unlinkSync(testFile);
      
    } catch (error) {
      dialog.showErrorBox(
        'ERRORE CRITICO - Impossibile Inizializzare Database',
        `La directory per il database non può essere utilizzata.\n\n` +
        `Percorso: ${dbDirectory}\n\n` +
        `Errore: ${(error as Error).message}\n\n` +
        `SOLUZIONI:\n` +
        `1. Esegui come amministratore\n` +
        `2. Reinstalla in un'altra cartella\n` +
        `3. Verifica permessi della cartella`
      );
      
      app.quit();
      throw error;
    }
    
    this.dbPath = path.join(dbDirectory, 'artbook.db');
  }

  private ensureDb(): SqlJsDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db;
  }
  
  async init() {
    try {
      console.log('🚀 Initializing sql.js...');
      this.SQL = await initSqlJs();
      console.log('✅ sql.js initialized');
      
      if (fs.existsSync(this.dbPath)) {
        console.log('📂 Loading existing database...');
        const buffer = fs.readFileSync(this.dbPath);
        this.db = new this.SQL.Database(buffer);
        
        const db = this.ensureDb();
        
        this.ensureGalleryTable(db);
        await this.migrateDatabase(db);
        
        const countResult = db.exec('SELECT COUNT(*) FROM artworks');
        const count = countResult[0]?.values[0]?.[0] || 0;
        console.log(`✅ Database loaded - ${count} artworks`);
      } else {
        console.log('🆕 Creating new database...');
        this.db = new this.SQL.Database();
        this.initDatabase();
        this.save();
        console.log('✅ New database created');
      }
    } catch (error) {
      console.error('❌ CRITICAL: Database initialization failed:', error);
      
      dialog.showErrorBox(
        'Errore Inizializzazione Database',
        `Impossibile inizializzare il database:\n\n${(error as Error).message}\n\nPath: ${this.dbPath}`
      );
      
      throw error;
    }
  }

  private ensureGalleryTable(db: SqlJsDatabase) {
    try {
      const tableCheck = db.exec(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='artwork_images'
      `);
      
      if (tableCheck.length === 0 || tableCheck[0].values.length === 0) {
        console.log('⚠️ artwork_images table missing, creating...');
        
        db.run(`
          CREATE TABLE IF NOT EXISTS artwork_images (
            id TEXT PRIMARY KEY,
            artwork_id TEXT NOT NULL,
            image_path TEXT NOT NULL,
            display_order INTEGER NOT NULL DEFAULT 0,
            is_primary INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE
          )
        `);
        
        db.run(`
          CREATE INDEX IF NOT EXISTS idx_artwork_images_artwork 
          ON artwork_images(artwork_id)
        `);
        
        this.save();
        console.log('✅ artwork_images table created');
      }
    } catch (error) {
      console.error('❌ Error ensuring gallery table:', error);
    }
  }

  private async migrateDatabase(db: SqlJsDatabase) {
    console.log('🔄 Checking database schema...');

    const newColumns = [
      'subcategory TEXT',
      'catalog_number TEXT',
      'certificate_authenticity TEXT',
      'certificate_number TEXT',
      'artist_signature TEXT',
      'condition_state TEXT',
      'edition_number TEXT',
      'current_location TEXT',
      'location_details TEXT',
      'insurance_value REAL',
      'insurance_company TEXT',
      'insurance_expiry TEXT',
      'frame_included TEXT',
      'frame_description TEXT',
      'purchase_price REAL',
      'purchase_date TEXT',
      'seller_gallery TEXT',
      'provenance TEXT',
      'available_for_sale TEXT',
      'asking_price REAL'
    ];

    for (const columnDef of newColumns) {
      const columnName = columnDef.split(' ')[0];
      
      try {
        db.exec(`SELECT ${columnName} FROM artworks LIMIT 1`);
      } catch (error) {
        console.log(`⚠️ Column ${columnName} missing, adding...`);
        
        try {
          db.run(`ALTER TABLE artworks ADD COLUMN ${columnDef}`);
          console.log(`✅ Column ${columnName} added`);
        } catch (alterError) {
          console.error(`❌ Failed to add column ${columnName}:`, alterError);
        }
      }
    }

    this.save();
    console.log('✅ Database migration completed');
  }
  
  private initDatabase() {
    const db = this.ensureDb();
    
    console.log('🏗️ Creating database schema...');
    
    db.run(`
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
        subcategory TEXT,
        year INTEGER,
        technique TEXT,
        dimensions TEXT,
        estimated_value REAL,
        image_path TEXT,
        description TEXT,
        
        catalog_number TEXT,
        certificate_authenticity TEXT,
        certificate_number TEXT,
        artist_signature TEXT,
        condition_state TEXT,
        edition_number TEXT,
        
        current_location TEXT,
        location_details TEXT,
        insurance_value REAL,
        insurance_company TEXT,
        insurance_expiry TEXT,
        frame_included TEXT,
        frame_description TEXT,
        
        purchase_price REAL,
        purchase_date TEXT,
        seller_gallery TEXT,
        provenance TEXT,
        available_for_sale TEXT,
        asking_price REAL,
        
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE SET NULL
      );
      
      CREATE TABLE IF NOT EXISTS artwork_images (
        id TEXT PRIMARY KEY,
        artwork_id TEXT NOT NULL,
        image_path TEXT NOT NULL,
        display_order INTEGER NOT NULL DEFAULT 0,
        is_primary INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_artworks_artist ON artworks(artist_id);
      CREATE INDEX IF NOT EXISTS idx_artworks_category ON artworks(category);
      CREATE INDEX IF NOT EXISTS idx_artworks_year ON artworks(year);
      CREATE INDEX IF NOT EXISTS idx_artwork_images_artwork ON artwork_images(artwork_id);
    `);
    
    console.log('✅ Database schema created');
  }
  
  public save() {
    if (!this.db) {
      return;
    }
    
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(this.dbPath, buffer, { 
        mode: 0o666,
        flag: 'w'
      });
      
      if (!fs.existsSync(this.dbPath)) {
        throw new Error('Database file not found after write!');
      }
      
    } catch (error) {
      if (!this.isClosing) {
        dialog.showErrorBox(
          'ERRORE - Salvataggio Database Fallito',
          `Il database NON è stato salvato!\n\n` +
          `Path: ${this.dbPath}\n\n` +
          `Errore: ${(error as Error).message}`
        );
        throw error;
      }
    }
  }
  
  getArtworks(filters?: ArtworkFilters): Artwork[] {
    const db = this.ensureDb();
    
    // ✅ Query semplice senza DISTINCT (non dovrebbero esserci duplicati reali)
    let query = `
      SELECT a.*, ar.name as artist_name 
      FROM artworks a
      LEFT JOIN artists ar ON a.artist_id = ar.id
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (filters?.search) {
      query += ` AND (a.title LIKE ? OR ar.name LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }
    
    if (filters?.artist_id) {
      query += ` AND a.artist_id = ?`;
      params.push(filters.artist_id);
    }
    
    if (filters?.category) {
      query += ` AND a.category = ?`;
      params.push(filters.category);
    }
    
    if (filters?.subcategory) {
      query += ` AND a.subcategory = ?`;
      params.push(filters.subcategory);
    }
    
    if (filters?.year_from) {
      query += ` AND a.year >= ?`;
      params.push(filters.year_from);
    }
    
    if (filters?.year_to) {
      query += ` AND a.year <= ?`;
      params.push(filters.year_to);
    }
    
    query += ` ORDER BY a.created_at DESC`;
    
    try {
      const stmt = db.prepare(query);
      stmt.bind(params);
      
      const results: Artwork[] = [];
      
      while (stmt.step()) {
        const artwork = stmt.getAsObject() as unknown as Artwork;
        results.push(artwork);
      }
      stmt.free();
      
      console.log(`📚 getArtworks: returned ${results.length} artworks`);
      
      // ✅ DEBUG: Verifica duplicati
      const ids = results.map(a => a.id);
      const uniqueIds = new Set(ids);
      if (ids.length !== uniqueIds.size) {
        console.warn(`⚠️ WARNING: Found ${ids.length - uniqueIds.size} duplicate IDs in results!`);
        console.warn('Duplicate IDs:', ids.filter((id, index) => ids.indexOf(id) !== index));
      }
      
      return results;
    } catch (error) {
      console.error('❌ Error getting artworks:', error);
      return [];
    }
  }
  
  getArtwork(id: string): Artwork | null {
    const db = this.ensureDb();
    
    try {
      const stmt = db.prepare(`
        SELECT a.*, ar.name as artist_name 
        FROM artworks a
        LEFT JOIN artists ar ON a.artist_id = ar.id
        WHERE a.id = ?
      `);
      stmt.bind([id]);
      
      if (stmt.step()) {
        const result = stmt.getAsObject() as unknown as Artwork;
        stmt.free();
        return result;
      }
      
      stmt.free();
      return null;
    } catch (error) {
      console.error('Error getting artwork:', error);
      return null;
    }
  }
  
  createArtwork(data: CreateArtworkData): Artwork {
    const db = this.ensureDb();
    
    const id = this.generateId();
    const now = new Date().toISOString();
    
    console.log('═══════════════════════════════════════');
    console.log('➕ CREATE ARTWORK');
    console.log('  ID:', id);
    console.log('  Title:', data.title);
    console.log('═══════════════════════════════════════');
    
    try {
      db.run(`
        INSERT INTO artworks (
          id, title, artist_id, category, subcategory, year, technique, 
          dimensions, estimated_value, image_path, description,
          catalog_number, certificate_authenticity, certificate_number,
          artist_signature, condition_state, edition_number,
          current_location, location_details, insurance_value,
          insurance_company, insurance_expiry, frame_included, frame_description,
          purchase_price, purchase_date, seller_gallery, provenance,
          available_for_sale, asking_price,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, 
        data.title, 
        data.artist_id || null, 
        data.category,
        data.subcategory || null,
        data.year || null, 
        data.technique || null, 
        data.dimensions || null,
        data.estimated_value || null, 
        data.image_path || null,
        data.description || null,
        
        data.catalog_number || null,
        data.certificate_authenticity || null,
        data.certificate_number || null,
        data.artist_signature || null,
        data.condition_state || null,
        data.edition_number || null,
        
        data.current_location || null,
        data.location_details || null,
        data.insurance_value || null,
        data.insurance_company || null,
        data.insurance_expiry || null,
        data.frame_included || null,
        data.frame_description || null,
        
        data.purchase_price || null,
        data.purchase_date || null,
        data.seller_gallery || null,
        data.provenance || null,
        data.available_for_sale || null,
        data.asking_price || null,
        
        now, 
        now
      ]);
      
      this.save();
      
      // ✅ VERIFICA CHE SIA STATO INSERITO UNA SOLA VOLTA
      const checkStmt = db.prepare('SELECT COUNT(*) as count FROM artworks WHERE id = ?');
      checkStmt.bind([id]);
      checkStmt.step();
      const insertCount = checkStmt.getAsObject().count as number;
      checkStmt.free();
      
      if (insertCount !== 1) {
        console.error(`❌ CRITICAL: Artwork inserted ${insertCount} times!`);
        throw new Error(`Duplicate insert detected: ${insertCount} rows`);
      }
      
      const artwork = this.getArtwork(id);
      if (!artwork) throw new Error('Failed to retrieve created artwork');
      
      console.log('✅ Artwork created successfully');
      console.log('═══════════════════════════════════════');
      
      return artwork;
    } catch (error) {
      console.error('❌ Error creating artwork:', error);
      throw error;
    }
  }
  
  updateArtwork(id: string, data: UpdateArtworkData): Artwork {
    const db = this.ensureDb();
    
    const updates: string[] = [];
    const params: any[] = [];
    
    const fieldMapping: Record<string, string> = {
      'title': 'title',
      'artist_id': 'artist_id',
      'category': 'category',
      'subcategory': 'subcategory',
      'year': 'year',
      'technique': 'technique',
      'dimensions': 'dimensions',
      'estimated_value': 'estimated_value',
      'description': 'description',
      'image_path': 'image_path',
      
      'catalog_number': 'catalog_number',
      'certificate_authenticity': 'certificate_authenticity',
      'certificate_number': 'certificate_number',
      'artist_signature': 'artist_signature',
      'condition_state': 'condition_state',
      'edition_number': 'edition_number',
      
      'current_location': 'current_location',
      'location_details': 'location_details',
      'insurance_value': 'insurance_value',
      'insurance_company': 'insurance_company',
      'insurance_expiry': 'insurance_expiry',
      'frame_included': 'frame_included',
      'frame_description': 'frame_description',
      
      'purchase_price': 'purchase_price',
      'purchase_date': 'purchase_date',
      'seller_gallery': 'seller_gallery',
      'provenance': 'provenance',
      'available_for_sale': 'available_for_sale',
      'asking_price': 'asking_price'
    };
    
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'imageFile') return;
      
      if (fieldMapping[key] && value !== undefined) {
        updates.push(`${fieldMapping[key]} = ?`);
        params.push(value === '' ? null : value);
      }
    });
    
    if (updates.length === 0) {
      const artwork = this.getArtwork(id);
      if (!artwork) throw new Error('Artwork not found');
      return artwork;
    }
    
    updates.push('updated_at = ?');
    params.push(new Date().toISOString(), id);
    
    try {
      db.run(`UPDATE artworks SET ${updates.join(', ')} WHERE id = ?`, params);
      this.save();
    } catch (error) {
      console.error('❌ Error updating artwork:', error);
      throw error;
    }
    
    const artwork = this.getArtwork(id);
    if (!artwork) throw new Error('Artwork not found after update');
    return artwork;
  }
  
  deleteArtwork(id: string): void {
    const db = this.ensureDb();
    
    try {
      db.run('DELETE FROM artwork_images WHERE artwork_id = ?', [id]);
      db.run('DELETE FROM artworks WHERE id = ?', [id]);
      this.save();
    } catch (error) {
      console.error('Error deleting artwork:', error);
      throw error;
    }
  }
  
  // ==================== GALLERIA ====================

  getArtworkImages(artworkId: string): ArtworkImage[] {
    const db = this.ensureDb();
    
    try {
      const stmt = db.prepare(`
        SELECT * FROM artwork_images 
        WHERE artwork_id = ? 
        ORDER BY display_order ASC, created_at ASC
      `);
      stmt.bind([artworkId]);
      
      const results: ArtworkImage[] = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject() as unknown as ArtworkImage);
      }
      stmt.free();
      
      console.log(`📸 Found ${results.length} images for artwork ${artworkId}`);
      return results;
    } catch (error) {
      console.error('❌ Error getting artwork images:', error);
      return [];
    }
  }

  addArtworkImage(artworkId: string, imagePath: string, isPrimary: boolean = false): void {
    const db = this.ensureDb();
    
    const id = this.generateId();
    const now = new Date().toISOString();
    
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM artwork_images WHERE artwork_id = ?');
    countStmt.bind([artworkId]);
    countStmt.step();
    const count = countStmt.getAsObject().count as number;
    countStmt.free();
    
    try {
      db.run(`
        INSERT INTO artwork_images (id, artwork_id, image_path, display_order, is_primary, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [id, artworkId, imagePath, count, isPrimary ? 1 : 0, now]);
      
      this.save();
      console.log('✅ Artwork image added:', imagePath);
    } catch (error) {
      console.error('❌ Error adding artwork image:', error);
      throw error;
    }
  }

  deleteArtworkImage(imageId: string): void {
    const db = this.ensureDb();
    
    try {
      db.run('DELETE FROM artwork_images WHERE id = ?', [imageId]);
      this.save();
    } catch (error) {
      console.error('❌ Error deleting artwork image:', error);
      throw error;
    }
  }

  setArtworkImageAsPrimary(imageId: string, artworkId: string): void {
    const db = this.ensureDb();
    
    try {
      db.run('UPDATE artwork_images SET is_primary = 0 WHERE artwork_id = ?', [artworkId]);
      db.run('UPDATE artwork_images SET is_primary = 1 WHERE id = ?', [imageId]);
      this.save();
    } catch (error) {
      console.error('❌ Error setting primary image:', error);
      throw error;
    }
  }

  updateArtworkImagesOrder(images: Array<{ id: string; order: number }>): void {
    const db = this.ensureDb();
    
    try {
      for (const img of images) {
        db.run('UPDATE artwork_images SET display_order = ? WHERE id = ?', [img.order, img.id]);
      }
      this.save();
    } catch (error) {
      console.error('❌ Error updating images order:', error);
      throw error;
    }
  }

  // ==================== ARTISTS ====================

  getArtists(): Artist[] {
    const db = this.ensureDb();
    
    try {
      const stmt = db.prepare('SELECT * FROM artists ORDER BY name');
      const results: Artist[] = [];
      
      while (stmt.step()) {
        results.push(stmt.getAsObject() as unknown as Artist);
      }
      stmt.free();
      
      return results;
    } catch (error) {
      console.error('Error getting artists:', error);
      return [];
    }
  }
  
  getArtist(id: string): Artist | null {
    const db = this.ensureDb();
    
    try {
      const stmt = db.prepare('SELECT * FROM artists WHERE id = ?');
      stmt.bind([id]);
      
      if (stmt.step()) {
        const result = stmt.getAsObject() as unknown as Artist;
        stmt.free();
        return result;
      }
      stmt.free();
      return null;
    } catch (error) {
      console.error('Error getting artist:', error);
      return null;
    }
  }
  
  createArtist(data: CreateArtistData): Artist {
    const db = this.ensureDb();
    
    const id = this.generateId();
    const now = new Date().toISOString();
    
    try {
      db.run(`
        INSERT INTO artists (id, name, birth_year, death_year, nationality, biography, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        id, data.name, data.birth_year || null, data.death_year || null,
        data.nationality || null, data.biography || null, now
      ]);
      
      this.save();
      
      const artist = this.getArtist(id);
      if (!artist) throw new Error('Failed to retrieve created artist');
      
      return artist;
    } catch (error) {
      console.error('Error creating artist:', error);
      throw error;
    }
  }
  
  updateArtist(id: string, data: UpdateArtistData): Artist {
    const db = this.ensureDb();
    
    const updates: string[] = [];
    const params: any[] = [];
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = ?`);
        params.push(value);
      }
    });
    
    if (updates.length > 0) {
      params.push(id);
      
      try {
        db.run(`UPDATE artists SET ${updates.join(', ')} WHERE id = ?`, params);
        this.save();
      } catch (error) {
        console.error('Error updating artist:', error);
        throw error;
      }
    }
    
    const artist = this.getArtist(id);
    if (!artist) throw new Error('Artist not found after update');
    return artist;
  }
  
  deleteArtist(id: string): void {
    const db = this.ensureDb();
    
    try {
      db.run('DELETE FROM artists WHERE id = ?', [id]);
      this.save();
    } catch (error) {
      console.error('Error deleting artist:', error);
      throw error;
    }
  }
  
  // ==================== UTILITIES ====================
  
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  close() {
    this.isClosing = true;
    
    if (this.db) {
      try {
        this.save();
        this.db.close();
      } catch (error) {
        console.error('Error closing database:', error);
      }
    }
  }
  
  getStats() {
    const db = this.ensureDb();
    
    try {
      const artworksResult = db.exec('SELECT COUNT(*) FROM artworks');
      const artistsResult = db.exec('SELECT COUNT(*) FROM artists');
      const totalValueResult = db.exec('SELECT COALESCE(SUM(estimated_value), 0) FROM artworks');
      
      return {
        artworks: artworksResult[0]?.values[0]?.[0] as number || 0,
        artists: artistsResult[0]?.values[0]?.[0] as number || 0,
        totalValue: totalValueResult[0]?.values[0]?.[0] as number || 0
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return { artworks: 0, artists: 0, totalValue: 0 };
    }
  }
  
  getDatabasePath(): string {
    return this.dbPath;
  }

  getDataDirectory(): string {
    return path.dirname(this.dbPath);
  }
}