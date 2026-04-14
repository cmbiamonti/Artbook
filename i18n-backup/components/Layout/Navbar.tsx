import { Link, useLocation } from 'react-router-dom';
import { Plus, Home, Upload } from 'lucide-react';
import { useCSVImport } from '../../hooks/useCSVImport';

export const Navbar = () => {
  const location = useLocation();
  const { importCSV, isImporting } = useCSVImport();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Krea4U */}
          <Link 
            to="/" 
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <img 
              src="/logo-krea4u.png" 
              alt="Krea4U ArtBook" 
              className="h-8 sm:h-10 w-auto"  // ← 32px su mobile, 40px su desktop
              onError={(e) => {
                    // Se il logo non carica, mostra testo
                    e.currentTarget.style.display = 'none';
                    const span = document.createElement('span');
                    span.className = 'text-2xl font-bold text-gray-900';
                    span.textContent = 'Krea4U ArtBook';
                    e.currentTarget.parentElement?.appendChild(span);
              }}
            />
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-3">
            <Link
              to="/"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isActive('/')
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Home className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>

            {/* Import CSV Button */}
            <button
              onClick={importCSV}
              disabled={isImporting}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Importa artworks da file CSV"
            >
              <Upload className="w-5 h-5" />
              <span className="hidden sm:inline">
                {isImporting ? 'Importando...' : 'Importa CSV'}
              </span>
            </button>

            {/* Nuovo Artwork Button */}
            <Link
              to="/artworks/new"
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium shadow-sm"
            >
              <Plus className="w-5 h-5" />
              <span>Nuovo Artwork</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};