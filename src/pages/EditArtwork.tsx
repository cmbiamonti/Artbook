import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useArtwork, useUpdateArtwork } from '../hooks/useArtworks';
import { ArtworkForm } from '../components/Artworks/ArtworkForm';
import { Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import type { CreateArtworkData, UpdateArtworkData, Artwork } from '../types/artwork.types';
import { useTranslation } from 'react-i18next';

export const EditArtwork = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: artwork, isLoading } = useArtwork(id!);
  const updateArtwork = useUpdateArtwork();

  // ✅ Tipizzazione corretta
  const handleSubmit = async (data: CreateArtworkData | UpdateArtworkData): Promise<Artwork | undefined> => {
    if (!id) {
      toast.error('ID artwork mancante');
      return undefined;
    }

    try {
      const result = await updateArtwork.mutateAsync({ id, data: data as UpdateArtworkData });
      toast.success('Artwork aggiornato!');
      navigate(`/artworks/${id}`);
      return result;
    } catch (error) {
      console.error('Error updating artwork:', error);
      toast.error('Errore durante l\'aggiornamento');
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">{t('pages.edit_artwork.artwork_non_trovato')}</p>
        <button onClick={() => navigate('/')} className="mt-4 btn btn-primary">
          Torna alla Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(`/artworks/${id}`)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t('pages.edit_artwork.torna_ai_dettagli')}</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{t('pages.edit_artwork.modifica_opera')}</h1>
        </div>
      </div>

      <div className="max-w-4xl">
        <ArtworkForm artwork={artwork} onSubmit={handleSubmit} isEdit />
      </div>
    </div>
  );
};