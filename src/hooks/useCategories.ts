// src/hooks/useCategories.ts — VERSIONE CORRETTA COMPLETA

import { useTranslation } from 'react-i18next';
import { getCategories } from '../utils/categories';
import type { Category } from '../utils/categories';

export function useCategories(): Category[] {
  const { t } = useTranslation();
  // Restituisce direttamente l'array tradotto — niente useQuery
  // Le categorie sono statiche, non vengono da un DB
  return getCategories(t);
}