import { contextBridge, ipcRenderer } from 'electron';

console.log('🚀 ═══════════════════════════════════════');
console.log('🚀 PRELOAD SCRIPT STARTING...');
console.log('🚀 ═══════════════════════════════════════');

const electronAPI = {

  // ── Artworks ────────────────────────────────────────────────────────────────
  getArtworks: (filters?: any) => {
    console.log('📡 IPC: getArtworks called');
    return ipcRenderer.invoke('db:getArtworks', filters);
  },
  getArtwork: (id: string) => {
    console.log('📡 IPC: getArtwork called:', id);
    return ipcRenderer.invoke('db:getArtwork', id);
  },
  createArtwork: (data: any) => {
    console.log('📡 IPC: createArtwork called:', data);
    return ipcRenderer.invoke('db:createArtwork', data);
  },
  updateArtwork: (id: string, data: any) => {
    console.log('📡 IPC: updateArtwork called:', id);
    return ipcRenderer.invoke('db:updateArtwork', id, data);
  },
  deleteArtwork: (id: string) => {
    console.log('📡 IPC: deleteArtwork called:', id);
    return ipcRenderer.invoke('db:deleteArtwork', id);
  },

  // ── Artists ─────────────────────────────────────────────────────────────────
  getArtists: () => {
    console.log('📡 IPC: getArtists called');
    return ipcRenderer.invoke('db:getArtists');
  },
  getArtist: (id: string) => {
    console.log('📡 IPC: getArtist called:', id);
    return ipcRenderer.invoke('db:getArtist', id);
  },
  createArtist: (data: any) => {
    console.log('📡 IPC: createArtist called:', data);
    return ipcRenderer.invoke('db:createArtist', data);
  },
  updateArtist: (id: string, data: any) => {
    console.log('📡 IPC: updateArtist called:', id);
    return ipcRenderer.invoke('db:updateArtist', id, data);
  },
  deleteArtist: (id: string) => {
    console.log('📡 IPC: deleteArtist called:', id);
    return ipcRenderer.invoke('db:deleteArtist', id);
  },

  // ── Images ──────────────────────────────────────────────────────────────────
  saveImage: (buffer: ArrayBuffer, filename: string) => {
    console.log('📡 IPC: saveImage called:', filename);
    return ipcRenderer.invoke('fs:saveImage', buffer, filename);
  },
  getImagePath: (filename: string) => {
    console.log('📡 IPC: getImagePath called:', filename);
    return ipcRenderer.invoke('fs:getImagePath', filename);
  },
  deleteImage: (filename: string) => {
    console.log('📡 IPC: deleteImage called:', filename);
    return ipcRenderer.invoke('fs:deleteImage', filename);
  },
  selectImage: () => {
    console.log('📡 IPC: selectImage called');
    return ipcRenderer.invoke('fs:selectImage');
  },

  // ── Galleria immagini ────────────────────────────────────────────────────────
  getArtworkImages: (artworkId: string) => {
    console.log('📡 IPC: getArtworkImages called:', artworkId);
    return ipcRenderer.invoke('db:getArtworkImages', artworkId);
  },
  addArtworkImage: (artworkId: string, imagePath: string, isPrimary: boolean) => {
    console.log('📡 IPC: addArtworkImage called:', artworkId, imagePath);
    return ipcRenderer.invoke('db:addArtworkImage', artworkId, imagePath, isPrimary);
  },
  deleteArtworkImage: (imageId: string, imagePath: string) => {
    console.log('📡 IPC: deleteArtworkImage called:', imageId);
    return ipcRenderer.invoke('db:deleteArtworkImage', imageId, imagePath);
  },
  setArtworkImageAsPrimary: (imageId: string, artworkId: string) => {
    console.log('📡 IPC: setArtworkImageAsPrimary called:', imageId);
    return ipcRenderer.invoke('db:setArtworkImageAsPrimary', imageId, artworkId);
  },
  updateArtworkImagesOrder: (images: Array<{ id: string; order: number }>) => {
    console.log('📡 IPC: updateArtworkImagesOrder called');
    return ipcRenderer.invoke('db:updateArtworkImagesOrder', images);
  },

  // ── Export ───────────────────────────────────────────────────────────────────
  exportToPDF: (artworkId: string) => {
    console.log('📡 IPC: exportToPDF called:', artworkId);
    return ipcRenderer.invoke('export:pdf', artworkId);
  },
  exportAllToExcel: () => {
    console.log('📡 IPC: exportAllToExcel called');
    return ipcRenderer.invoke('export:excel');
  },

  // ── System ───────────────────────────────────────────────────────────────────
  getAppPath: () => {
    console.log('📡 IPC: getAppPath called');
    return ipcRenderer.invoke('system:getAppPath');
  },
  openExternal: (url: string) => {
    console.log('📡 IPC: openExternal called:', url);
    return ipcRenderer.invoke('system:openExternal', url);
  },
  getStats: () => {
    console.log('📡 IPC: getStats called');
    return ipcRenderer.invoke('system:getStats');
  },
  importCSV: () => {
    console.log('📡 IPC: importCSV called');
    return ipcRenderer.invoke('csv:import');
  },
  getDataInfo: () => {
    console.log('📡 IPC: getDataInfo called');
    return ipcRenderer.invoke('system:getDataInfo');
  },
  openDataFolder: () => {
    console.log('📡 IPC: openDataFolder called');
    return ipcRenderer.invoke('system:openDataFolder');
  },

  // ── Logo personalizzato PDF ──────────────────────────────────────────────────
  // ✅ I nomi corrispondono ESATTAMENTE agli ipcMain.handle in main.ts
  getCustomLogo: () => {
    console.log('📡 IPC: getCustomLogo called');
    return ipcRenderer.invoke('get-custom-logo');   // ← 'get-custom-logo'
  },
  saveCustomLogo: (base64: string) => {
    console.log('📡 IPC: saveCustomLogo called');
    return ipcRenderer.invoke('save-custom-logo', base64); // ← 'save-custom-logo'
  },
  deleteCustomLogo: () => {
    console.log('📡 IPC: deleteCustomLogo called');
    return ipcRenderer.invoke('delete-custom-logo'); // ← 'delete-custom-logo'
  },
};

try {
  console.log('🔌 Exposing electronAPI to window...');
  contextBridge.exposeInMainWorld('electronAPI', electronAPI);
  contextBridge.exposeInMainWorld('isElectron', true);
  console.log('✅ electronAPI exposed successfully!');
  console.log('✅ Available methods:', Object.keys(electronAPI));
  console.log('✅ Total methods:', Object.keys(electronAPI).length);
} catch (error) {
  console.error('❌ CRITICAL: Failed to expose electronAPI:', error);
}

console.log('🚀 ═══════════════════════════════════════');
console.log('🚀 PRELOAD SCRIPT COMPLETED');
console.log('🚀 ═══════════════════════════════════════');