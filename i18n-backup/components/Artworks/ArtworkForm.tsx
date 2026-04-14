import React from 'react';
import { useForm } from 'react-hook-form';
import { useArtists } from '../../hooks/useArtists';
import { useState, useEffect } from 'react';
import { Loader2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { CATEGORIES, getCategoryByValue } from '../../utils/categories';
import { ImageGallery } from './ImageGallery'; // ✅ IMPORT GALLERIA
import type { Artwork, CreateArtworkData, UpdateArtworkData } from '../../types/artwork.types';

interface ArtworkFormProps {
  artwork?: Artwork;
  onSubmit: (data: CreateArtworkData | UpdateArtworkData) => Promise<any>; // ✅ Restituisce artwork creato
  isEdit?: boolean;
}

export const ArtworkForm: React.FC<ArtworkFormProps> = ({ 
  artwork, 
  onSubmit,
}) => {
  const { data: artists = [], isLoading: artistsLoading } = useArtists();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]); // ✅ ARRAY IMMAGINI
  
  const [artistInputMode, setArtistInputMode] = useState<'select' | 'input'>('select');
  const [customArtistName, setCustomArtistName] = useState('');
  
  const [sectionsExpanded, setSectionsExpanded] = useState({
    basic: true,
    identification: false,
    logistics: false,
    market: false,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateArtworkData>({
    defaultValues: artwork ? {
      title: artwork.title,
      artist_id: artwork.artist_id || undefined,
      category: artwork.category,
      subcategory: artwork.subcategory || undefined,
      year: artwork.year || undefined,
      technique: artwork.technique || undefined,
      dimensions: artwork.dimensions || undefined,
      estimated_value: artwork.estimated_value || undefined,
      description: artwork.description || undefined,
      
      catalog_number: artwork.catalog_number || undefined,
      certificate_authenticity: artwork.certificate_authenticity || undefined,
      certificate_number: artwork.certificate_number || undefined,
      artist_signature: artwork.artist_signature || undefined,
      condition_state: artwork.condition_state || undefined,
      edition_number: artwork.edition_number || undefined,
      
      current_location: artwork.current_location || undefined,
      location_details: artwork.location_details || undefined,
      insurance_value: artwork.insurance_value || undefined,
      insurance_company: artwork.insurance_company || undefined,
      insurance_expiry: artwork.insurance_expiry || undefined,
      frame_included: artwork.frame_included || undefined,
      frame_description: artwork.frame_description || undefined,
      
      purchase_price: artwork.purchase_price || undefined,
      purchase_date: artwork.purchase_date || undefined,
      seller_gallery: artwork.seller_gallery || undefined,
      provenance: artwork.provenance || undefined,
      available_for_sale: artwork.available_for_sale || undefined,
      asking_price: artwork.asking_price || undefined,
    } : {
      category: 'dipinti',
      subcategory: undefined,
      certificate_authenticity: undefined,
      artist_signature: undefined,
      condition_state: undefined,
      current_location: undefined,
      frame_included: undefined,
      available_for_sale: undefined,
    },
  });

  const certificateAuth = watch('certificate_authenticity');
  const frameIncluded = watch('frame_included');
  const availableForSale = watch('available_for_sale');
  const selectedCategory = watch('category');

  const availableSubcategories = selectedCategory 
    ? getCategoryByValue(selectedCategory)?.subcategories || []
    : [];

  useEffect(() => {
    setValue('subcategory', '');
  }, [selectedCategory, setValue]);

  const toggleSection = (section: keyof typeof sectionsExpanded) => {
    setSectionsExpanded(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // ✅ CALLBACK GALLERIA (per nuovo artwork)
  const handleImagesChange = (files: File[]) => {
    console.log('📸 Images changed:', files.length);
    setImageFiles(files);
  };

  const onFormSubmit = async (data: CreateArtworkData) => {
    try {
      setIsSubmitting(true);

      console.log('═══════════════════════════════════════');
      console.log('📝 FORM SUBMIT');
      console.log('📥 Form data:', data);
      console.log('📸 Image files count:', imageFiles.length);
      console.log('═══════════════════════════════════════');

      if (!window.electronAPI) {
        console.error('❌ electronAPI is not available!');
        toast.error('Errore: API Electron non disponibile');
        setIsSubmitting(false);
        return;
      }

      let finalData: any = { ...data };
      
      // Converti valori numerici
      if (finalData.year) finalData.year = parseInt(finalData.year as any);
      if (finalData.estimated_value) finalData.estimated_value = parseFloat(finalData.estimated_value as any);
      if (finalData.insurance_value) finalData.insurance_value = parseFloat(finalData.insurance_value as any);
      if (finalData.purchase_price) finalData.purchase_price = parseFloat(finalData.purchase_price as any);
      if (finalData.asking_price) finalData.asking_price = parseFloat(finalData.asking_price as any);

      // Gestisci artista personalizzato
      if (artistInputMode === 'input' && customArtistName.trim()) {
        const artistResult = await window.electronAPI.createArtist({
          name: customArtistName.trim()
        });
        
        if (artistResult.success && artistResult.data) {
          finalData.artist_id = artistResult.data.id;
          toast.success(`Artista "${customArtistName}" creato`);
        } else {
          throw new Error(artistResult.error || 'Failed to create artist');
        }
      }

      // ✅ RIMUOVI CAMPI IMMAGINE (usa galleria)
      delete finalData.image_path;
      delete finalData.imageFile;

      console.log('💾 Final data:', finalData);

      // ✅ CREA ARTWORK (senza immagini)
      const result = await onSubmit(finalData);

      console.log('📤 onSubmit result:', result);

      // ✅ VERIFICA CHE result CONTENGA L'ARTWORK CREATO
      if (!result || !result.id) {
        console.error('❌ No artwork ID returned:', result);
        throw new Error('Artwork creato ma senza ID');
      }

      const artworkId = result.id;
      console.log('✅ Artwork created with ID:', artworkId);

      // ✅ CARICA IMMAGINI NELLA GALLERIA
      if (!artwork && imageFiles.length > 0) {
        console.log(`📸 Uploading ${imageFiles.length} images...`);
        
        let uploadedCount = 0;
        
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          
          try {
            console.log(`📸 Uploading image ${i + 1}/${imageFiles.length}: ${file.name}`);
            
            // Leggi file
            const buffer = await file.arrayBuffer();
            console.log(`  📦 Buffer size: ${buffer.byteLength} bytes`);
            
            // Salva file
            const saveResult = await window.electronAPI.saveImage(buffer, file.name);
            console.log(`  📤 Save result:`, saveResult);
            
            if (!saveResult.success || !saveResult.data) {
              console.error(`  ❌ Failed to save image ${i + 1}:`, saveResult.error);
              continue;
            }
            
            const savedFilename = saveResult.data;
            console.log(`  ✅ Image saved as: ${savedFilename}`);
            
            // Aggiungi al database
            const isPrimary = i === 0; // Prima immagine = principale
            console.log(`  🔗 Adding to database (primary: ${isPrimary})...`);
            
            const addResult = await window.electronAPI.addArtworkImage(
              artworkId, 
              savedFilename, 
              isPrimary
            );
            
            console.log(`  📤 Add result:`, addResult);
            
            if (addResult.success) {
              uploadedCount++;
              console.log(`  ✅ Image ${i + 1} linked to artwork`);
            } else {
              console.error(`  ❌ Failed to link image ${i + 1}:`, addResult.error);
            }
            
          } catch (error) {
            console.error(`  ❌ Error processing image ${i + 1}:`, error);
          }
        }
        
        console.log('═══════════════════════════════════════');
        console.log(`✅ Upload completed: ${uploadedCount}/${imageFiles.length} images`);
        console.log('═══════════════════════════════════════');
        
        if (uploadedCount > 0) {
          toast.success(`Artwork creato con ${uploadedCount} immagine/i!`);
        } else {
          toast.warning('Artwork creato ma nessuna immagine caricata');
        }
      } else if (imageFiles.length === 0) {
        console.log('ℹ️ No images to upload');
        toast.success('Artwork creato!');
      } else {
        // Edit mode
        toast.success('Artwork aggiornato!');
      }
      
    } catch (error) {
      console.error('❌ Error submitting form:', error);
      console.error('❌ Stack:', (error as Error).stack);
      toast.error((error as Error).message || 'Errore durante il salvataggio');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
      
      {/* ==================== SEZIONE 1: INFORMAZIONI BASE ==================== */}
      <div className="card">
        <button
          type="button"
          onClick={() => toggleSection('basic')}
          className="w-full flex items-center justify-between mb-4"
        >
          <h2 className="text-xl font-bold text-gray-900">
            📝 Informazioni Base
          </h2>
          {sectionsExpanded.basic ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        {sectionsExpanded.basic && (
          <div className="space-y-6">
            {/* Titolo */}
            <div>
              <label htmlFor="title" className="label">
                Titolo <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                {...register('title', { required: 'Il titolo è obbligatorio' })}
                className="input"
                placeholder="Inserisci il titolo dell'opera"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Artista */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label">Artista</label>
                <button
                  type="button"
                  onClick={() => {
                    setArtistInputMode(mode => mode === 'select' ? 'input' : 'select');
                    setCustomArtistName('');
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>{artistInputMode === 'select' ? 'Nuovo artista' : 'Seleziona esistente'}</span>
                </button>
              </div>

              {artistInputMode === 'select' ? (
                <>
                  {artistsLoading ? (
                    <div className="flex items-center space-x-2 text-gray-500 py-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Caricamento artisti...</span>
                    </div>
                  ) : (
                    <select id="artist_id" {...register('artist_id')} className="input">
                      <option value="">Nessun artista</option>
                      {artists.map((artist: any) => (
                        <option key={artist.id} value={artist.id}>
                          {artist.name}
                        </option>
                      ))}
                    </select>
                  )}
                </>
              ) : (
                <input
                  type="text"
                  value={customArtistName}
                  onChange={(e) => setCustomArtistName(e.target.value)}
                  className="input"
                  placeholder="Cognome Nome (es: Rossi Mario)"
                />
              )}
            </div>

            {/* CATEGORIA */}
            <div>
              <label htmlFor="category" className="label">
                Categoria <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                {...register('category', { required: 'La categoria è obbligatoria' })}
                className="input"
              >
                <option value="">Seleziona categoria</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>

            {/* SOTTOCATEGORIA */}
            {selectedCategory && availableSubcategories.length > 0 && (
              <div className="animate-fadeIn">
                <label htmlFor="subcategory" className="label">
                  Sottocategoria
                </label>
                <select id="subcategory" {...register('subcategory')} className="input">
                  <option value="">Seleziona sottocategoria</option>
                  {availableSubcategories.map((sub) => (
                    <option key={sub.value} value={sub.value}>
                      {sub.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Specifica il tipo di {getCategoryByValue(selectedCategory)?.label.toLowerCase()}
                </p>
              </div>
            )}

            {/* Anno e Tecnica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="year" className="label">Anno</label>
                <input
                  id="year"
                  type="number"
                  {...register('year', {
                    min: { value: 1, message: 'Anno non valido' },
                    max: { value: new Date().getFullYear(), message: 'Anno non può essere futuro' }
                  })}
                  className="input"
                  placeholder="Es: 2024"
                />
                {errors.year && <p className="mt-1 text-sm text-red-600">{errors.year.message}</p>}
              </div>

              <div>
                <label htmlFor="technique" className="label">Tecnica</label>
                <input
                  id="technique"
                  type="text"
                  {...register('technique')}
                  className="input"
                  placeholder="Es: Olio su tela"
                />
              </div>
            </div>

            {/* Dimensioni */}
            <div>
              <label htmlFor="dimensions" className="label">Dimensioni</label>
              <input
                id="dimensions"
                type="text"
                {...register('dimensions')}
                className="input"
                placeholder="Es: 77 x 53 cm"
              />
            </div>

            {/* Valore Stimato */}
            <div>
              <label htmlFor="estimated_value" className="label">Valore Stimato (€)</label>
              <input
                id="estimated_value"
                type="number"
                step="0.01"
                {...register('estimated_value', {
                  min: { value: 0, message: 'Il valore deve essere positivo' }
                })}
                className="input"
                placeholder="Es: 50000"
              />
            </div>

            {/* Descrizione */}
            <div>
              <label htmlFor="description" className="label">Descrizione</label>
              <textarea
                id="description"
                {...register('description')}
                rows={4}
                className="input"
                placeholder="Descrizione dell'opera..."
              />
            </div>

            {/* ✅ GALLERIA IMMAGINI */}
            <div>
              <ImageGallery
                artworkId={artwork?.id}
                onImagesChange={handleImagesChange}
                maxImages={5}
              />
            </div>
          </div>
        )}
      </div>

      {/* ==================== SEZIONE 2: IDENTIFICAZIONE & DOCUMENTAZIONE ==================== */}
      <div className="card">
        <button
          type="button"
          onClick={() => toggleSection('identification')}
          className="w-full flex items-center justify-between mb-4"
        >
          <h2 className="text-xl font-bold text-gray-900">
            🔖 Identificazione & Documentazione
          </h2>
          {sectionsExpanded.identification ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        {sectionsExpanded.identification && (
          <div className="space-y-6">
            <div>
              <label htmlFor="catalog_number" className="label">
                Numero di Catalogo / Inventario
              </label>
              <input
                id="catalog_number"
                type="text"
                {...register('catalog_number')}
                className="input"
                placeholder="Es: KR-2024-001"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="certificate_authenticity" className="label">
                  Certificato di Autenticità
                </label>
                <select
                  id="certificate_authenticity"
                  {...register('certificate_authenticity')}
                  className="input"
                >
                  <option value="">Non specificato</option>
                  <option value="yes">Sì</option>
                  <option value="no">No</option>
                </select>
              </div>

              {certificateAuth === 'yes' && (
                <div>
                  <label htmlFor="certificate_number" className="label">
                    Numero Certificato
                  </label>
                  <input
                    id="certificate_number"
                    type="text"
                    {...register('certificate_number')}
                    className="input"
                    placeholder="Es: CERT-2024-12345"
                  />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="artist_signature" className="label">
                Firma dell'Artista
              </label>
              <select
                id="artist_signature"
                {...register('artist_signature')}
                className="input"
              >
                <option value="">Non specificato</option>
                <option value="yes">Sì</option>
                <option value="no">No</option>
                <option value="unverifiable">Non verificabile</option>
              </select>
            </div>

            <div>
              <label htmlFor="condition_state" className="label">
                Stato di Conservazione
              </label>
              <select
                id="condition_state"
                {...register('condition_state')}
                className="input"
              >
                <option value="">Non specificato</option>
                <option value="excellent">Eccellente</option>
                <option value="good">Buono</option>
                <option value="fair">Discreto</option>
                <option value="needs_restoration">Da restaurare</option>
              </select>
            </div>

            <div>
              <label htmlFor="edition_number" className="label">
                Numero di Edizione
              </label>
              <input
                id="edition_number"
                type="text"
                {...register('edition_number')}
                className="input"
                placeholder="Es: 3/10"
              />
            </div>
          </div>
        )}
      </div>

      {/* ==================== SEZIONE 3: LOCALIZZAZIONE & LOGISTICA ==================== */}
      <div className="card">
        <button
          type="button"
          onClick={() => toggleSection('logistics')}
          className="w-full flex items-center justify-between mb-4"
        >
          <h2 className="text-xl font-bold text-gray-900">
            📍 Localizzazione & Logistica
          </h2>
          {sectionsExpanded.logistics ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        {sectionsExpanded.logistics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="current_location" className="label">
                  Ubicazione Attuale
                </label>
                <select
                  id="current_location"
                  {...register('current_location')}
                  className="input"
                >
                  <option value="">Non specificato</option>
                  <option value="studio">Studio</option>
                  <option value="warehouse">Magazzino</option>
                  <option value="on_loan">In prestito</option>
                  <option value="on_display">In mostra</option>
                  <option value="other">Altro</option>
                </select>
              </div>

              <div>
                <label htmlFor="location_details" className="label">
                  Dettagli Ubicazione
                </label>
                <input
                  id="location_details"
                  type="text"
                  {...register('location_details')}
                  className="input"
                  placeholder="Es: Galleria Nazionale, Roma"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="insurance_value" className="label">
                  Valore Assicurato (€)
                </label>
                <input
                  id="insurance_value"
                  type="number"
                  step="0.01"
                  {...register('insurance_value')}
                  className="input"
                  placeholder="Es: 100000"
                />
              </div>

              <div>
                <label htmlFor="insurance_company" className="label">
                  Compagnia Assicurazione
                </label>
                <input
                  id="insurance_company"
                  type="text"
                  {...register('insurance_company')}
                  className="input"
                  placeholder="Es: AXA Art"
                />
              </div>

              <div>
                <label htmlFor="insurance_expiry" className="label">
                  Scadenza Polizza
                </label>
                <input
                  id="insurance_expiry"
                  type="date"
                  {...register('insurance_expiry')}
                  className="input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="frame_included" className="label">
                  Cornice Inclusa
                </label>
                <select
                  id="frame_included"
                  {...register('frame_included')}
                  className="input"
                >
                  <option value="">Non specificato</option>
                  <option value="yes">Sì</option>
                  <option value="no">No</option>
                </select>
              </div>

              {frameIncluded === 'yes' && (
                <div>
                  <label htmlFor="frame_description" className="label">
                    Descrizione Cornice
                  </label>
                  <input
                    id="frame_description"
                    type="text"
                    {...register('frame_description')}
                    className="input"
                    placeholder="Es: Cornice dorata d'epoca"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ==================== SEZIONE 4: MERCATO & TRANSAZIONI ==================== */}
      <div className="card">
        <button
          type="button"
          onClick={() => toggleSection('market')}
          className="w-full flex items-center justify-between mb-4"
        >
          <h2 className="text-xl font-bold text-gray-900">
            💰 Mercato & Transazioni
          </h2>
          {sectionsExpanded.market ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        {sectionsExpanded.market && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="purchase_price" className="label">
                  Prezzo di Acquisto (€)
                </label>
                <input
                  id="purchase_price"
                  type="number"
                  step="0.01"
                  {...register('purchase_price')}
                  className="input"
                  placeholder="Es: 30000"
                />
              </div>

              <div>
                <label htmlFor="purchase_date" className="label">
                  Data di Acquisto
                </label>
                <input
                  id="purchase_date"
                  type="date"
                  {...register('purchase_date')}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label htmlFor="seller_gallery" className="label">
                Venditore / Galleria di Provenienza
              </label>
              <input
                id="seller_gallery"
                type="text"
                {...register('seller_gallery')}
                className="input"
                placeholder="Es: Galleria Borghese, Roma"
              />
            </div>

            <div>
              <label htmlFor="provenance" className="label">
                Provenienza
              </label>
              <textarea
                id="provenance"
                {...register('provenance')}
                rows={3}
                className="input"
                placeholder="Es: Collezione privata famiglia Rossi (1950-2020)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="available_for_sale" className="label">
                  Disponibile per Vendita
                </label>
                <select
                  id="available_for_sale"
                  {...register('available_for_sale')}
                  className="input"
                >
                  <option value="">Non specificato</option>
                  <option value="yes">Sì</option>
                  <option value="no">No</option>
                </select>
              </div>

              {availableForSale === 'yes' && (
                <div>
                  <label htmlFor="asking_price" className="label">
                    Prezzo Richiesto (€)
                  </label>
                  <input
                    id="asking_price"
                    type="number"
                    step="0.01"
                    {...register('asking_price')}
                    className="input"
                    placeholder="Es: 50000"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ==================== PULSANTI ==================== */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Salvataggio...
            </>
          ) : (
            <>
              {artwork ? 'Aggiorna' : 'Crea'} Artwork
            </>
          )}
        </button>
      </div>
    </form>
  );
};