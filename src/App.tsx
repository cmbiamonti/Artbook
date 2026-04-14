// src/App.tsx

import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { Layout }        from './components/Layout/Layout';
import { Dashboard }     from './pages/Dashboard';
import { ArtworkDetail } from './components/Artworks/ArtworkDetail';
import { NewArtwork }    from './pages/NewArtwork';
import { EditArtwork }   from './pages/EditArtwork';

// ── QueryClient creato FUORI dal componente ───────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter
        future={{
          v7_startTransition:   true,
          v7_relativeSplatPath: true,
        }}
      >
        {/*
          Layout gestisce internamente:
          - Navbar (con pulsante ⚙️)
          - SettingsModal (con stato aperto/chiuso)
          - Footer
          Non servono prop aggiuntive né useState qui.
        */}
        <Layout>
          <Routes>
            <Route path="/"                  element={<Dashboard />} />
            <Route path="/artworks/:id"      element={<ArtworkDetail />} />
            <Route path="/artworks/:id/edit" element={<EditArtwork />} />
            <Route path="/artworks/new"      element={<NewArtwork />} />
            <Route path="*"                  element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>

      </HashRouter>

      {/* Toaster fuori da HashRouter per stacking context corretto */}
      <Toaster
        position="top-right"
        richColors
        expand={false}
        duration={3000}
      />
    </QueryClientProvider>
  );
}

export default App;