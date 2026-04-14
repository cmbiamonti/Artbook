import React, { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { useCategories } from '../../hooks/useCategories';
import { useArtists } from '../../hooks/useArtists';
import type { ArtworkFilters } from '../../types/artwork.types';
import { useTranslation } from 'react-i18next';

interface FilterBarProps {
  filters: ArtworkFilters;
  onFiltersChange: (filters: ArtworkFilters) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFiltersChange,
}) => {
  // ✅ useTranslation chiamato a livello di componente — unica posizione corretta
  const { t } = useTranslation();

  // ✅ useCategories ora restituisce array diretto (non { data })
  // perché abbiamo rimosso useQuery nel passo precedente
  const categories = useCategories();
  const { data: artists = [] } = useArtists();

  const [searchTerm, setSearchTerm]               = useState(filters.search || '');
  const [selectedCategory, setSelectedCategory]   = useState(filters.category || '');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedArtist, setSelectedArtist]       = useState(filters.artist_id || '');
  const [yearFrom, setYearFrom]                   = useState(filters.year_from?.toString() || '');
  const [yearTo, setYearTo]                       = useState(filters.year_to?.toString() || '');
  const [showAdvanced, setShowAdvanced]           = useState(false);

  // Sottocategorie disponibili per la categoria selezionata
  const availableSubcategories = selectedCategory
    ? categories.find(cat => cat.value === selectedCategory)?.subcategories || []
    : [];

  // Reset sottocategoria quando cambia categoria
  useEffect(() => {
    setSelectedSubcategory('');
  }, [selectedCategory]);

  // ✅ handleApplyFilters è una funzione normale — NON chiama hook al suo interno
  const handleApplyFilters = () => {
    const newFilters: ArtworkFilters = {
      search:      searchTerm      || undefined,
      category:    selectedCategory  || undefined,
      subcategory: selectedSubcategory || undefined,
      artist_id:   selectedArtist   || undefined,
      year_from:   yearFrom ? parseInt(yearFrom) : undefined,
      year_to:     yearTo   ? parseInt(yearTo)   : undefined,
    };
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedSubcategory('');
    setSelectedArtist('');
    setYearFrom('');
    setYearTo('');
    onFiltersChange({});
  };

  const hasActiveFilters =
    searchTerm || selectedCategory || selectedSubcategory ||
    selectedArtist || yearFrom || yearTo;

  return (
    <div className="card space-y-4">

      {/* ── Barra Ricerca Principale ── */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
            placeholder={t('components.artworks.filter_bar.cerca_per_titolo_o')}
            className="input pl-10 w-full"
          />
        </div>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`btn ${showAdvanced ? 'btn-primary' : 'btn-secondary'} flex items-center space-x-2`}
        >
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">
            {t('components.artworks.filter_bar.btn_filters')}
          </span>
        </button>

        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="btn btn-ghost flex items-center space-x-2 text-red-600 hover:bg-red-50"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">
              {t('components.artworks.filter_bar.btn_reset')}
            </span>
          </button>
        )}
      </div>

      {/* ── Filtri Avanzati ── */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t animate-fadeIn">

          {/* Categoria */}
          <div>
            <label className="label">
              {t('components.artworks.filter_bar.label_category')}
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input"
            >
              <option value="">
                {t('components.artworks.filter_bar.tutte_le_categorie')}
              </option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sottocategoria — appare solo se categoria selezionata */}
          {selectedCategory && availableSubcategories.length > 0 && (
            <div>
              <label className="label">
                {t('components.artworks.filter_bar.label_subcategory')}
              </label>
              <select
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                className="input"
              >
                <option value="">
                  {t('components.artworks.filter_bar.tutte_le_sottocategorie')}
                </option>
                {availableSubcategories.map((sub) => (
                  <option key={sub.value} value={sub.value}>
                    {sub.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Artista */}
          <div>
            <label className="label">
              {t('components.artworks.filter_bar.artista')}
            </label>
            <select
              value={selectedArtist}
              onChange={(e) => setSelectedArtist(e.target.value)}
              className="input"
            >
              <option value="">
                {t('components.artworks.filter_bar.tutti_gli_artisti')}
              </option>
              {artists.map((artist) => (
                <option key={artist.id} value={artist.id}>
                  {artist.name}
                </option>
              ))}
            </select>
          </div>

          {/* Anno Da */}
          <div>
            <label className="label">
              {t('components.artworks.filter_bar.label_year_from')}
            </label>
            <input
              type="number"
              value={yearFrom}
              onChange={(e) => setYearFrom(e.target.value)}
              placeholder="Es: 1900"
              className="input"
              min="1"
              max={new Date().getFullYear()}
            />
          </div>

          {/* Anno A */}
          <div>
            <label className="label">
              {t('components.artworks.filter_bar.label_year_to')}
            </label>
            <input
              type="number"
              value={yearTo}
              onChange={(e) => setYearTo(e.target.value)}
              placeholder="Es: 2024"
              className="input"
              min="1"
              max={new Date().getFullYear()}
            />
          </div>

          {/* Pulsante Applica */}
          <div className="md:col-span-2 lg:col-span-4">
            <button
              onClick={handleApplyFilters}
              className="btn btn-primary w-full"
            >
              {t('components.artworks.filter_bar.btn_apply')}
            </button>
          </div>
        </div>
      )}

      {/* ── Badge Filtri Attivi ── */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">

          {searchTerm && (
            <span className="badge badge-primary">
              {t('components.artworks.filter_bar.badge_search')}: {searchTerm}
            </span>
          )}

          {selectedCategory && (
            <span className="badge badge-primary">
              {t('components.artworks.filter_bar.badge_category')}:{' '}
              {categories.find(c => c.value === selectedCategory)?.label}
            </span>
          )}

          {selectedSubcategory && (
            <span className="badge badge-primary">
              {t('components.artworks.filter_bar.badge_subcategory')}:{' '}
              {availableSubcategories.find(s => s.value === selectedSubcategory)?.label}
            </span>
          )}

          {selectedArtist && (
            <span className="badge badge-primary">
              {t('components.artworks.filter_bar.badge_artist')}:{' '}
              {artists.find(a => a.id === selectedArtist)?.name}
            </span>
          )}

          {yearFrom && (
            <span className="badge badge-primary">
              {t('components.artworks.filter_bar.badge_from')}: {yearFrom}
            </span>
          )}

          {yearTo && (
            <span className="badge badge-primary">
              {t('components.artworks.filter_bar.badge_to')}: {yearTo}
            </span>
          )}

        </div>
      )}
    </div>
  );
};