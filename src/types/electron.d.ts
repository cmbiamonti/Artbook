// src/types/electron.d.ts

export interface IpcResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ElectronAPI {
  // ── Artworks ────────────────────────────────────────────────────────────────
  getArtworks:    (filters?: any) => Promise<IpcResponse<any[]>>;
  getArtwork:     (id: string)    => Promise<IpcResponse<any>>;
  createArtwork:  (data: any)     => Promise<IpcResponse<any>>;
  updateArtwork:  (id: string, data: any) => Promise<IpcResponse<any>>;
  deleteArtwork:  (id: string)    => Promise<IpcResponse<void>>;

  // ── Artists ─────────────────────────────────────────────────────────────────
  getArtists:    ()               => Promise<IpcResponse<any[]>>;
  getArtist:     (id: string)     => Promise<IpcResponse<any>>;
  createArtist:  (data: any)      => Promise<IpcResponse<any>>;
  updateArtist:  (id: string, data: any) => Promise<IpcResponse<any>>;
  deleteArtist:  (id: string)     => Promise<IpcResponse<void>>;

  // ── Images ──────────────────────────────────────────────────────────────────
  saveImage:     (buffer: ArrayBuffer, filename: string) => Promise<IpcResponse<string>>;
  getImagePath:  (filename: string) => Promise<IpcResponse<string>>;
  deleteImage:   (filename: string) => Promise<IpcResponse<void>>;
  selectImage:   ()                 => Promise<IpcResponse<string>>;

  // ── Galleria immagini ────────────────────────────────────────────────────────
  getArtworkImages:          (artworkId: string)                              => Promise<IpcResponse<any[]>>;
  addArtworkImage:           (artworkId: string, imagePath: string, isPrimary: boolean) => Promise<IpcResponse<void>>;
  deleteArtworkImage:        (imageId: string, imagePath: string)             => Promise<IpcResponse<void>>;
  setArtworkImageAsPrimary:  (imageId: string, artworkId: string)             => Promise<IpcResponse<void>>;
  updateArtworkImagesOrder:  (images: Array<{ id: string; order: number }>)   => Promise<IpcResponse<void>>;

  // ── Export ───────────────────────────────────────────────────────────────────
  exportToPDF:       (artworkId: string) => Promise<IpcResponse<void>>;
  exportAllToExcel:  ()                  => Promise<IpcResponse<void>>;

  // ── System ───────────────────────────────────────────────────────────────────
  getAppPath:     ()             => Promise<IpcResponse<string>>;
  openExternal:   (url: string)  => Promise<IpcResponse<void>>;
  getStats:       ()             => Promise<IpcResponse<any>>;
  importCSV:      ()             => Promise<IpcResponse<string>>;
  getDataInfo:    ()             => Promise<IpcResponse<any>>;
  openDataFolder: ()             => Promise<IpcResponse<void>>;

  // ── Logo personalizzato PDF ──────────────────────────────────────────────────
  getCustomLogo:    ()                => Promise<IpcResponse<string>>;
  saveCustomLogo:   (base64: string)  => Promise<IpcResponse<void>>;
  deleteCustomLogo: ()                => Promise<IpcResponse<void>>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    isElectron:  boolean;
  }
}

export {};