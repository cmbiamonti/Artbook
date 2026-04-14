// src/types/artwork.types.ts

export interface Artwork {
  id: string;
  title: string;
  artist_id: string | null;
  artist_name?: string;
  category: string;
  subcategory: string | null; // ✅ CAMPO SOTTOCATEGORIA
  year: number | null;
  technique: string | null;
  dimensions: string | null;
  estimated_value: number | null;
  image_path: string | null;
  description: string | null;
  
  // Identificazione & Documentazione
  catalog_number: string | null;
  certificate_authenticity: 'yes' | 'no' | null;
  certificate_number: string | null;
  artist_signature: 'yes' | 'no' | 'unverifiable' | null;
  condition_state: 'excellent' | 'good' | 'fair' | 'needs_restoration' | null;
  edition_number: string | null;
  
  // Localizzazione & Logistica
  current_location: 'studio' | 'warehouse' | 'on_loan' | 'on_display' | 'other' | null;
  location_details: string | null;
  insurance_value: number | null;
  insurance_company: string | null;
  insurance_expiry: string | null;
  frame_included: 'yes' | 'no' | null;
  frame_description: string | null;
  
  // Mercato & Transazioni
  purchase_price: number | null;
  purchase_date: string | null;
  seller_gallery: string | null;
  provenance: string | null;
  available_for_sale: 'yes' | 'no' | null;
  asking_price: number | null;
  
  created_at: string;
  updated_at: string;
}

export interface Artist {
  id: string;
  name: string;
  birth_year: number | null;
  death_year: number | null;
  nationality: string | null;
  biography: string | null;
  created_at: string;
}

export interface CreateArtworkData {
  title: string;
  artist_id?: string | null;
  artist_name?: string;
  category: string;
  subcategory?: string | null; // ✅ CAMPO SOTTOCATEGORIA
  year?: number | null;
  technique?: string | null;
  dimensions?: string | null;
  estimated_value?: number | null;
  description?: string | null;
  image_path?: string | null;
  imageFile?: File;
  
  catalog_number?: string | null;
  certificate_authenticity?: 'yes' | 'no' | null;
  certificate_number?: string | null;
  artist_signature?: 'yes' | 'no' | 'unverifiable' | null;
  condition_state?: 'excellent' | 'good' | 'fair' | 'needs_restoration' | null;
  edition_number?: string | null;
  
  current_location?: 'studio' | 'warehouse' | 'on_loan' | 'on_display' | 'other' | null;
  location_details?: string | null;
  insurance_value?: number | null;
  insurance_company?: string | null;
  insurance_expiry?: string | null;
  frame_included?: 'yes' | 'no' | null;
  frame_description?: string | null;
  
  purchase_price?: number | null;
  purchase_date?: string | null;
  seller_gallery?: string | null;
  provenance?: string | null;
  available_for_sale?: 'yes' | 'no' | null;
  asking_price?: number | null;
}

export interface UpdateArtworkData extends Partial<CreateArtworkData> {}

export interface CreateArtistData {
  name: string;
  birth_year?: number | null;
  death_year?: number | null;
  nationality?: string | null;
  biography?: string | null;
}

export interface UpdateArtistData {
  name?: string;
  birth_year?: number | null;
  death_year?: number | null;
  nationality?: string | null;
  biography?: string | null;
}

export interface ArtworkFilters {
  search?: string;
  artist_id?: string;
  category?: string;
  subcategory?: string; // ✅ FILTRO SOTTOCATEGORIA
  year_from?: number;
  year_to?: number;
}

export interface IpcResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// ✅ NUOVO: Tipo per immagini galleria
export interface ArtworkImage {
  id: string;
  artwork_id: string;
  image_path: string;
  display_order: number;
  is_primary: number;
  created_at: string;
}

export type ArtworkWithDetails = Artwork;