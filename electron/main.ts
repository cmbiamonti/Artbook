import { app, BrowserWindow, ipcMain, shell, dialog, protocol } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { ArtBookDatabase } from './database';
import { FileSystemManager } from './fileSystem';
import type { 
  CreateArtworkData, 
  UpdateArtworkData, 
  CreateArtistData, 
  UpdateArtistData, 
  ArtworkFilters 
} from './types';

let mainWindow: BrowserWindow | null = null;
let database: ArtBookDatabase;
let fileSystem: FileSystemManager;

const isDev = !app.isPackaged;

function logDebug(...args: any[]) {
  console.log('[Main]', new Date().toISOString(), ...args);
}

function getDataPath(): string {
  if (isDev) {
    const devPath = app.getPath('userData');
    logDebug('📁 [DEV] Using userData:', devPath);
    return devPath;
  } else {
    const exePath = process.execPath;
    const installDir = path.dirname(exePath);
    const dataPath = path.join(installDir, 'ArtBookData');
    
    logDebug('📁 PRODUCTION DATA PATH:', dataPath);
    
    if (!fs.existsSync(dataPath)) {
      try {
        fs.mkdirSync(dataPath, { recursive: true });
        logDebug('✅ ArtBookData directory created');
      } catch (error) {
        dialog.showErrorBox(
          'ERRORE CRITICO',
          `Impossibile creare cartella dati:\n${dataPath}\n\nErrore: ${(error as Error).message}`
        );
        app.quit();
        process.exit(1);
      }
    }
    
    return dataPath;
  }
}

function findPreloadPath(): string {
  logDebug('🔍 SEARCHING FOR PRELOAD SCRIPT');
  
  const possiblePaths = [
    path.join(__dirname, 'preload.js'),
    path.join(app.getAppPath(), 'dist-electron', 'preload.js'),
    path.join(process.cwd(), 'dist-electron', 'preload.js'),
    path.join(process.resourcesPath, 'app.asar.unpacked', 'dist-electron', 'preload.js'),
    path.join(process.resourcesPath, 'app', 'dist-electron', 'preload.js'),
    path.join(__dirname, '..', 'preload.js'),
  ];

  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      logDebug('✅ PRELOAD FOUND:', testPath);
      return testPath;
    }
  }

  dialog.showErrorBox(
    'ERRORE CRITICO - Preload Script Mancante',
    'Impossibile trovare preload.js\n\nReinstalla l\'applicazione.'
  );

  app.quit();
  process.exit(1);
}

async function createWindow() {
  logDebug('=== CREATING WINDOW ===');
  
  const preloadPath = findPreloadPath();
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // ✅ Disabilita per permettere artbook-img://
    },
    autoHideMenuBar: true,
    backgroundColor: '#ffffff',
    show: false,
    title: 'ArtBook'
  });

  mainWindow.webContents.on('console-message', (_event, level, message) => {
    const levels = ['LOG', 'INFO', 'WARNING', 'ERROR'];
    logDebug(`[Renderer ${levels[level]}]`, message);
  });

  mainWindow.once('ready-to-show', () => {
    logDebug('✅ Window ready to show');
    mainWindow?.show();
  });

  if (isDev) {
    logDebug('🔧 Development mode');
    
    try {
      await mainWindow.loadURL('http://localhost:5173');
      mainWindow.webContents.openDevTools();
    } catch (error) {
      logDebug('❌ Failed to load Vite dev server:', error);
      dialog.showErrorBox(
        'Errore',
        'Impossibile connettersi al server di sviluppo.\n\nAssicurati che Vite sia avviato (npm run dev).'
      );
      app.quit();
    }
  } else {
    logDebug('📦 Production mode');
    
    const distPath = path.join(__dirname, '../dist');
    const indexPath = path.join(distPath, 'index.html');
    
    if (fs.existsSync(indexPath)) {
      const fileUrl = `file://${indexPath.replace(/\\/g, '/')}`;
      await mainWindow.loadURL(fileUrl);
    } else {
      dialog.showErrorBox(
        'Errore - File Mancanti',
        `index.html non trovato in:\n${indexPath}\n\nReinstalla l'applicazione.`
      );
      app.quit();
    }
  }
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ✅ REGISTRA PROTOCOL **PRIMA** DI app.whenReady()
app.on('ready', () => {
  logDebug('🚀 App ready - registering protocol...');
  
  protocol.registerFileProtocol('artbook-img', (request, callback) => {
    const url = request.url.replace('artbook-img://', '');
    const imagePath = decodeURIComponent(url);
    
    logDebug('📸 Protocol handler serving:', imagePath);
    
    if (!fs.existsSync(imagePath)) {
      logDebug('❌ Image not found:', imagePath);
      callback({ error: -6 }); // FILE_NOT_FOUND
      return;
    }
    
    callback({ path: imagePath });
  });
  
  logDebug('✅ Protocol artbook-img:// registered');
});

// ==================== APP LIFECYCLE ====================

app.whenReady().then(async () => {
  logDebug('🚀 ArtBook Starting...');
  
  try {
    const dataPath = getDataPath();
    logDebug('📁 Data path:', dataPath);

    database = new ArtBookDatabase(dataPath);
    await database.init();
    logDebug('✅ Database initialized');
    
    fileSystem = new FileSystemManager(dataPath);
    logDebug('✅ FileSystem initialized');
    
    registerIpcHandlers();
    logDebug('✅ IPC handlers registered');
    
    await createWindow();
    logDebug('✅ Window created');
    
    logDebug('🎉 ArtBook Started Successfully!');
  } catch (error) {
    logDebug('❌ FATAL ERROR:', error);
    dialog.showErrorBox('Errore Fatale', `${(error as Error).message}`);
    app.quit();
  }
});

let isQuitting = false;

app.on('before-quit', (event) => {
  if (!isQuitting) {
    isQuitting = true;
    event.preventDefault();
    
    setTimeout(() => {
      try {
        if (database) {
          database.save();
          database.close();
        }
      } catch (err) {
        logDebug('⚠️ Error during quit:', err);
      } finally {
        app.exit(0);
      }
    }, 100);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ==================== PASSWORD ====================

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function getSettingsPath(): string {
  return path.join(getDataPath(), 'settings.json');
}

// ==================== IPC HANDLERS ====================

function registerIpcHandlers() {
  logDebug('📡 Registering IPC handlers...');
  
  // ========== AUTH ==========
  
  ipcMain.handle('auth:checkPassword', async (_event, password: string) => {
    try {
      const settingsPath = getSettingsPath();
      
      if (!fs.existsSync(settingsPath)) {
        const defaultPassword = hashPassword('admin');
        fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
        fs.writeFileSync(settingsPath, JSON.stringify({ passwordHash: defaultPassword }));
      }
      
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      const inputHash = hashPassword(password);
      
      return { success: inputHash === settings.passwordHash };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
  
  ipcMain.handle('auth:changePassword', async (_event, oldPassword: string, newPassword: string) => {
    try {
      const settingsPath = getSettingsPath();
      
      if (!fs.existsSync(settingsPath)) {
        return { success: false, error: 'Settings file not found' };
      }
      
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      const oldHash = hashPassword(oldPassword);
      
      if (oldHash !== settings.passwordHash) {
        return { success: false, error: 'Password corrente non corretta' };
      }
      
      settings.passwordHash = hashPassword(newPassword);
      fs.writeFileSync(settingsPath, JSON.stringify(settings));
      
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
  
  // ========== User's Logo ==========

  const LOGO_DIR      = path.join(getDataPath(), 'logo');
  const LOGO_FILENAME = 'custom-logo.png';
  const LOGO_PATH     = path.join(LOGO_DIR, LOGO_FILENAME);

  logDebug('📁 Logo dir configurata:', LOGO_DIR);

  ipcMain.handle('save-custom-logo', async (_event, base64Data: string) => {
    logDebug('📡 save-custom-logo chiamato');
    logDebug('📁 LOGO_DIR:', LOGO_DIR);
    logDebug('📁 LOGO_PATH:', LOGO_PATH);
    logDebug('📦 base64Data lunghezza:', base64Data?.length ?? 'undefined');

    try {
      // Crea la cartella se non esiste
      if (!fs.existsSync(LOGO_DIR)) {
        logDebug('📁 Cartella logo non esiste, la creo...');
        fs.mkdirSync(LOGO_DIR, { recursive: true });
        logDebug('✅ Cartella logo creata:', LOGO_DIR);
      } else {
        logDebug('✅ Cartella logo già esistente');
      }

      // Rimuove il prefisso data URL se presente
      // Esempio: "data:image/png;base64,iVBORw0..." → "iVBORw0..."
      const base64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
      logDebug('📦 base64 pulito lunghezza:', base64.length);

      const buffer = Buffer.from(base64, 'base64');
      logDebug('📦 Buffer size:', buffer.length, 'bytes');

      fs.writeFileSync(LOGO_PATH, buffer);
      logDebug('✅ Logo salvato in:', LOGO_PATH);

      // Verifica che il file esista davvero
      const exists = fs.existsSync(LOGO_PATH);
      const size   = exists ? fs.statSync(LOGO_PATH).size : 0;
      logDebug('✅ Verifica file:', exists ? `OK (${size} bytes)` : 'ERRORE - file non trovato!');

      return { success: true };
    } catch (error: any) {
      logDebug('❌ Errore save-custom-logo:', error.message);
      logDebug('❌ Stack:', error.stack);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-custom-logo', async () => {
    logDebug('📡 get-custom-logo chiamato');
    logDebug('📁 Cerco logo in:', LOGO_PATH);

    try {
      if (!fs.existsSync(LOGO_PATH)) {
        logDebug('ℹ️ Nessun logo personalizzato trovato');
        return { success: false };
      }

      const buffer   = fs.readFileSync(LOGO_PATH);
      const base64   = buffer.toString('base64');
      const ext      = path.extname(LOGO_PATH).replace('.', '').toLowerCase();
      const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
                    : ext === 'png'  ? 'image/png'
                    : ext === 'webp' ? 'image/webp'
                    : 'image/png';

      logDebug('✅ Logo trovato:', LOGO_PATH, `(${buffer.length} bytes, ${mimeType})`);
      return { success: true, data: `data:${mimeType};base64,${base64}` };
    } catch (error: any) {
      logDebug('❌ Errore get-custom-logo:', error.message);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-custom-logo', async () => {
    logDebug('📡 delete-custom-logo chiamato');

    try {
      if (fs.existsSync(LOGO_PATH)) {
        fs.unlinkSync(LOGO_PATH);
        logDebug('✅ Logo eliminato:', LOGO_PATH);
      } else {
        logDebug('ℹ️ Nessun logo da eliminare');
      }
      return { success: true };
    } catch (error: any) {
      logDebug('❌ Errore delete-custom-logo:', error.message);
      return { success: false, error: error.message };
    }
  });

  // ========== CSV ==========
  
  ipcMain.handle('csv:import', async () => {
    try {
      const result = await dialog.showOpenDialog(mainWindow!, {
        title: 'Seleziona file CSV',
        filters: [{ name: 'CSV Files', extensions: ['csv'] }],
        properties: ['openFile']
      });
      
      if (result.canceled || !result.filePaths.length) {
        return { success: false, error: 'Nessun file selezionato' };
      }
      
      const csvContent = fs.readFileSync(result.filePaths[0], 'utf-8');
      return { success: true, data: csvContent };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // ========== IMAGES ==========
  
  ipcMain.handle('fs:selectImage', async () => {
    try {
      const result = await dialog.showOpenDialog(mainWindow!, {
        title: 'Seleziona Immagine',
        filters: [{ name: 'Immagini', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] }],
        properties: ['openFile']
      });

      if (result.canceled || !result.filePaths.length) {
        return { success: false, error: 'Nessuna immagine selezionata' };
      }

      const savedFilename = await fileSystem.importImage(result.filePaths[0]);
      return { success: true, data: savedFilename };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('fs:saveImage', async (_event, buffer: ArrayBuffer, filename: string) => {
    try {
      const savedFilename = await fileSystem.saveImage(buffer, filename);
      return { success: true, data: savedFilename };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
  
  ipcMain.handle('fs:getImagePath', async (_event, filename: string) => {
    try {
      const imagePath = fileSystem.getImagePath(filename);
      return { success: true, data: imagePath };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
  
  ipcMain.handle('fs:deleteImage', async (_event, filename: string) => {
    try {
      await fileSystem.deleteImage(filename);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // ========== SYSTEM ==========
  
  ipcMain.handle('system:getDataInfo', () => {
    try {
      const dataPath = getDataPath();
      const dbPath = database.getDatabasePath();
      const imagesPath = fileSystem.getImagesDirectory();
      
      return {
        success: true,
        data: {
          dataPath,
          databasePath: dbPath,
          imagesPath,
          databaseSize: fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0,
          imagesCount: fileSystem.listImages().length,
          isPortable: !isDev && dataPath.includes(path.dirname(process.execPath))
        }
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('system:openDataFolder', async () => {
    try {
      await shell.openPath(getDataPath());
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
  
  ipcMain.handle('system:getAppPath', async () => {
    try {
      const appPath = app.isPackaged ? path.dirname(process.execPath) : app.getAppPath();
      return { success: true, data: appPath };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
  
  ipcMain.handle('system:openExternal', async (_event, url: string) => {
    try {
      await shell.openExternal(url);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
  
  ipcMain.handle('system:getStats', async () => {
    try {
      const stats = database.getStats();
      return { success: true, data: stats };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
  
  // ========== ARTWORKS ==========
  
  ipcMain.handle('db:getArtworks', async (_event, filters?: ArtworkFilters) => {
    try {
      const artworks = database.getArtworks(filters);
      return { success: true, data: artworks };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
  
  ipcMain.handle('db:getArtwork', async (_event, id: string) => {
    try {
      const artwork = database.getArtwork(id);
      return { success: true, data: artwork };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
  
  ipcMain.handle('db:createArtwork', async (_event, data: CreateArtworkData) => {
    try {
      const artwork = database.createArtwork(data);
      return { success: true, data: artwork };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
  
  ipcMain.handle('db:updateArtwork', async (_event, id: string, data: UpdateArtworkData) => {
    try {
      const artwork = database.updateArtwork(id, data);
      return { success: true, data: artwork };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('db:deleteArtwork', async (_event, id: string) => {
    try {
      const images = database.getArtworkImages(id);
      for (const image of images) {
        try {
          await fileSystem.deleteImage(image.image_path);
        } catch (err) {
          logDebug('⚠️ Could not delete image:', err);
        }
      }
      
      database.deleteArtwork(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // ========== GALLERIA IMMAGINI ==========
  
  ipcMain.handle('db:getArtworkImages', async (_event, artworkId: string) => {
    try {
      const images = database.getArtworkImages(artworkId);
      return { success: true, data: images };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('db:addArtworkImage', async (_event, artworkId: string, imagePath: string, isPrimary: boolean) => {
    try {
      database.addArtworkImage(artworkId, imagePath, isPrimary);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('db:deleteArtworkImage', async (_event, imageId: string, imagePath: string) => {
    try {
      try {
        await fileSystem.deleteImage(imagePath);
      } catch (err) {
        logDebug('⚠️ Could not delete image file:', err);
      }
      
      database.deleteArtworkImage(imageId);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('db:setArtworkImageAsPrimary', async (_event, imageId: string, artworkId: string) => {
    try {
      database.setArtworkImageAsPrimary(imageId, artworkId);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('db:updateArtworkImagesOrder', async (_event, images: Array<{ id: string; order: number }>) => {
    try {
      database.updateArtworkImagesOrder(images);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
  
  // ========== ARTISTS ==========
  
  ipcMain.handle('db:getArtists', async () => {
    try {
      const artists = database.getArtists();
      return { success: true, data: artists };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
  
  ipcMain.handle('db:getArtist', async (_event, id: string) => {
    try {
      const artist = database.getArtist(id);
      return { success: true, data: artist };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
  
  ipcMain.handle('db:createArtist', async (_event, data: CreateArtistData) => {
    try {
      const artist = database.createArtist(data);
      return { success: true, data: artist };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
  
  ipcMain.handle('db:updateArtist', async (_event, id: string, data: UpdateArtistData) => {
    try {
      const artist = database.updateArtist(id, data);
      return { success: true, data: artist };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
  
  ipcMain.handle('db:deleteArtist', async (_event, id: string) => {
    try {
      database.deleteArtist(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  logDebug('✅ IPC handlers registered');
}