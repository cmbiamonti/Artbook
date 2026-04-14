import React, { useState, useEffect } from 'react';
import { Star, StarOff, Trash2, ChevronUp, ChevronDown, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

interface ArtworkImage {
  id: string;
  artwork_id: string;
  image_path: string;
  display_order: number;
  is_primary: number;
  created_at: string;
}

interface ImageManagerProps {
  artworkId: string;
  onImagesChange?: () => void;
}

export const ImageManager: React.FC<ImageManagerProps> = ({ artworkId, onImagesChange }) => {
  const [images, setImages] = useState<ArtworkImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<ArtworkImage | null>(null);

  // ✅ CARICA IMMAGINI
  useEffect(() => {
    loadImages();
  }, [artworkId]);

  const loadImages = async () => {
    try {
      setLoading(true);
      const result = await window.electronAPI.getArtworkImages(artworkId);
      
      if (result.success && result.data) {
        setImages(result.data.sort((a, b) => a.display_order - b.display_order));
      }
    } catch (error) {
      console.error('Error loading images:', error);
      toast.error('Errore nel caricamento immagini');
    } finally {
      setLoading(false);
    }
  };

  // ✅ IMPOSTA COME PRINCIPALE
  const handleSetPrimary = async (imageId: string) => {
    try {
      const result = await window.electronAPI.setArtworkImageAsPrimary(imageId, artworkId);
      
      if (result.success) {
        // Aggiorna stato locale
        setImages(prev => prev.map(img => ({
          ...img,
          is_primary: img.id === imageId ? 1 : 0
        })));
        
        toast.success('Immagine principale aggiornata');
        
        if (onImagesChange) onImagesChange();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error setting primary:', error);
      toast.error('Errore durante l\'aggiornamento');
    }
  };

  // ✅ ELIMINA IMMAGINE
  const handleDelete = async (image: ArtworkImage) => {
    if (!confirm(`Eliminare questa immagine?`)) return;

    try {
      const result = await window.electronAPI.deleteArtworkImage(image.id, image.image_path);
      
      if (result.success) {
        setImages(prev => prev.filter(img => img.id !== image.id));
        toast.success('Immagine eliminata');
        
        if (onImagesChange) onImagesChange();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Errore durante l\'eliminazione');
    }
  };

  // ✅ SPOSTA SU
  const handleMoveUp = async (index: number) => {
    if (index === 0) return;

    const newImages = [...images];
    [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    
    // Aggiorna display_order
    const updatedOrder = newImages.map((img, idx) => ({
      id: img.id,
      order: idx
    }));

    try {
      const result = await window.electronAPI.updateArtworkImagesOrder(updatedOrder);
      
      if (result.success) {
        setImages(newImages.map((img, idx) => ({ ...img, display_order: idx })));
        toast.success('Ordine aggiornato');
        
        if (onImagesChange) onImagesChange();
      }
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Errore durante l\'aggiornamento ordine');
    }
  };

  // ✅ SPOSTA GIÙ
  const handleMoveDown = async (index: number) => {
    if (index === images.length - 1) return;

    const newImages = [...images];
    [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    
    const updatedOrder = newImages.map((img, idx) => ({
      id: img.id,
      order: idx
    }));

    try {
      const result = await window.electronAPI.updateArtworkImagesOrder(updatedOrder);
      
      if (result.success) {
        setImages(newImages.map((img, idx) => ({ ...img, display_order: idx })));
        toast.success('Ordine aggiornato');
        
        if (onImagesChange) onImagesChange();
      }
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Errore durante l\'aggiornamento ordine');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Nessuna immagine caricata</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg text-gray-900">
        Gestione Immagini ({images.length})
      </h3>

      {/* LISTA IMMAGINI */}
      <div className="space-y-2">
        {images.map((image, index) => (
          <ImageManagerItem
            key={image.id}
            image={image}
            index={index}
            isFirst={index === 0}
            isLast={index === images.length - 1}
            onSetPrimary={() => handleSetPrimary(image.id)}
            onDelete={() => handleDelete(image)}
            onMoveUp={() => handleMoveUp(index)}
            onMoveDown={() => handleMoveDown(index)}
            onClick={() => setSelectedImage(image)}
          />
        ))}
      </div>

      {/* PREVIEW MODALE */}
      {selectedImage && (
        <ImagePreviewModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
};

// ✅ COMPONENTE SINGOLA RIGA
interface ImageManagerItemProps {
  image: ArtworkImage;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onSetPrimary: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onClick: () => void;
}

const ImageManagerItem: React.FC<ImageManagerItemProps> = ({
  image,
  index,
  isFirst,
  isLast,
  onSetPrimary,
  onDelete,
  onMoveUp,
  onMoveDown,
  onClick
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const result = await window.electronAPI.getImagePath(image.image_path);
      if (result.success && result.data) {
        setImageUrl(result.data);
      }
    };
    load();
  }, [image.image_path]);

  return (
    <div className={`
      flex items-center space-x-3 p-3 rounded-lg border-2 transition
      ${image.is_primary ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 bg-white hover:border-gray-300'}
    `}>
      {/* THUMBNAIL */}
      <div 
        className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 cursor-pointer"
        onClick={onClick}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Thumbnail"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {/* INFO */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">
            Immagine {index + 1}
          </span>
          
          {image.is_primary === 1 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">
              <Star className="w-3 h-3 mr-1 fill-yellow-500" />
              Principale
            </span>
          )}
        </div>
        
        <p className="text-xs text-gray-500 truncate">{image.image_path}</p>
      </div>

      {/* AZIONI */}
      <div className="flex items-center space-x-1">
        {/* SET PRIMARY */}
        {image.is_primary !== 1 && (
          <button
            onClick={onSetPrimary}
            className="p-2 rounded-lg hover:bg-yellow-100 text-gray-600 hover:text-yellow-600 transition"
            title="Imposta come principale"
          >
            <StarOff className="w-4 h-4" />
          </button>
        )}

        {/* MOVE UP */}
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          className="p-2 rounded-lg hover:bg-blue-100 text-gray-600 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
          title="Sposta su"
        >
          <ChevronUp className="w-4 h-4" />
        </button>

        {/* MOVE DOWN */}
        <button
          onClick={onMoveDown}
          disabled={isLast}
          className="p-2 rounded-lg hover:bg-blue-100 text-gray-600 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
          title="Sposta giù"
        >
          <ChevronDown className="w-4 h-4" />
        </button>

        {/* DELETE */}
        <button
          onClick={onDelete}
          className="p-2 rounded-lg hover:bg-red-100 text-gray-600 hover:text-red-600 transition"
          title="Elimina"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ✅ MODALE PREVIEW
interface ImagePreviewModalProps {
  image: ArtworkImage;
  onClose: () => void;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ image, onClose }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const result = await window.electronAPI.getImagePath(image.image_path);
      if (result.success && result.data) {
        setImageUrl(result.data);
      }
    };
    load();
  }, [image.image_path]);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-full">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {imageUrl && (
          <img
            src={imageUrl}
            alt="Preview"
            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </div>
    </div>
  );
};