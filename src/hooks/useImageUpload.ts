// src/hooks/useImageUpload.ts

import { useState } from 'react';
import { toast } from 'sonner';
import type { IpcResponse } from '@/types/electron';

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      
      const buffer = await file.arrayBuffer();
      const response: IpcResponse<string> = await window.electronAPI.saveImage(buffer, file.name);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to upload image');
      }
      
      toast.success('Immagine caricata con successo');
      return response.data!;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Errore durante il caricamento dell\'immagine');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (filename: string): Promise<void> => {
    try {
      const response: IpcResponse<void> = await window.electronAPI.deleteImage(filename);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete image');
      }
      
      toast.success('Immagine eliminata');
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Errore durante l\'eliminazione dell\'immagine');
    }
  };

  return {
    uploadImage,
    deleteImage,
    uploading,
  };
}