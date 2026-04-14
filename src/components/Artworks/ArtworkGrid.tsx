// src/components/Artworks/ArtworkGrid.tsx

import { Loader2 } from 'lucide-react';
import { ArtworkCard } from './ArtworkCard';
import type { Artwork } from '../../types/artwork.types';
import { useTranslation } from 'react-i18next';

interface ArtworkGridProps {
  artworks: Artwork[];
  isLoading: boolean;
  onArtworkClick: (id: string) => void;
}

export const ArtworkGrid = ({ artworks, isLoading, onArtworkClick }: ArtworkGridProps) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (artworks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">
          {t('components.artworks.artwork_grid.empty_title')}
        </p>
        <p className="text-gray-400 text-sm mt-2">
          {t('components.artworks.artwork_grid.empty_subtitle')}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {artworks.map((artwork) => (
        <ArtworkCard
          key={artwork.id}
          artwork={artwork}
          onClick={() => onArtworkClick(artwork.id)}
        />
      ))}
    </div>
  );
};