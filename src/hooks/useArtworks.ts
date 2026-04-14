import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Artwork, CreateArtworkData, UpdateArtworkData, ArtworkFilters } from '../types/artwork.types';

export function useArtworks(filters?: ArtworkFilters) {
  return useQuery({
    queryKey: ['artworks', filters],
    queryFn: async () => {
      console.log('🔄 useArtworks - fetching with filters:', filters);
      const result = await window.electronAPI.getArtworks(filters);
      
      if (result.success && result.data) {
        // ✅ RIMUOVI DUPLICATI per ID
        const uniqueArtworks = result.data.filter((artwork, index, self) =>
          index === self.findIndex((a) => a.id === artwork.id)
        );
        
        console.log(`✅ Fetched: ${result.data.length} total, ${uniqueArtworks.length} unique`);
        return uniqueArtworks;
      }
      
      return [];
    },
    staleTime: 0, // ✅ CAMBIATO: 0 = sempre aggiornato
    refetchOnWindowFocus: true, // ✅ CAMBIATO: true per refetch automatico
    refetchOnMount: true, // ✅ AGGIUNTO: refetch quando componente monta
  });
}

export function useArtwork(id: string | undefined) {
  return useQuery({
    queryKey: ['artwork', id],
    queryFn: async () => {
      if (!id) return null;
      
      console.log('🔄 useArtwork - fetching id:', id);
      const result = await window.electronAPI.getArtwork(id);
      
      if (result.success && result.data) {
        console.log('✅ useArtwork - fetched:', result.data);
        return result.data;
      }
      
      return null;
    },
    enabled: !!id,
    staleTime: 10000,
  });
}

export function useCreateArtwork() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateArtworkData) => {
      console.log('═══════════════════════════════════════');
      console.log('🔄 useCreateArtwork - MUTATION START');
      console.log('📥 Input data:', data);
      console.log('═══════════════════════════════════════');

      const result = await window.electronAPI.createArtwork(data);

      console.log('═══════════════════════════════════════');
      console.log('📤 useCreateArtwork - MUTATION RESULT');
      console.log('📦 Result:', result);
      console.log('═══════════════════════════════════════');

      if (!result.success) {
        throw new Error(result.error || 'Failed to create artwork');
      }

      console.log('✅ useCreateArtwork - SUCCESS - ID:', result.data?.id);

      return result.data as Artwork;
    },
    onSuccess: async (newArtwork) => {
      console.log('═══════════════════════════════════════');
      console.log('✅ useCreateArtwork - onSuccess');
      console.log('📦 Created artwork:', newArtwork);
      console.log('═══════════════════════════════════════');

      // ✅ METODO 1: Aggiorna cache manualmente (più veloce)
      queryClient.setQueryData<Artwork[]>(['artworks'], (oldData) => {
        console.log('📝 Old data:', oldData?.length || 0, 'artworks');
        
        if (!oldData) {
          console.log('📝 No old data, creating new array');
          return [newArtwork];
        }
        
        // Aggiungi nuovo artwork all'inizio
        const newData = [newArtwork, ...oldData];
        console.log('📝 New data:', newData.length, 'artworks');
        
        return newData;
      });

      // ✅ METODO 2: Invalida e refetch per sicurezza
      console.log('🔄 Invalidating queries...');
      await queryClient.invalidateQueries({ queryKey: ['artworks'] });
      
      console.log('🔄 Refetching queries...');
      await queryClient.refetchQueries({ queryKey: ['artworks'] });

      console.log('✅ Cache updated successfully');
    },
    onError: (error) => {
      console.error('═══════════════════════════════════════');
      console.error('❌ useCreateArtwork - onError');
      console.error('Error:', error);
      console.error('═══════════════════════════════════════');
    },
  });
}

export function useUpdateArtwork() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateArtworkData }) => {
      console.log('🔄 useUpdateArtwork - updating:', id);
      const result = await window.electronAPI.updateArtwork(id, data);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update artwork');
      }

      return result.data as Artwork;
    },
    onSuccess: async (updatedArtwork) => {
      console.log('✅ useUpdateArtwork - success:', updatedArtwork.id);

      // ✅ Aggiorna cache specifica artwork
      queryClient.setQueryData(['artwork', updatedArtwork.id], updatedArtwork);

      // ✅ Aggiorna lista artworks
      queryClient.setQueryData<Artwork[]>(['artworks'], (oldData) => {
        if (!oldData) return [updatedArtwork];
        
        return oldData.map(artwork => 
          artwork.id === updatedArtwork.id ? updatedArtwork : artwork
        );
      });

      // ✅ Invalida per sicurezza
      await queryClient.invalidateQueries({ queryKey: ['artworks'] });
      await queryClient.refetchQueries({ queryKey: ['artworks'] });
    },
  });
}

export function useDeleteArtwork() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      console.log('🗑️ useDeleteArtwork - deleting:', id);
      const result = await window.electronAPI.deleteArtwork(id);

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete artwork');
      }

      return id;
    },
    onSuccess: async (deletedId) => {
      console.log('✅ useDeleteArtwork - success:', deletedId);

      // ✅ Rimuovi dalla cache
      queryClient.setQueryData<Artwork[]>(['artworks'], (oldData) => {
        if (!oldData) return [];
        
        return oldData.filter(artwork => artwork.id !== deletedId);
      });

      // ✅ Invalida per sicurezza
      await queryClient.invalidateQueries({ queryKey: ['artworks'] });
      await queryClient.refetchQueries({ queryKey: ['artworks'] });
    },
  });
}