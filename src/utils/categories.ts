// src/utils/categories.ts
// ⚠️ File utility puro — nessun hook React, nessun import da react-i18next
// Le label tradotte si ottengono tramite getCategories(t) nei componenti

import { TFunction } from 'i18next';

export interface Subcategory {
  value: string;
  label: string;
}

export interface Category {
  value: string;
  label: string;
  subcategories: Subcategory[];
}

// ── Struttura statica con i soli VALUE (codici interni, non tradotti) ─────────
// Usata internamente per lookup per value

const CATEGORIES_RAW = [
  {
    value: 'dipinti',
    subcategories: ['olio', 'acquerello', 'acrilico', 'affresco'],
  },
  {
    value: 'sculture',
    subcategories: ['bronzo', 'marmo', 'ceramica', 'legno', 'materiali_misti'],
  },
  {
    value: 'fotografia',
    subcategories: ['analogica', 'digitale', 'stampa_vintage'],
  },
  {
    value: 'grafica',
    subcategories: ['incisione', 'litografia', 'serigrafia', 'stampa', 'stampa_digitale'],
  },
  {
    value: 'arte_contemporanea',
    subcategories: ['arte_digitale_nft', 'installazioni', 'video_arte', 'performance'],
  },
  {
    value: 'arti_decorative',
    subcategories: ['ceramiche_porcellane', 'gioielli', 'arazzi_tessuti', 'mobili_design'],
  },
  {
    value: 'libri_documenti',
    subcategories: ['libri_artista', 'manoscritti', 'manifesti_poster'],
  },
  {
    value: 'disegni',
    subcategories: ['carboncino', 'matita', 'penna', 'pastello'],
  },
  {
    value: 'altro',
    subcategories: ['non_specificato'],
  },
] as const;

// ── Funzione principale — chiamata nei componenti passando t ──────────────────
// Restituisce le categorie con le label tradotte nella lingua corrente

export const getCategories = (t: TFunction): Category[] => [
  {
    value: 'dipinti',
    label: t('categories.dipinti'),
    subcategories: [
      { value: 'olio',        label: t('categories.olio') },
      { value: 'acquerello',  label: t('categories.acquerello') },
      { value: 'acrilico',    label: t('categories.acrilico') },
      { value: 'affresco',    label: t('categories.affresco') },
    ],
  },
  {
    value: 'sculture',
    label: t('categories.sculture'),
    subcategories: [
      { value: 'bronzo',           label: t('categories.bronzo') },
      { value: 'marmo',            label: t('categories.marmo') },
      { value: 'ceramica',         label: t('categories.ceramica') },
      { value: 'legno',            label: t('categories.legno') },
      { value: 'materiali_misti',  label: t('categories.materiali_misti') },
    ],
  },
  {
    value: 'fotografia',
    label: t('categories.fotografia'),
    subcategories: [
      { value: 'analogica',      label: t('categories.analogica') },
      { value: 'digitale',       label: t('categories.digitale') },
      { value: 'stampa_vintage', label: t('categories.stampa_vintage') },
    ],
  },
  {
    value: 'grafica',
    label: t('categories.grafica'),
    subcategories: [
      { value: 'incisione',      label: t('categories.incisione') },
      { value: 'litografia',     label: t('categories.litografia') },
      { value: 'serigrafia',     label: t('categories.serigrafia') },
      { value: 'stampa',         label: t('categories.stampa') },
      { value: 'stampa_digitale',label: t('categories.stampa_digitale') },
    ],
  },
  {
    value: 'arte_contemporanea',
    label: t('categories.arte_contemporanea'),
    subcategories: [
      { value: 'arte_digitale_nft', label: t('categories.arte_digitale_nft') },
      { value: 'installazioni',     label: t('categories.installazioni') },
      { value: 'video_arte',        label: t('categories.video_arte') },
      { value: 'performance',       label: t('categories.performance') },
    ],
  },
  {
    value: 'arti_decorative',
    label: t('categories.arti_decorative'),
    subcategories: [
      { value: 'ceramiche_porcellane', label: t('categories.ceramiche_porcellane') },
      { value: 'gioielli',             label: t('categories.gioielli') },
      { value: 'arazzi_tessuti',       label: t('categories.arazzi_tessuti') },
      { value: 'mobili_design',        label: t('categories.mobili_design') },
    ],
  },
  {
    value: 'libri_documenti',
    label: t('categories.libri_documenti'),
    subcategories: [
      { value: 'libri_artista',    label: t('categories.libri_artista') },
      { value: 'manoscritti',      label: t('categories.manoscritti') },
      { value: 'manifesti_poster', label: t('categories.manifesti_poster') },
    ],
  },
  {
    value: 'disegni',
    label: t('categories.disegni'),
    subcategories: [
      { value: 'carboncino', label: t('categories.carboncino') },
      { value: 'matita',     label: t('categories.matita') },
      { value: 'penna',      label: t('categories.penna') },
      { value: 'pastello',   label: t('categories.pastello') },
    ],
  },
  {
    value: 'altro',
    label: t('categories.altro'),
    subcategories: [
      { value: 'non_specificato', label: t('categories.non_specificato') },
    ],
  },
];

// ── Helper functions — ricevono t per restituire label tradotte ───────────────

export const getCategoryByValue = (
  value: string,
  t: TFunction
): Category | undefined => {
  return getCategories(t).find(cat => cat.value === value);
};

export const getSubcategoryLabel = (
  categoryValue: string,
  subcategoryValue: string,
  t: TFunction
): string | null => {
  const category = getCategoryByValue(categoryValue, t);
  const subcategory = category?.subcategories.find(
    sub => sub.value === subcategoryValue
  );
  return subcategory?.label || null;
};

export const getCategoryLabel = (value: string, t: TFunction): string => {
  const category = getCategoryByValue(value, t);
  return category?.label || value;
};

export const getFullCategoryPath = (
  categoryValue: string,
  subcategoryValue: string | null,
  t: TFunction
): string => {
  const categoryLabel = getCategoryLabel(categoryValue, t);

  if (!subcategoryValue) return categoryLabel;

  const subcategoryLabel = getSubcategoryLabel(categoryValue, subcategoryValue, t);
  return subcategoryLabel ? `${categoryLabel} › ${subcategoryLabel}` : categoryLabel;
};