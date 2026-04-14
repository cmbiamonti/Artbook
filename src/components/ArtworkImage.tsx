import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Loader2 } from 'lucide-react';

interface ArtworkImageProps {
  imagePath: string | null | undefined;
  alt: string;
  className?: string;
}

export const ArtworkImage: React.FC<ArtworkImageProps> = ({ 
  imagePath, 
  alt, 
  className = '' 
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadImage = async () => {
      if (!imagePath) {
        if (isMounted) {
          setIsLoading(false);
          setHasError(true);
        }
        return;
      }

      try {
        if (isMounted) {
          setIsLoading(true);
          setHasError(false);
        }

        console.log('🖼️ Loading image:', imagePath);

        // ✅ VERIFICA 1: Se è già un URL completo (file://)
        if (imagePath.startsWith('file://')) {
          console.log('✅ Direct file URL:', imagePath);
          if (isMounted) {
            setImageSrc(imagePath);
            setIsLoading(false);
          }
          return;
        }

        // ✅ VERIFICA 2: Se è un URL HTTP
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
          console.log('✅ HTTP URL:', imagePath);
          if (isMounted) {
            setImageSrc(imagePath);
            setIsLoading(false);
          }
          return;
        }

        // ✅ VERIFICA 3: È un filename - ottieni il path da Electron
        if (window.electronAPI?.getImagePath) {
          console.log('📡 Fetching image path from Electron for:', imagePath);
          
          const result = await window.electronAPI.getImagePath(imagePath);
          
          console.log('📡 Electron response:', result);

          if (isMounted) {
            if (result?.success && result.data) {
              console.log('✅ Image loaded successfully:', result.data);
              setImageSrc(result.data);
              setIsLoading(false);
            } else {
              console.error('❌ Failed to get image path:', result?.error);
              setHasError(true);
              setIsLoading(false);
            }
          }
        } else {
          console.error('❌ electronAPI.getImagePath not available');
          if (isMounted) {
            setHasError(true);
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('❌ Error loading image:', error);
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [imagePath]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (hasError || !imageSrc) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-100 ${className}`}>
        <ImageIcon className="w-16 h-16 text-gray-400 mb-2" />
        <p className="text-sm text-gray-500">Nessuna immagine</p>
        {imagePath && (
          <p className="text-xs text-gray-400 mt-1 font-mono">{imagePath}</p>
        )}
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={() => {  // ✅ CORRETTO: rimosso parametro 'e' non usato
        console.error('❌ Image failed to load:', imageSrc);
        setHasError(true);
      }}
      onLoad={() => {
        console.log('✅ Image rendered successfully');
      }}
    />
  );
};