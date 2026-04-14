import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useArtwork, useDeleteArtwork } from '../../hooks/useArtworks';
import {
  ArrowLeft, Edit, Trash2, Download, Calendar, User as UserIcon,
  Tag, Ruler, Palette, FileText, DollarSign, Loader2, MapPin,
  Shield, Award, CheckCircle2, XCircle, AlertCircle, Package,
  TrendingUp, Building2, Frame,
} from 'lucide-react';
import { generatePDF } from '../../utils/pdf';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ImageGallery } from './ImageGallery';
import { ImageManager } from './ImageManager';
import { getFullCategoryPath } from '../../utils/categories';
import { useTranslation } from 'react-i18next';

export const ArtworkDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: artwork, isLoading, refetch } = useArtwork(id!);
  const deleteArtwork = useDeleteArtwork();
  const [activeTab, setActiveTab] = useState<'view' | 'manage'>('view');

  React.useEffect(() => {
    if (id) refetch();
  }, [id, refetch]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">
          {t('components.artworks.artwork_detail.artwork_non_trovato')}
        </p>
        <button onClick={() => navigate('/')} className="mt-4 btn btn-primary">
          {t('components.artworks.artwork_detail.torna_alla_dashboard')}
        </button>
      </div>
    );
  }

  const handleDelete = async () => {
    if (window.confirm(t('components.artworks.artwork_detail.confirm_delete'))) {
      try {
        await deleteArtwork.mutateAsync(id!);
        navigate('/');
      } catch (error) {
        console.error('Error deleting artwork:', error);
      }
    }
  };

  const handleExportPDF = () => generatePDF([artwork]);

  // ── Helper traduzione valori — usano t() dal closure ─────────────────────
  const translateCondition = (condition: string | null) => {
    if (!condition) return null;
    const map: Record<string, string> = {
      excellent:         t('components.artworks.artwork_detail.condition_excellent'),
      good:              t('components.artworks.artwork_detail.condition_good'),
      fair:              t('components.artworks.artwork_detail.condition_fair'),
      needs_restoration: t('components.artworks.artwork_detail.condition_needs_restoration'),
    };
    return map[condition] || condition;
  };

  const translateLocation = (location: string | null) => {
    if (!location) return null;
    const map: Record<string, string> = {
      studio:      t('components.artworks.artwork_detail.location_studio'),
      warehouse:   t('components.artworks.artwork_detail.location_warehouse'),
      on_loan:     t('components.artworks.artwork_detail.location_on_loan'),
      on_display:  t('components.artworks.artwork_detail.location_on_display'),
      other:       t('components.artworks.artwork_detail.location_other'),
    };
    return map[location] || location;
  };

  const translateYesNo = (value: string | null) => {
    if (value === 'yes')          return t('components.artworks.artwork_detail.yes_value');
    if (value === 'no')           return t('components.artworks.artwork_detail.no_value');
    if (value === 'unverifiable') return t('components.artworks.artwork_detail.unverifiable_value');
    return null;
  };

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t('components.artworks.artwork_detail.torna_alla_dashboard')}</span>
        </button>

        <div className="flex items-center space-x-3 flex-wrap">
          <button
            onClick={handleExportPDF}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>{t('components.artworks.artwork_detail.export_pdf')}</span>
          </button>

          <button
            onClick={() => navigate(`/artworks/${id}/edit`)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Edit className="w-4 h-4" />
            <span className="hidden sm:inline">
              {t('components.artworks.artwork_detail.modifica')}
            </span>
          </button>

          <button
            onClick={handleDelete}
            className="btn btn-danger flex items-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">
              {t('components.artworks.artwork_detail.elimina')}
            </span>
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* COLONNA SINISTRA: GALLERIA */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="flex border-b bg-gray-50">
              <button
                onClick={() => setActiveTab('view')}
                className={`flex-1 px-6 py-3 font-medium text-sm transition-colors ${
                  activeTab === 'view'
                    ? 'text-blue-600 bg-white border-b-2 border-blue-600 -mb-px'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                📸 {t('components.artworks.artwork_detail.tab_gallery')}
              </button>
              <button
                onClick={() => setActiveTab('manage')}
                className={`flex-1 px-6 py-3 font-medium text-sm transition-colors ${
                  activeTab === 'manage'
                    ? 'text-blue-600 bg-white border-b-2 border-blue-600 -mb-px'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                ⚙️ {t('components.artworks.artwork_detail.tab_manage')}
              </button>
            </div>
            <div className="p-4">
              {activeTab === 'view' ? (
                <ImageGallery artworkId={artwork.id} maxImages={5} />
              ) : (
                <ImageManager artworkId={artwork.id} onImagesChange={refetch} />
              )}
            </div>
          </div>

          {/* Badge Status */}
          <div className="flex flex-wrap gap-2">
            {artwork.certificate_authenticity === 'yes' && (
              <span className="badge badge-success flex items-center space-x-1">
                <Award className="w-3 h-3" />
                <span>{t('components.artworks.artwork_detail.badge_certified')}</span>
              </span>
            )}
            {artwork.artist_signature === 'yes' && (
              <span className="badge badge-primary flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>{t('components.artworks.artwork_detail.badge_signed')}</span>
              </span>
            )}
            {artwork.frame_included === 'yes' && (
              <span className="badge badge-gray flex items-center space-x-1">
                <Frame className="w-3 h-3" />
                <span>{t('components.artworks.artwork_detail.con_cornice')}</span>
              </span>
            )}
            {artwork.available_for_sale === 'yes' && (
              <span className="badge badge-warning flex items-center space-x-1">
                <TrendingUp className="w-3 h-3" />
                <span>{t('components.artworks.artwork_detail.in_vendita')}</span>
              </span>
            )}
          </div>
        </div>

        {/* COLONNA DESTRA: DETTAGLI */}
        <div className="space-y-6">

          {/* Titolo e Artista */}
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{artwork.title}</h1>
            {artwork.artist_name && (
              <p className="text-xl text-gray-600 flex items-center space-x-2">
                <UserIcon className="w-5 h-5" />
                <span>{artwork.artist_name}</span>
              </p>
            )}
            {artwork.catalog_number && (
              <p className="text-sm text-gray-500 mt-2 font-mono">{artwork.catalog_number}</p>
            )}
          </div>

          {/* INFORMAZIONI BASE */}
          <div className="card space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
              {t('components.artworks.artwork_detail.section_basic')}
            </h2>

            {artwork.category && (
              <div className="flex items-start space-x-3">
                <Tag className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">
                    {t('components.artworks.artwork_detail.label_category')}
                  </p>
                  <p className="font-medium text-gray-900">
                    {/* ✅ CORRETTO: passa t come parametro */}
                    {getFullCategoryPath(artwork.category, artwork.subcategory, t)}
                  </p>
                </div>
              </div>
            )}

            {artwork.year && (
              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">
                    {t('components.artworks.artwork_detail.label_year')}
                  </p>
                  <p className="font-medium text-gray-900">{artwork.year}</p>
                </div>
              </div>
            )}

            {artwork.dimensions && (
              <div className="flex items-start space-x-3">
                <Ruler className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">
                    {t('components.artworks.artwork_detail.label_dimensions')}
                  </p>
                  <p className="font-medium text-gray-900">{artwork.dimensions}</p>
                </div>
              </div>
            )}

            {artwork.technique && (
              <div className="flex items-start space-x-3">
                <Palette className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">
                    {t('components.artworks.artwork_detail.label_technique')}
                  </p>
                  <p className="font-medium text-gray-900">{artwork.technique}</p>
                </div>
              </div>
            )}

            {artwork.estimated_value && (
              <div className="flex items-start space-x-3">
                <DollarSign className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">
                    {t('components.artworks.artwork_detail.label_estimated_value')}
                  </p>
                  <p className="font-semibold text-green-700 text-lg">
                    {formatCurrency(artwork.estimated_value)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* IDENTIFICAZIONE & DOCUMENTAZIONE */}
          {(artwork.certificate_authenticity || artwork.artist_signature ||
            artwork.condition_state || artwork.edition_number) && (
            <div className="card bg-blue-50 border-blue-200 space-y-3">
              <h3 className="text-lg font-semibold text-blue-900 flex items-center space-x-2">
                <Award className="w-5 h-5" />
                <span>{t('components.artworks.artwork_detail.section_identification')}</span>
              </h3>

              {artwork.certificate_authenticity && (
                <div className="flex items-center space-x-2 text-sm">
                  {artwork.certificate_authenticity === 'yes'
                    ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                    : <XCircle className="w-4 h-4 text-red-600" />}
                  <span className="font-medium">
                    {t('components.artworks.artwork_detail.certificato_di_autenticita')}
                  </span>
                  <span>{translateYesNo(artwork.certificate_authenticity)}</span>
                  {artwork.certificate_number && (
                    <span className="text-xs font-mono bg-blue-100 px-2 py-1 rounded">
                      {artwork.certificate_number}
                    </span>
                  )}
                </div>
              )}

              {artwork.artist_signature && (
                <div className="flex items-center space-x-2 text-sm">
                  {artwork.artist_signature === 'yes'
                    ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                    : artwork.artist_signature === 'no'
                    ? <XCircle className="w-4 h-4 text-red-600" />
                    : <AlertCircle className="w-4 h-4 text-yellow-600" />}
                  <span className="font-medium">
                    {t('components.artworks.artwork_detail.firma_dellartista')}
                  </span>
                  <span>{translateYesNo(artwork.artist_signature)}</span>
                </div>
              )}

              {artwork.condition_state && (
                <div className="flex items-center space-x-2 text-sm">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">
                    {t('components.artworks.artwork_detail.stato_di_conservazione')}
                  </span>
                  <span className={`badge ${
                    artwork.condition_state === 'excellent' ? 'badge-success' :
                    artwork.condition_state === 'good'      ? 'badge-primary' :
                    artwork.condition_state === 'fair'      ? 'badge-warning' :
                    'badge-danger'
                  }`}>
                    {translateCondition(artwork.condition_state)}
                  </span>
                </div>
              )}

              {artwork.edition_number && (
                <div className="flex items-center space-x-2 text-sm">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">
                    {t('components.artworks.artwork_detail.numero_di_edizione')}
                  </span>
                  <span className="font-mono">{artwork.edition_number}</span>
                </div>
              )}
            </div>
          )}

          {/* LOCALIZZAZIONE & LOGISTICA */}
          {(artwork.current_location || artwork.insurance_value || artwork.frame_included) && (
            <div className="card bg-purple-50 border-purple-200 space-y-3">
              <h3 className="text-lg font-semibold text-purple-900 flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>{t('components.artworks.artwork_detail.section_logistics')}</span>
              </h3>

              {artwork.current_location && (
                <div className="flex items-start space-x-2 text-sm">
                  <MapPin className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">
                      {t('components.artworks.artwork_detail.label_location')}:
                    </span>
                    <span className="ml-2">{translateLocation(artwork.current_location)}</span>
                    {artwork.location_details && (
                      <p className="text-xs text-purple-700 mt-1">{artwork.location_details}</p>
                    )}
                  </div>
                </div>
              )}

              {artwork.insurance_value && (
                <div className="flex items-start space-x-2 text-sm">
                  <Shield className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">
                      {t('components.artworks.artwork_detail.label_insurance')}:
                    </span>
                    <span className="ml-2 text-purple-700 font-semibold">
                      {formatCurrency(artwork.insurance_value)}
                    </span>
                    {artwork.insurance_company && (
                      <p className="text-xs text-purple-600 mt-1">
                        {artwork.insurance_company}
                        {artwork.insurance_expiry && (
                          ` • ${t('components.artworks.artwork_detail.label_expires')}: ${formatDate(artwork.insurance_expiry)}`
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {artwork.frame_included && (
                <div className="flex items-start space-x-2 text-sm">
                  <Frame className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">
                      {t('components.artworks.artwork_detail.label_frame')}:
                    </span>
                    <span className="ml-2">{translateYesNo(artwork.frame_included)}</span>
                    {artwork.frame_description && (
                      <p className="text-xs text-purple-700 mt-1">{artwork.frame_description}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MERCATO & TRANSAZIONI */}
          {(artwork.purchase_price || artwork.seller_gallery || artwork.available_for_sale) && (
            <div className="card bg-green-50 border-green-200 space-y-3">
              <h3 className="text-lg font-semibold text-green-900 flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>{t('components.artworks.artwork_detail.section_market')}</span>
              </h3>

              {artwork.purchase_price && (
                <div className="flex items-start space-x-2 text-sm">
                  <DollarSign className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">
                      {t('components.artworks.artwork_detail.prezzo_di_acquisto')}
                    </span>
                    <span className="ml-2 text-green-700 font-semibold">
                      {formatCurrency(artwork.purchase_price)}
                    </span>
                    {artwork.purchase_date && (
                      <p className="text-xs text-green-600 mt-1">
                        {t('components.artworks.artwork_detail.purchased_on')}{' '}
                        {formatDate(artwork.purchase_date)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {artwork.seller_gallery && (
                <div className="flex items-start space-x-2 text-sm">
                  <Building2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">
                      {t('components.artworks.artwork_detail.label_provenance_detail')}:
                    </span>
                    <p className="text-green-700 mt-1">{artwork.seller_gallery}</p>
                  </div>
                </div>
              )}

              {artwork.available_for_sale === 'yes' && (
                <div className="bg-green-100 border border-green-300 rounded-lg p-3">
                  <div className="flex items-center space-x-2 text-sm font-semibold text-green-900">
                    <TrendingUp className="w-4 h-4" />
                    <span>{t('components.artworks.artwork_detail.disponibile_per_vendita')}</span>
                  </div>
                  {artwork.asking_price && (
                    <p className="text-lg font-bold text-green-700 mt-2">
                      {t('components.artworks.artwork_detail.asking_price_label')}{' '}
                      {formatCurrency(artwork.asking_price)}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* PROVENIENZA */}
          {artwork.provenance && (
            <div className="card bg-amber-50 border-amber-200">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-amber-900 mb-1">
                    {t('components.artworks.artwork_detail.section_provenance')}
                  </h3>
                  <p className="text-amber-800 leading-relaxed whitespace-pre-line">
                    {artwork.provenance}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* DESCRIZIONE */}
          {artwork.description && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-3 text-gray-900">
                {t('components.artworks.artwork_detail.section_description')}
              </h3>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                {artwork.description}
              </p>
            </div>
          )}

          {/* METADATA */}
          <div className="card bg-gray-50">
            <h3 className="text-sm font-semibold mb-2 text-gray-700">
              {t('components.artworks.artwork_detail.section_metadata')}
            </h3>
            <div className="grid grid-cols-1 gap-3 text-sm text-gray-600">
              <div>
                <p className="font-medium text-gray-500">
                  {t('components.artworks.artwork_detail.label_id')}
                </p>
                <p className="font-mono text-xs truncate">{artwork.id}</p>
              </div>
              <div>
                <p className="font-medium text-gray-500">
                  {t('components.artworks.artwork_detail.creato_il')}
                </p>
                <p>{formatDate(artwork.created_at)}</p>
              </div>
              {artwork.updated_at && artwork.updated_at !== artwork.created_at && (
                <div>
                  <p className="font-medium text-gray-500">
                    {t('components.artworks.artwork_detail.last_updated')}
                  </p>
                  <p>{formatDate(artwork.updated_at)}</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};