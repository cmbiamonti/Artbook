// src/hooks/useArtworkImage.ts

import { useState, useEffect } from 'react';

export function useArtworkImage(imagePath: string | null | undefined) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!imagePath) {
      setImageSrc(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    window.electronAPI.getImagePath(imagePath)
      .then(result => {
        if (result.success && result.data) { // ✅ Aggiungi && result.data
          setImageSrc(result.data);
        } else {
          setError(result.error || 'Failed to load image');
          setImageSrc(null);
        }
      })
      .catch(err => {
        console.error('Error loading image:', err);
        setError(err.message);
        setImageSrc(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [imagePath]);

  return { imageSrc, loading, error };
}