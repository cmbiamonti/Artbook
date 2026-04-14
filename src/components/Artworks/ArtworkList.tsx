import React, { useState, useEffect } from 'react';
import { Loader2, Calendar, User, Euro, Image as ImageIcon } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import type { Artwork } from '../../types/artwork.types';
import { useTranslation } from 'react-i18next';

interface ArtworkListProps {
  artworks: Artwork[];
  isLoading: boolean;
  onArtworkClick: (id: string) => void;
}

// ── Thumbnail immagine principale ─────────────────────────────────────────────
const PrimaryImageThumbnail: React.FC<{ artworkId: string; title: string }> = ({
  artworkId,
  title,
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPrimaryImage = async () => {
      try {
        setLoading(true);
        const result = await window.electronAPI.getArtworkImages(artworkId);

        if (result.success && result.data && result.data.length > 0) {
          const primaryImage =
            result.data.find((img: any) => img.is_primary === 1) || result.data[0];
          const pathResult = await window.electronAPI.getImagePath(primaryImage.image_path);
          if (pathResult.success && pathResult.data) {
            setImageUrl(pathResult.data);
          }
        }
      } catch (error) {
        console.error('Error loading primary image:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPrimaryImage();
  }, [artworkId]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
        <ImageIcon className="w-8 h-8 text-gray-400" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={title}
      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
      onError={(e) => {
        console.error('Image failed to load:', imageUrl);
        e.currentTarget.style.display = 'none';
      }}
    />
  );
};

// ── ArtworkList ───────────────────────────────────────────────────────────────
export const ArtworkList = ({ artworks, isLoading, onArtworkClick }: ArtworkListProps) => {
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
      <div className="card text-center py-12">
        <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 text-lg font-medium">
          {t('components.artworks.artwork_list.empty_title')}
        </p>
        <p className="text-gray-400 text-sm mt-2">
          {t('components.artworks.artwork_list.empty_subtitle')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {artworks.map((artwork) => (
        <button
          key={artwork.id}
          onClick={() => onArtworkClick(artwork.id)}
          className="card hover:shadow-lg transition-all duration-200 w-full text-left group"
        >
          <div className="flex gap-4">

            {/* Thumbnail */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden bg-gray-100">
                <PrimaryImageThumbnail artworkId={artwork.id} title={artwork.title} />
              </div>
            </div>

            {/* Contenuto */}
            <div className="flex-1 min-w-0">
              <div className="mb-2">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                  {artwork.title}
                </h3>
                {artwork.artist_name && (
                  <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                    <User className="w-4 h-4" />
                    {artwork.artist_name}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600">
                {artwork.category && (
                  <div className="flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-primary-500" />
                    <span>{artwork.category}</span>
                  </div>
                )}
                {artwork.year && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{artwork.year}</span>
                  </div>
                )}
                {artwork.technique && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">•</span>
                    <span>{artwork.technique}</span>
                  </div>
                )}
                {artwork.dimensions && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">•</span>
                    <span>{artwork.dimensions}</span>
                  </div>
                )}
              </div>

              {artwork.estimated_value && (
                <div className="mt-2 flex items-center gap-1 text-green-700 font-semibold">
                  <Euro className="w-4 h-4" />
                  <span>{formatCurrency(artwork.estimated_value)}</span>
                </div>
              )}
            </div>

            {/* Freccia */}
            <div className="flex-shrink-0 flex items-center">
              <svg
                className="w-5 h-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>

          </div>
        </button>
      ))}
    </div>
  );
};