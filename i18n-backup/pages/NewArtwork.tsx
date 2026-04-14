import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArtworkForm } from '../components/Artworks/ArtworkForm';
import { useCreateArtwork } from '../hooks/useArtworks';
import { ArrowLeft } from 'lucide-react';
import type { CreateArtworkData, UpdateArtworkData, Artwork } from '../types/artwork.types';

export const NewArtwork = () => {
  const navigate = useNavigate();
  const createArtwork = useCreateArtwork();

  // ✅ Tipizzazione corretta che accetta entrambi
  const handleSubmit = async (data: CreateArtworkData | UpdateArtworkData): Promise<Artwork> => {
    console.log('📝 NewArtwork - handleSubmit called');
    console.log('📦 Data:', data);

    // ✅ Aspetta il risultato della mutation
    const result = await createArtwork.mutateAsync(data as CreateArtworkData);
    
    console.log('✅ NewArtwork - Artwork created:', result);
    
    // ✅ Restituisci il risultato
    return result;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Torna alla Dashboard</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Nuova Opera d'Arte</h1>
        </div>
      </div>

      <div className="max-w-4xl">
        <ArtworkForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
};