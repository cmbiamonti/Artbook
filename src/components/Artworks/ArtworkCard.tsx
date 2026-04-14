import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, User, DollarSign } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { getFullCategoryPath } from '../../utils/categories';
import type { Artwork } from '../../types/artwork.types';
import { useTranslation } from 'react-i18next';

interface ArtworkCardProps {
  artwork: Artwork;
  onClick?: (id: string) => void;
}

export const ArtworkCard: React.FC<ArtworkCardProps> = ({ artwork, onClick }) => {
  const { t } = useTranslation();   // ← aggiungi questa riga
  const navigate = useNavigate();
  const [primaryImageUrl, setPrimaryImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  console.log('🎨 ArtworkCard rendering:', {
    id: artwork.id,
    title: artwork.title,
    image_path: artwork.image_path,
  });

  // ✅ CARICA IMMAGINE PRINCIPALE DALLA GALLERIA
  useEffect(() => {
    const loadPrimaryImage = async () => {
      try {
        setLoading(true);
        
        // 1. Prova a caricare dalla galleria
        console.log(`📸 Loading gallery images for artwork: ${artwork.id}`);
        const galleryResult = await window.electronAPI.getArtworkImages(artwork.id);
        
        console.log(`📸 Gallery result:`, galleryResult);
        
        if (galleryResult.success && galleryResult.data && galleryResult.data.length > 0) {
          // Trova immagine principale
          const primaryImage = galleryResult.data.find((img: any) => img.is_primary === 1) 
                            || galleryResult.data[0];
          
          console.log(`📸 Primary image:`, primaryImage);
          
          if (primaryImage) {
            const imagePathResult = await window.electronAPI.getImagePath(primaryImage.image_path);
            
            console.log(`📸 Image path result:`, imagePathResult);
            
            if (imagePathResult.success && imagePathResult.data) {
              console.log(`✅ Image URL: ${imagePathResult.data}`);
              setPrimaryImageUrl(imagePathResult.data);
              setLoading(false);
              return;
            }
          }
        }
        
        // 2. Fallback: Usa image_path legacy
        if (artwork.image_path) {
          console.log(`📸 Using legacy image_path: ${artwork.image_path}`);
          
          if (artwork.image_path.startsWith('file://') || artwork.image_path.startsWith('http')) {
            setPrimaryImageUrl(artwork.image_path);
          } else {
            const imagePathResult = await window.electronAPI.getImagePath(artwork.image_path);
            if (imagePathResult.success && imagePathResult.data) {
              setPrimaryImageUrl(imagePathResult.data);
            }
          }
        }
        
      } catch (error) {
        console.error('❌ Error loading image:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPrimaryImage();
  }, [artwork.id, artwork.image_path]);

  const handleClick = () => {
    if (onClick) {
      onClick(artwork.id);
    } else {
      navigate(`/artworks/${artwork.id}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="card-hover group cursor-pointer transition-all duration-300 hover:scale-[1.02]"
    >
      {/* Immagine */}
      <div className="aspect-w-4 aspect-h-3 bg-gray-100 rounded-lg overflow-hidden mb-4">
        {loading ? (
          <div className="w-full h-48 flex items-center justify-center bg-gray-200">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : primaryImageUrl ? (
          <img
            src={primaryImageUrl}
            alt={artwork.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              console.error('❌ Image failed to load:', primaryImageUrl);
              e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
            }}
          />
        ) : (
          <div className="w-full h-48 flex items-center justify-center bg-gray-200 text-gray-500">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              <p className="text-xs">Nessuna immagine</p>
            </div>
          </div>
        )}
      </div>

      {/* Contenuto */}
      <div className="space-y-3">
        {/* Titolo */}
        <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
          {artwork.title}
        </h3>

        {/* Artista */}
        {artwork.artist_name && (
          <div className="flex items-center text-sm text-gray-600">
            <User className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="line-clamp-1">{artwork.artist_name}</span>
          </div>
        )}

        {/* Categoria */}
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="line-clamp-1">
            {getFullCategoryPath(artwork.category, artwork.subcategory, t)}
          </span>
        </div>

        {/* Anno */}
        {artwork.year && (
          <div className="text-sm text-gray-500">
            Anno: {artwork.year}
          </div>
        )}

        {/* Valore */}
        {artwork.estimated_value && (
          <div className="flex items-center text-sm font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">
            <DollarSign className="w-4 h-4 mr-1" />
            {formatCurrency(artwork.estimated_value)}
          </div>
        )}
      </div>
    </div>
  );
};