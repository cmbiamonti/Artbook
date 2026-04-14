import { app, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

export class FileSystemManager {
  private imagesPath: string;
  
  constructor(customDataPath?: string) {
    let imagesDir: string;
    
    if (customDataPath) {
      imagesDir = path.join(customDataPath, 'images');
    } else {
      imagesDir = path.join(app.getPath('userData'), 'images');
    }
    
    console.log('📸 IMAGES INITIALIZATION:', imagesDir);
    
    try {
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true, mode: 0o777 });
      }
      
      const testFile = path.join(imagesDir, '.write-test');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      console.log('✅ Write permissions verified');
      
    } catch (error) {
      console.error('❌ CRITICAL:', error);
      throw error;
    }
    
    this.imagesPath = imagesDir;
  }
  
  async saveImage(buffer: ArrayBuffer, originalFilename: string): Promise<string> {
    try {
      const ext = path.extname(originalFilename) || '.jpg';
      const hash = crypto.createHash('md5').update(Buffer.from(buffer)).digest('hex');
      const filename = `${Date.now()}-${hash.substring(0, 8)}${ext}`;
      const filepath = path.join(this.imagesPath, filename);
      
      fs.writeFileSync(filepath, Buffer.from(buffer), { mode: 0o666 });
      
      if (!fs.existsSync(filepath)) {
        throw new Error('Image file not created!');
      }
      
      console.log(`✅ Image saved: ${filename}`);
      return filename;
    } catch (error) {
      console.error('❌ Image save failed:', error);
      throw error;
    }
  }

  async importImage(externalPath: string): Promise<string> {
    if (!fs.existsSync(externalPath)) {
      throw new Error(`File not found: ${externalPath}`);
    }

    const buffer = fs.readFileSync(externalPath);
    const filename = path.basename(externalPath);
    
    return await this.saveImage(buffer.buffer, filename);
  }
  
  getImagePath(filename: string): string {
    const filepath = path.join(this.imagesPath, filename);
    
    if (!fs.existsSync(filepath)) {
      throw new Error(`Image not found: ${filename}`);
    }
    
    // ✅ SOLUZIONE DEFINITIVA: Data URL
    const buffer = fs.readFileSync(filepath);
    const ext = path.extname(filename).toLowerCase();
    
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp'
    };
    
    const mimeType = mimeTypes[ext] || 'image/jpeg';
    const base64 = buffer.toString('base64');
    
    return `data:${mimeType};base64,${base64}`;
  }
  
  async deleteImage(filename: string): Promise<void> {
    const filepath = path.join(this.imagesPath, filename);
    
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      console.log('🗑️ Deleted:', filename);
    }
  }
  
  getImagesDirectory(): string {
    return this.imagesPath;
  }
  
  listImages(): string[] {
    if (!fs.existsSync(this.imagesPath)) {
      return [];
    }
    return fs.readdirSync(this.imagesPath).filter(f => !f.startsWith('.'));
  }
}