// src/components/Layout/Layout.tsx

import { useState, ReactNode } from 'react';
import { Navbar }        from './Navbar';
import { SettingsModal } from '../Settings/SettingsModal';
import { useTranslation } from 'react-i18next';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { t } = useTranslation();

  // ── State modale impostazioni ───────────────────────────────────────────────
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar — riceve la callback per aprire il modale */}
      <Navbar onOpenSettings={() => setSettingsOpen(true)} />

      {/* Contenuto pagina */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            {t('layout.footer', { year: new Date().getFullYear() })}
          </p>
        </div>
      </footer>

      {/* Modale impostazioni — montato una volta sola nel layout */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

    </div>
  );
};