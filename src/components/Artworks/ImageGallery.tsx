import React, { useState, useEffect } from 'react';
import { Upload, X, Star, StarOff, Loader2, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface ArtworkImage {
  id: string;
  artwork_id: string;
  image_path: string;
  display_order: number;
  is_primary: number;
  created_at: string;
}

interface ImageGalleryProps {
  artworkId?: string;
  onImagesChange?: (images: File[]) => void;
  maxImages?: number;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  artworkId,
  onImagesChange,
  maxImages = 5,
}) => {
  // ✅ useTranslation a livello di componente — NON dentro useEffect
  const { t } = useTranslation();

  const [images, setImages] = useState<ArtworkImage[]>([]);
  const [previewImages, setPreviewImages] = useState<Array<{ file: File; preview: string }>>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // LOAD IMAGES
  useEffect(() => {
    // ✅ NON chiamare useTranslation qui dentro
    const loadImages = async () => {
      if (!artworkId) return;
      try {
        setIsLoading(true);
        const result = await window.electronAPI.getArtworkImages(artworkId);
        if (result.success && result.data) {
          setImages(result.data.sort((a, b) => a.display_order - b.display_order));
        }
      } catch (error) {
        console.error('Error loading images:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadImages();
  }, [artworkId]);

  // HANDLE FILE SELECTION
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const currentCount = artworkId ? images.length : previewImages.length;
    const availableSlots = maxImages - currentCount;

    if (files.length > availableSlots) {
      toast.error(t('gallery.max_images_error', {
        max: maxImages,
        available: availableSlots,
      }));
      return;
    }

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(t('gallery.invalid_image', { name: file.name }));
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(t('gallery.file_too_large', { name: file.name }));
        return false;
      }
      return true;
    });

    if (!validFiles.length) return;

    if (artworkId) {
      await uploadImages(validFiles);
    } else {
      const newPreviews = await Promise.all(
        validFiles.map(async file => ({
          file,
          preview: await fileToDataURL(file),
        }))
      );
      const updatedPreviews = [...previewImages, ...newPreviews];
      setPreviewImages(updatedPreviews);
      if (onImagesChange) {
        onImagesChange(updatedPreviews.map(p => p.file));
      }
      toast.success(t('gallery.images_added', { count: validFiles.length }));
    }

    e.target.value = '';
  };

  // UPLOAD IMAGES
  const uploadImages = async (files: File[]) => {
    if (!artworkId) return;
    setIsLoading(true);
    try {
      for (const file of files) {
        const buffer = await file.arrayBuffer();
        const saveResult = await window.electronAPI.saveImage(buffer, file.name);
        if (!saveResult.success || !saveResult.data) {
          throw new Error(`Failed to upload ${file.name}`);
        }
        const isPrimary = images.length === 0;
        await window.electronAPI.addArtworkImage(artworkId, saveResult.data, isPrimary);
      }
      const result = await window.electronAPI.getArtworkImages(artworkId);
      if (result.success && result.data) {
        setImages(result.data.sort((a, b) => a.display_order - b.display_order));
        toast.success(t('gallery.images_uploaded', { count: files.length }));
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error(t('gallery.upload_error'));
    } finally {
      setIsLoading(false);
    }
  };

  // DELETE IMAGE
  const handleDelete = async (index: number) => {
    if (artworkId) {
      const image = images[index];
      if (!confirm(t('gallery.delete_confirm'))) return;
      try {
        setIsLoading(true);
        await window.electronAPI.deleteArtworkImage(image.id, image.image_path);
        const updatedImages = images.filter((_, i) => i !== index);
        setImages(updatedImages);
        if (currentIndex >= updatedImages.length && currentIndex > 0) {
          setCurrentIndex(currentIndex - 1);
        }
        toast.success(t('gallery.image_deleted'));
      } catch (error) {
        console.error('Error deleting image:', error);
        toast.error(t('gallery.delete_error'));
      } finally {
        setIsLoading(false);
      }
    } else {
      const updatedPreviews = previewImages.filter((_, i) => i !== index);
      setPreviewImages(updatedPreviews);
      if (onImagesChange) {
        onImagesChange(updatedPreviews.map(p => p.file));
      }
      if (currentIndex >= updatedPreviews.length && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
      toast.success(t('gallery.image_deleted'));
    }
  };

  // SET PRIMARY
  const handleSetPrimary = async (index: number) => {
    if (!artworkId) {
      toast.info(t('gallery.set_primary_after_create'));
      return;
    }
    const image = images[index];
    try {
      setIsLoading(true);
      await window.electronAPI.setArtworkImageAsPrimary(image.id, artworkId);
      const updatedImages = images.map((img, i) => ({
        ...img,
        is_primary: i === index ? 1 : 0,
      }));
      setImages(updatedImages);
      toast.success(t('gallery.primary_updated'));
    } catch (error) {
      console.error('Error setting primary:', error);
      toast.error(t('gallery.upload_error'));
    } finally {
      setIsLoading(false);
    }
  };

  // DRAG & DROP
  const handleDragStart = (index: number) => setDraggedIndex(index);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);
    setImages(newImages);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null || !artworkId) return;
    try {
      const updatedOrder = images.map((img, idx) => ({ id: img.id, order: idx }));
      await window.electronAPI.updateArtworkImagesOrder(updatedOrder);
      setImages(images.map((img, idx) => ({ ...img, display_order: idx })));
      toast.success(t('gallery.order_updated'));
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error(t('gallery.order_error'));
    } finally {
      setDraggedIndex(null);
    }
  };

  // NAVIGATION
  const goToPrevious = () => {
    const count = artworkId ? images.length : previewImages.length;
    setCurrentIndex(prev => (prev === 0 ? count - 1 : prev - 1));
  };

  const goToNext = () => {
    const count = artworkId ? images.length : previewImages.length;
    setCurrentIndex(prev => (prev === count - 1 ? 0 : prev + 1));
  };

  const fileToDataURL = (file: File): Promise<string> =>
    new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

  const displayImages = artworkId ? images : previewImages;
  const currentCount = displayImages.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="label">
          {t('gallery.title')} ({currentCount}/{maxImages})
        </label>

        {currentCount < maxImages && (
          <label className="btn btn-secondary btn-sm cursor-pointer">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={isLoading}
            />
            <Upload className="w-4 h-4 mr-2" />
            {t('gallery.add_images')}
          </label>
        )}
      </div>

      {displayImages.length > 0 ? (
        <div className="space-y-4">
          {/* Main Image */}
          <div
            className="relative bg-gray-100 rounded-lg overflow-hidden"
            style={{ height: '400px' }}
          >
            {isLoading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}

            {artworkId ? (
              <ImageDisplay image={images[currentIndex]} />
            ) : (
              <img
                src={previewImages[currentIndex].preview}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            )}

            {displayImages.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
              {currentIndex + 1} / {displayImages.length}
            </div>

            {artworkId && images[currentIndex]?.is_primary === 1 && (
              <div className="absolute top-2 left-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                <Star className="w-4 h-4 fill-white" />
                <span>{t('gallery.primary_badge')}</span>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          <div className="grid grid-cols-5 gap-2">
            {displayImages.map((img, index) => {
              const isArtworkImage = 'image_path' in img;
              return (
                <div
                  key={isArtworkImage ? (img as ArtworkImage).id : index}
                  draggable={!!artworkId}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={e => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition ${
                    index === currentIndex
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : draggedIndex === index
                      ? 'border-yellow-500 opacity-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => setCurrentIndex(index)}
                >
                  {artworkId && (
                    <div className="absolute top-1 left-1 bg-black bg-opacity-50 text-white p-0.5 rounded cursor-move">
                      <GripVertical className="w-3 h-3" />
                    </div>
                  )}

                  {isArtworkImage ? (
                    <ThumbnailDisplay image={img as ArtworkImage} />
                  ) : (
                    <img
                      src={(img as any).preview}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  )}

                  <div className="absolute top-1 right-1 flex space-x-1">
                    {artworkId && !(img as ArtworkImage).is_primary && (
                      <button
                        onClick={e => { e.stopPropagation(); handleSetPrimary(index); }}
                        className="bg-yellow-500 text-white p-1 rounded-full hover:bg-yellow-600 transition"
                        title={t('components.artworks.image_gallery.imposta_come_principale')}
                      >
                        <StarOff className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(index); }}
                      className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition"
                      title={t('components.artworks.image_gallery.elimina')}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  {isArtworkImage && (img as ArtworkImage).is_primary === 1 && (
                    <div className="absolute bottom-1 left-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">{t('gallery.no_images_title')}</p>
          <p className="text-sm text-gray-500">
            {t('gallery.no_images_subtitle', { max: maxImages })}
          </p>
        </div>
      )}
    </div>
  );
};

// ── ImageDisplay — componente separato con proprio hook ───────────────────────
const ImageDisplay: React.FC<{ image: ArtworkImage }> = ({ image }) => {
  // ✅ useTranslation nel componente — corretto
  const { t } = useTranslation();
  const [src, setSrc] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await window.electronAPI.getImagePath(image.image_path);
        if (result.success && result.data) setSrc(result.data);
      } catch (error) {
        console.error('Error loading image:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [image.image_path]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!src) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        {/* ✅ ora t() è disponibile perché siamo nel componente */}
        <p className="text-gray-500">
          {t('components.artworks.image_gallery.immagine_non_disponibile')}
        </p>
      </div>
    );
  }

  return <img src={src} alt="Artwork" className="w-full h-full object-contain" />;
};

// ── ThumbnailDisplay — invariato, non usa t() ─────────────────────────────────
const ThumbnailDisplay: React.FC<{ image: ArtworkImage }> = ({ image }) => {
  const [src, setSrc] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      const result = await window.electronAPI.getImagePath(image.image_path);
      if (result.success && result.data) setSrc(result.data);
    };
    load();
  }, [image.image_path]);

  return src ? (
    <img src={src} alt="Thumbnail" className="w-full h-full object-cover" />
  ) : (
    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
    </div>
  );
};