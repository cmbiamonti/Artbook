// src/types/window.d.ts

export interface ElectronAPI {
  // Artworks
  getArtworks: (filters?: any) => Promise<{ success: boolean; data?: any[]; error?: string }>;
  getArtwork: (id: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  createArtwork: (data: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  updateArtwork: (id: string, data: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  deleteArtwork: (id: string) => Promise<{ success: boolean; error?: string }>;
  
  // Artists
  getArtists: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
  getArtist: (id: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  createArtist: (data: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  updateArtist: (id: string, data: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  deleteArtist: (id: string) => Promise<{ success: boolean; error?: string }>;
  
  // Images
  saveImage: (buffer: ArrayBuffer, filename: string) => Promise<{ success: boolean; data?: string; error?: string }>;
  getImagePath: (filename: string) => Promise<{ success: boolean; data?: string; error?: string }>;
  deleteImage: (filename: string) => Promise<{ success: boolean; error?: string }>;
  selectImage: () => Promise<{ success: boolean; data?: string; error?: string }>;
  
  // Export
  exportToPDF: (artworkId: string) => Promise<{ success: boolean; error?: string }>;
  exportAllToExcel: () => Promise<{ success: boolean; error?: string }>;
  
  // System
  getAppPath: () => Promise<{ success: boolean; data?: string; error?: string }>;
  openExternal: (url: string) => Promise<{ success: boolean; error?: string }>;
  getStats: () => Promise<{ success: boolean; data?: any; error?: string }>;
  importCSV: () => Promise<{ success: boolean; data?: string; error?: string }>;
  getDataInfo: () => Promise<{ success: boolean; data?: any; error?: string }>;
  openDataFolder: () => Promise<{ success: boolean; error?: string }>;
  
  // Galleria
  getArtworkImages: (artworkId: string) => Promise<{
    success: boolean;
    data?: Array<{
      id: string;
      artwork_id: string;
      image_path: string;
      display_order: number;
      is_primary: number;
      created_at: string;
    }>;
    error?: string;
  }>;
  addArtworkImage: (artworkId: string, imagePath: string, isPrimary: boolean) => 
    Promise<{ success: boolean; error?: string }>;
  deleteArtworkImage: (imageId: string, imagePath: string) => 
    Promise<{ success: boolean; error?: string }>;
  setArtworkImageAsPrimary: (imageId: string, artworkId: string) => 
    Promise<{ success: boolean; error?: string }>;
  updateArtworkImagesOrder: (images: Array<{ id: string; order: number }>) => 
    Promise<{ success: boolean; error?: string }>;
}
declare global {
  interface Window {
    electronAPI: ElectronAPI;
    isElectron: boolean;
  }
}

export {};