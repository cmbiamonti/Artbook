// src/hooks/useArtists.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useElectronAPI } from './useElectron';
import type {  UpdateArtistData } from '@/types/artwork.types';

export function useArtists() {
  const api = useElectronAPI();
  
  return useQuery({
    queryKey: ['artists'],
    queryFn: api.getArtists,
  });
}

export function useArtist(id: string) {
  const api = useElectronAPI();
  
  return useQuery({
    queryKey: ['artist', id],
    queryFn: () => api.getArtist(id),
    enabled: !!id,
  });
}

export function useCreateArtist() {
  const queryClient = useQueryClient();
  const api = useElectronAPI();
  
  return useMutation({
    mutationFn: api.createArtist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artists'] });
    },
  });
}

export function useUpdateArtist() {
  const queryClient = useQueryClient();
  const api = useElectronAPI();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateArtistData }) => 
      api.updateArtist(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artists'] });
    },
  });
}

export function useDeleteArtist() {
  const queryClient = useQueryClient();
  const api = useElectronAPI();
  
  return useMutation({
    mutationFn: (id: string) => api.deleteArtist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artists'] });
    },
  });
}