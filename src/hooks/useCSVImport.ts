import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
// ✅ AGGIUNTO: import i18n per usare t() fuori dai componenti React
import i18n from '../i18n';

interface CSVRow {
  title: string;
  artist_name?: string;
  category: string;
  year?: string;
  technique?: string;
  dimensions?: string;
  estimated_value?: string;
  description?: string;
}

export function useCSVImport() {
  const [isImporting, setIsImporting] = useState(false);
  const queryClient = useQueryClient();

  const parseCSV = (csvContent: string): CSVRow[] => {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      // ✅ CORRETTO: usa i18n.t() per tradurre fuori dal componente React
      throw new Error(i18n.t('errors.csv_empty_or_invalid'));
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    if (!headers.includes('title') || !headers.includes('category')) {
      // ✅ CORRETTO: usa i18n.t() con la chiave corretta
      throw new Error(i18n.t('hooks.use_csv_import.csv_deve_contenere_almeno'));
    }

    const rows: CSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length !== headers.length) continue;

      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });

      rows.push(row as CSVRow);
    }

    return rows;
  };

  const importCSV = async () => {
    if (!window.electronAPI) {
      // ✅ CORRETTO: usa i18n.t()
      toast.error(i18n.t('errors.electron_only'));
      return;
    }

    try {
      setIsImporting(true);
      
      const response = await window.electronAPI.importCSV();
      
      if (!response.success || !response.data) {
        if (response.error !== i18n.t('errors.no_file_selected')) {
          // ✅ CORRETTO: usa i18n.t() per il messaggio di errore
          toast.error(response.error || i18n.t('errors.import_error'));
        }
        return;
      }

      const rows = parseCSV(response.data);
      
      if (rows.length === 0) {
        // ✅ CORRETTO: usa i18n.t()
        toast.warning(i18n.t('errors.csv_no_data'));
        return;
      }

      let imported = 0;
      let errors = 0;

      for (const row of rows) {
        try {
          let artistId = null;
          if (row.artist_name) {
            const artistsResponse = await window.electronAPI.getArtists();
            const existingArtist = artistsResponse.data?.find(
              (a: any) => a.name.toLowerCase() === row.artist_name!.toLowerCase()
            );

            if (existingArtist) {
              artistId = existingArtist.id;
            } else {
              const newArtistResponse = await window.electronAPI.createArtist({
                name: row.artist_name
              });
              if (newArtistResponse.success) {
                artistId = newArtistResponse.data.id;
              }
            }
          }

          await window.electronAPI.createArtwork({
            title: row.title,
            artist_id: artistId,
            category: row.category,
            year: row.year ? parseInt(row.year) : null,
            technique: row.technique || null,
            dimensions: row.dimensions || null,
            estimated_value: row.estimated_value ? parseFloat(row.estimated_value) : null,
            description: row.description || null,
          });

          imported++;
        } catch (error) {
          console.error('Error importing row:', row, error);
          errors++;
        }
      }

      queryClient.invalidateQueries({ queryKey: ['artworks'] });
      queryClient.invalidateQueries({ queryKey: ['artists'] });

      if (imported > 0) {
        // ✅ CORRETTO: usa i18n.t() con interpolazione per il conteggio
        toast.success(i18n.t('messages.csv_imported', { count: imported }));
      }
      if (errors > 0) {
        // ✅ CORRETTO: usa i18n.t() con interpolazione per il conteggio errori
        toast.warning(i18n.t('messages.csv_import_errors', { count: errors }));
      }

    } catch (error) {
      console.error('CSV Import error:', error);
      // ✅ CORRETTO: usa i18n.t() con interpolazione per il messaggio di errore
      toast.error(i18n.t('errors.import_error_detail', { message: (error as Error).message }));
    } finally {
      setIsImporting(false);
    }
  };

  return { importCSV, isImporting };
}