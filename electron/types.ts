// electron/types.ts

export interface Artwork {
  id: string;
  title: string;
  artist_id: string | null;
  artist_name?: string;
  category: string;
  subcategory: string | null; // ✅ AGGIUNGI
  year: number | null;
  technique: string | null;
  dimensions: string | null;
  estimated_value: number | null; 
  image_path: string | null;
  description: string | null;


   // ✅ NUOVO: Array immagini
  images?: ArtworkImage[];

  
  // Identificazione & Documentazione
  catalog_number: string | null;
  certificate_authenticity: string | null;
  certificate_number: string | null;
  artist_signature: string | null;
  condition_state: string | null;
  edition_number: string | null;
  
  // Localizzazione & Logistica
  current_location: string | null;
  location_details: string | null;
  insurance_value: number | null;
  insurance_company: string | null;
  insurance_expiry: string | null;
  frame_included: string | null;
  frame_description: string | null;
  
  // Mercato & Transazioni
  purchase_price: number | null;
  purchase_date: string | null;
  seller_gallery: string | null;
  provenance: string | null;
  available_for_sale: string | null;
  asking_price: number | null;
  
  created_at: string;
  updated_at: string;
}

export interface ArtworkImage {
  id: string;
  artwork_id: string;
  image_path: string;
  display_order: number;
  is_primary: number;
  created_at: string;
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
  category: string;
  subcategory?: string | null; // ✅ AGGIUNGI
  year?: number | null;
  technique?: string | null;
  dimensions?: string | null;
  estimated_value?: number | null;
  description?: string | null;
  image_path?: string | null;
  imageFile?: File;
  
  catalog_number?: string | null;
  certificate_authenticity?: string | null;
  certificate_number?: string | null;
  artist_signature?: string | null;
  condition_state?: string | null;
  edition_number?: string | null;
  
  current_location?: string | null;
  location_details?: string | null;
  insurance_value?: number | null;
  insurance_company?: string | null;
  insurance_expiry?: string | null;
  frame_included?: string | null;
  frame_description?: string | null;
  
  purchase_price?: number | null;
  purchase_date?: string | null;
  seller_gallery?: string | null;
  provenance?: string | null;
  available_for_sale?: string | null;
  asking_price?: number | null;
}

export interface UpdateArtworkData {
  title?: string;
  artist_id?: string | null;
  category?: string;
  year?: number | null;
  technique?: string | null;
  dimensions?: string | null;
  estimated_value?: number | null;
  description?: string | null;
  image_path?: string | null;
  imageFile?: File;
  
  catalog_number?: string | null;
  certificate_authenticity?: string | null;
  certificate_number?: string | null;
  artist_signature?: string | null;
  condition_state?: string | null;
  edition_number?: string | null;
  
  current_location?: string | null;
  location_details?: string | null;
  insurance_value?: number | null;
  insurance_company?: string | null;
  insurance_expiry?: string | null;
  frame_included?: string | null;
  frame_description?: string | null;
  
  purchase_price?: number | null;
  purchase_date?: string | null;
  seller_gallery?: string | null;
  provenance?: string | null;
  available_for_sale?: string | null;
  asking_price?: number | null;
}

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
  subcategory?: string;  // ✅ AGGIUNGI QUESTA RIGA
  year_from?: number;
  year_to?: number;
}