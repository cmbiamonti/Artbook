// src/components/Layout/Navbar.tsx

import { Link, useLocation } from 'react-router-dom';
import { Plus, Home, Upload, Settings } from 'lucide-react';
import { useCSVImport } from '../../hooks/useCSVImport';
import { useTranslation } from 'react-i18next';
import { LangSwitcher } from './LangSwitcher';

interface NavbarProps {
  onOpenSettings: () => void;
}

export const Navbar = ({ onOpenSettings }: NavbarProps) => {
  const { t } = useTranslation();
  const location = useLocation();
  const { importCSV, isImporting } = useCSVImport();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* ── Logo ─────────────────────────────────────────────────────── */}
          <Link
            to="/"
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <img
              src="/logo-krea4u.png"
              alt="Krea4U ArtBook"
              className="h-8 sm:h-10 w-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </Link>

          {/* ── Navigation ───────────────────────────────────────────────── */}
          <div className="flex items-center space-x-2">

            {/* Dashboard */}
            <Link
              to="/"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg
                          transition-colors ${
                isActive('/')
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Home className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>

            {/* Import CSV */}
            <button
              onClick={importCSV}
              disabled={isImporting}
              title={t('components.layout.navbar.importa_artworks_da_file')}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg
                         transition-colors text-gray-600
                         hover:bg-gray-100 hover:text-gray-900
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-5 h-5" />
              <span className="hidden sm:inline">
                {isImporting
                  ? t('components.layout.navbar.importando')
                  : t('components.layout.navbar.importa_csv')}
              </span>
            </button>

            {/* Nuovo Artwork */}
            <Link
              to="/artworks/new"
              className="flex items-center space-x-2 px-4 py-2 rounded-lg
                         bg-blue-600 text-white hover:bg-blue-700
                         transition-colors font-medium shadow-sm"
            >
              <Plus className="w-5 h-5" />
              <span>{t('components.layout.navbar.nuovo_artwork')}</span>
            </Link>

            {/* ── Pulsante Impostazioni ─────────────────────────────────── */}
            <button
              onClick={onOpenSettings}
              title={t('settings.title')}
              className="p-2 rounded-lg text-gray-500
                         hover:text-gray-800 hover:bg-gray-100
                         transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Selettore lingua */}
            <LangSwitcher />

          </div>
        </div>
      </div>
    </nav>
  );
};