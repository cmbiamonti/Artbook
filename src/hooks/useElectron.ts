import { useCallback } from 'react';
// ✅ AGGIUNTO: import i18n per usare t() fuori dai componenti React
import i18n from '../i18n';
import type { 
  Artist, 
  Artwork, 
  ArtworkFilters, 
  CreateArtistData, 
  UpdateArtistData,
  CreateArtworkData,
  UpdateArtworkData
} from '@/types/artwork.types';

export function useElectronAPI() {
  const checkAPI = useCallback(() => {
    if (!window.electronAPI) {
      console.error('❌ Electron API not available!');
      // ✅ CORRETTO: stringa tecnica interna, lasciata in inglese (non è UI)
      throw new Error('Electron API not available');
    }
  }, []);

  return {
    // ==================== ARTWORKS ====================
    
    getArtworks: useCallback(async (filters?: ArtworkFilters): Promise<Artwork[]> => {
      console.log('📡 useElectronAPI.getArtworks - filters:', filters);
      checkAPI();
      
      const response = await window.electronAPI.getArtworks(filters);
      console.log('📤 getArtworks response:', response);
      
      if (!response.success) {
        console.error('❌ getArtworks failed:', response.error);
        throw new Error(response.error);
      }
      
      console.log(`✅ getArtworks: ${response.data?.length || 0} artworks`);
      return response.data || [];
    }, [checkAPI]),

    getArtwork: useCallback(async (id: string): Promise<Artwork | null> => {
      console.log('📡 useElectronAPI.getArtwork - id:', id);
      checkAPI();
      
      const response = await window.electronAPI.getArtwork(id);
      console.log('📤 getArtwork response:', response);
      
      if (!response.success) {
        console.error('❌ getArtwork failed:', response.error);
        throw new Error(response.error);
      }
      
      return response.data || null;
    }, [checkAPI]),

    createArtwork: useCallback(async (data: CreateArtworkData): Promise<Artwork> => {
      console.log('═══════════════════════════════════════');
      console.log('📡 useElectronAPI.createArtwork');
      console.log('📥 Input data:', data);
      console.log('═══════════════════════════════════════');
      
      checkAPI();
      
      const cleanData = { ...data };
      delete cleanData.imageFile;
      
      console.log('📦 Clean data (without imageFile):', cleanData);
      console.log('📡 Calling window.electronAPI.createArtwork...');
      
      const response = await window.electronAPI.createArtwork(cleanData);
      
      console.log('═══════════════════════════════════════');
      console.log('📤 createArtwork response:', response);
      console.log('  success:', response.success);
      console.log('  data:', response.data);
      console.log('  error:', response.error);
      console.log('═══════════════════════════════════════');
      
      if (!response.success) {
        console.error('❌ createArtwork failed:', response.error);
        throw new Error(response.error || 'Failed to create artwork');
      }
      
      if (!response.data) {
        console.error('❌ No artwork data returned');
        throw new Error('No artwork data returned from server');
      }
      
      console.log('✅ Artwork created successfully:', response.data);
      return response.data;
    }, [checkAPI]),

    updateArtwork: useCallback(async (id: string, data: UpdateArtworkData): Promise<Artwork> => {
      console.log('═══════════════════════════════════════');
      console.log('📡 useElectronAPI.updateArtwork');
      console.log('📥 ID:', id);
      console.log('📥 Data:', data);
      console.log('═══════════════════════════════════════');
      
      checkAPI();
      
      if (data.imageFile) {
        console.log('📸 Uploading image:', data.imageFile.name);
        
        try {
          const buffer = await data.imageFile.arrayBuffer();
          const imgResponse = await window.electronAPI.saveImage(buffer, data.imageFile.name);
          
          console.log('📤 Image upload response:', imgResponse);
          
          if (!imgResponse.success) {
            throw new Error(imgResponse.error || 'Failed to save image');
          }
          
          data.image_path = imgResponse.data;
          console.log('✅ Image uploaded:', data.image_path);
        } catch (error) {
          console.error('❌ Error uploading image:', error);
          // ✅ CORRETTO: usa i18n.t() per tradurre fuori dal componente React
          throw new Error(i18n.t('hooks.use_electron.errore_durante_il_caricamento'));
        }
        
        delete data.imageFile;
      }
      
      console.log('📡 Calling window.electronAPI.updateArtwork...');
      const response = await window.electronAPI.updateArtwork(id, data);
      
      console.log('📤 updateArtwork response:', response);
      
      if (!response.success) {
        console.error('❌ updateArtwork failed:', response.error);
        throw new Error(response.error);
      }
      
      console.log('✅ Artwork updated successfully');
      return response.data!;
    }, [checkAPI]),

    deleteArtwork: useCallback(async (id: string): Promise<void> => {
      console.log('🗑️ useElectronAPI.deleteArtwork - id:', id);
      checkAPI();
      
      const response = await window.electronAPI.deleteArtwork(id);
      console.log('📤 deleteArtwork response:', response);
      
      if (!response.success) {
        console.error('❌ deleteArtwork failed:', response.error);
        throw new Error(response.error);
      }
      
      console.log('✅ Artwork deleted successfully');
    }, [checkAPI]),

    // ==================== ARTISTS ====================
    
    getArtists: useCallback(async (): Promise<Artist[]> => {
      console.log('📡 useElectronAPI.getArtists');
      checkAPI();
      
      const response = await window.electronAPI.getArtists();
      console.log('📤 getArtists response:', response);
      
      if (!response.success) {
        console.error('❌ getArtists failed:', response.error);
        throw new Error(response.error);
      }
      
      console.log(`✅ getArtists: ${response.data?.length || 0} artists`);
      return response.data || [];
    }, [checkAPI]),

    getArtist: useCallback(async (id: string): Promise<Artist | null> => {
      console.log('📡 useElectronAPI.getArtist - id:', id);
      checkAPI();
      
      const response = await window.electronAPI.getArtist(id);
      console.log('📤 getArtist response:', response);
      
      if (!response.success) {
        console.error('❌ getArtist failed:', response.error);
        throw new Error(response.error);
      }
      
      return response.data || null;
    }, [checkAPI]),

    createArtist: useCallback(async (data: CreateArtistData): Promise<Artist> => {
      console.log('📡 useElectronAPI.createArtist - data:', data);
      checkAPI();
      
      const response = await window.electronAPI.createArtist(data);
      console.log('📤 createArtist response:', response);
      
      if (!response.success) {
        console.error('❌ createArtist failed:', response.error);
        throw new Error(response.error);
      }
      
      console.log('✅ Artist created:', response.data);
      return response.data!;
    }, [checkAPI]),

    updateArtist: useCallback(async (id: string, data: UpdateArtistData): Promise<Artist> => {
      console.log('📡 useElectronAPI.updateArtist - id:', id, 'data:', data);
      checkAPI();
      
      const response = await window.electronAPI.updateArtist(id, data);
      console.log('📤 updateArtist response:', response);
      
      if (!response.success) {
        console.error('❌ updateArtist failed:', response.error);
        throw new Error(response.error);
      }
      
      console.log('✅ Artist updated');
      return response.data!;
    }, [checkAPI]),

    deleteArtist: useCallback(async (id: string): Promise<void> => {
      console.log('📡 useElectronAPI.deleteArtist - id:', id);
      checkAPI();
      
      const response = await window.electronAPI.deleteArtist(id);
      console.log('📤 deleteArtist response:', response);
      
      if (!response.success) {
        console.error('❌ deleteArtist failed:', response.error);
        throw new Error(response.error);
      }
      
      console.log('✅ Artist deleted');
    }, [checkAPI]),

    // ==================== IMAGES ====================
    
    getImageUrl: useCallback(async (filename: string): Promise<string> => {
      console.log('📡 useElectronAPI.getImageUrl - filename:', filename);
      checkAPI();
      
      const response = await window.electronAPI.getImagePath(filename);
      console.log('📤 getImageUrl response:', response);
      
      if (!response.success || !response.data) {
        console.error('❌ getImageUrl failed:', response.error);
        throw new Error(response.error || 'Failed to get image path');
      }
      
      return response.data;
    }, [checkAPI]),

    saveImage: useCallback(async (buffer: ArrayBuffer, filename: string): Promise<string> => {
      console.log('📡 useElectronAPI.saveImage - filename:', filename);
      checkAPI();
      
      const response = await window.electronAPI.saveImage(buffer, filename);
      console.log('📤 saveImage response:', response);
      
      if (!response.success || !response.data) {
        console.error('❌ saveImage failed:', response.error);
        throw new Error(response.error || 'Failed to save image');
      }
      
      console.log('✅ Image saved:', response.data);
      return response.data;
    }, [checkAPI]),
  };
}