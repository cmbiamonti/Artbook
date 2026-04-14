// src/utils/categories.ts

export interface Subcategory {
  value: string;
  label: string;
}

export interface Category {
  value: string;
  label: string;
  subcategories: Subcategory[];
}

export const CATEGORIES: Category[] = [
  {
    value: 'dipinti',
    label: 'Dipinti',
    subcategories: [
      { value: 'olio', label: 'Olio' },
      { value: 'acquerello', label: 'Acquerello' },
      { value: 'acrilico', label: 'Acrilico' },
      { value: 'affresco', label: 'Affresco' },
    ],
  },
  {
    value: 'sculture',
    label: 'Sculture',
    subcategories: [
      { value: 'bronzo', label: 'Bronzo' },
      { value: 'marmo', label: 'Marmo' },
      { value: 'ceramica', label: 'Ceramica' },
      { value: 'legno', label: 'Legno' },
      { value: 'materiali_misti', label: 'Materiali misti' },
    ],
  },
  {
    value: 'fotografia',
    label: 'Fotografia',
    subcategories: [
      { value: 'analogica', label: 'Analogica' },
      { value: 'digitale', label: 'Digitale' },
      { value: 'stampa_vintage', label: 'Stampa vintage' },
    ],
  },
  {
    value: 'grafica',
    label: 'Grafica',
    subcategories: [
      { value: 'incisione', label: 'Incisione' },
      { value: 'litografia', label: 'Litografia' },
      { value: 'serigrafia', label: 'Serigrafia' },
      { value: 'stampa', label: 'Stampa' },
      { value: 'stampa_digitale', label: 'Stampa digitale' },
    ],
  },
  {
    value: 'arte_contemporanea',
    label: 'Arte Contemporanea',
    subcategories: [
      { value: 'arte_digitale_nft', label: 'Arte digitale / NFT' },
      { value: 'installazioni', label: 'Installazioni' },
      { value: 'video_arte', label: 'Video arte / Arte multimediale' },
      { value: 'performance', label: 'Performance (video)' },
    ],
  },
  {
    value: 'arti_decorative',
    label: 'Arti Decorative',
    subcategories: [
      { value: 'ceramiche_porcellane', label: 'Ceramiche / Porcellane' },
      { value: 'gioielli', label: 'Gioielli d\'artista' },
      { value: 'arazzi_tessuti', label: 'Arazzi / Tessuti d\'arte' },
      { value: 'mobili_design', label: 'Mobili d\'autore / Design' },
    ],
  },
  {
    value: 'libri_documenti',
    label: 'Libri & Documenti',
    subcategories: [
      { value: 'libri_artista', label: 'Libri d\'artista' },
      { value: 'manoscritti', label: 'Manoscritti / Autografi' },
      { value: 'manifesti_poster', label: 'Manifesti / Poster d\'arte' },
    ],
  },
  {
    value: 'disegni',
    label: 'Disegni',
    subcategories: [
      { value: 'carboncino', label: 'Carboncino' },
      { value: 'matita', label: 'Matita' },
      { value: 'penna', label: 'Penna' },
      { value: 'pastello', label: 'Pastello' },
    ],
  },
  {
    value: 'altro',
    label: 'Altro',
    subcategories: [
      { value: 'non_specificato', label: 'Non specificato' },
    ],
  },
];

// Helper functions
export const getCategoryByValue = (value: string): Category | undefined => {
  return CATEGORIES.find(cat => cat.value === value);
};

export const getSubcategoryLabel = (categoryValue: string, subcategoryValue: string): string | null => {
  const category = getCategoryByValue(categoryValue);
  const subcategory = category?.subcategories.find(sub => sub.value === subcategoryValue);
  return subcategory?.label || null;
};

export const getCategoryLabel = (value: string): string => {
  const category = getCategoryByValue(value);
  return category?.label || value;
};

export const getFullCategoryPath = (categoryValue: string, subcategoryValue: string | null): string => {
  const categoryLabel = getCategoryLabel(categoryValue);
  
  if (!subcategoryValue) {
    return categoryLabel;
  }
  
  const subcategoryLabel = getSubcategoryLabel(categoryValue, subcategoryValue);
  
  if (subcategoryLabel) {
    return `${categoryLabel} › ${subcategoryLabel}`;
  }
  
  return categoryLabel;
};