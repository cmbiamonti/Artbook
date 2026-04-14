import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useArtworks } from '../hooks/useArtworks';
import { ArtworkGrid } from '../components/Artworks/ArtworkGrid';
import { ArtworkList } from '../components/Artworks/ArtworkList';
import { FilterBar } from '../components/Artworks/FilterBar';
import {
  Palette,
  TrendingUp,
  Layers,
  Grid3x3,
  List,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import type { ArtworkFilters } from '../types/artwork.types';
import { useTranslation } from 'react-i18next';

type ViewMode = 'grid' | 'list';
type SortOrder = 'asc' | 'desc' | 'none';

export const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ArtworkFilters>({});
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortOrder, setSortOrder] = useState<SortOrder>('none');

  const { data: artworks = [], isLoading } = useArtworks(filters);

  // Sorting
  const sortedArtworks = useMemo(() => {
    if (sortOrder === 'none' || !artworks) return artworks;
    return [...artworks].sort((a, b) => {
      const titleA = a.title.toLowerCase();
      const titleB = b.title.toLowerCase();
      return sortOrder === 'asc'
        ? titleA.localeCompare(titleB, 'it-IT')
        : titleB.localeCompare(titleA, 'it-IT');
    });
  }, [artworks, sortOrder]);

  const handleSortToggle = () => {
    setSortOrder(current => {
      if (current === 'none') return 'asc';
      if (current === 'asc')  return 'desc';
      return 'none';
    });
  };

  const handleArtworkClick = (id: string) => navigate(`/artworks/${id}`);

  // Statistiche
  const totalValue      = artworks?.reduce((sum, art) => sum + (art.estimated_value || 0), 0) || 0;
  const categoriesCount = [...new Set(artworks?.map(a => a.category))].length;

  // Testo e icona del pulsante Sort — calcolati con t() ─────────────────────
  const sortConfig = {
    none: {
      icon:  <ArrowUpDown className="w-4 h-4" />,
      label: t('pages.dashboard.ordina'),
      title: t('pages.dashboard.ordina_title_nessuno'),
    },
    asc: {
      icon:  <ArrowUp className="w-4 h-4" />,
      label: 'A → Z',
      title: t('pages.dashboard.ordina_title_asc'),
    },
    desc: {
      icon:  <ArrowDown className="w-4 h-4" />,
      label: 'Z → A',
      title: t('pages.dashboard.ordina_title_desc'),
    },
  };

  const currentSort = sortConfig[sortOrder];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            {t('pages.dashboard.gestisci_la_tua_collezione')}
          </p>
        </div>
      </div>

      {/* Cards Statistiche */}
      {!isLoading && artworks && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">
                  {t('pages.dashboard.stat_opere')}
                </p>
                <p className="text-3xl font-bold text-blue-900">
                  {artworks.length}
                </p>
              </div>
              <Palette className="w-12 h-12 text-blue-500 opacity-50" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">
                  {t('pages.dashboard.stat_valore')}
                </p>
                <p className="text-3xl font-bold text-green-900">
                  €{totalValue.toLocaleString('it-IT')}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-500 opacity-50" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">
                  {t('pages.dashboard.stat_categorie')}
                </p>
                <p className="text-3xl font-bold text-purple-900">
                  {categoriesCount}
                </p>
              </div>
              <Layers className="w-12 h-12 text-purple-500 opacity-50" />
            </div>
          </div>

        </div>
      )}

      {/* Filtri e Controlli */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex-1 w-full lg:w-auto">
          <FilterBar filters={filters} onFiltersChange={setFilters} />
        </div>

        <div className="flex items-center gap-3 flex-wrap">

          {/* Sorting Button */}
          <button
            onClick={handleSortToggle}
            className={`btn flex items-center space-x-2 transition-all ${
              sortOrder === 'none'
                ? 'btn-secondary'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
            }`}
            title={currentSort.title}
          >
            {currentSort.icon}
            <span className="hidden sm:inline">{currentSort.label}</span>
          </button>

          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">
                {t('pages.dashboard.griglia')}
              </span>
            </button>

            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">
                {t('pages.dashboard.lista')}
              </span>
            </button>
          </div>

        </div>
      </div>

      {/* Artworks */}
      {viewMode === 'grid' ? (
        <ArtworkGrid
          artworks={sortedArtworks}
          isLoading={isLoading}
          onArtworkClick={handleArtworkClick}
        />
      ) : (
        <ArtworkList
          artworks={sortedArtworks}
          isLoading={isLoading}
          onArtworkClick={handleArtworkClick}
        />
      )}

    </div>
  );
};