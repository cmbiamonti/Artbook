import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Trash2, CheckCircle2, AlertCircle, ImageIcon } from 'lucide-react';

export const LogoSettings = () => {
  const { t } = useTranslation();

  const [currentLogo, setCurrentLogo]   = useState<string | null>(null);
  const [isLoading,   setIsLoading]     = useState(true);
  const [isSaving,    setIsSaving]      = useState(false);
  const [message,     setMessage]       = useState<{
    type: 'success' | 'error'; text: string
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Carica logo esistente al mount ────────────────────────────────────────
  useEffect(() => {
    const loadLogo = async () => {
      try {
        const result = await window.electronAPI.getCustomLogo();
        if (result.success && result.data) setCurrentLogo(result.data);
      } catch {
        // nessun logo salvato
      } finally {
        setIsLoading(false);
      }
    };
    loadLogo();
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // ── Upload ────────────────────────────────────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validazione tipo
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!allowed.includes(file.type)) {
      showMessage('error', t('settings.logo.error_format'));
      return;
    }

    // Validazione dimensione (max 2 MB)
    if (file.size > 2 * 1024 * 1024) {
      showMessage('error', t('settings.logo.error_size'));
      return;
    }

    setIsSaving(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target?.result as string;

        const result = await window.electronAPI.saveCustomLogo(base64);
        if (result.success) {
          setCurrentLogo(base64);
          showMessage('success', t('settings.logo.saved'));
        } else {
          showMessage('error', result.error || t('settings.logo.error_save'));
        }
        setIsSaving(false);
      };
      reader.readAsDataURL(file);
    } catch {
      showMessage('error', t('settings.logo.error_save'));
      setIsSaving(false);
    }

    // Reset input per permettere ricaricamento dello stesso file
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Elimina logo ──────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!window.confirm(t('settings.logo.confirm_delete'))) return;
    try {
      await window.electronAPI.deleteCustomLogo();
      setCurrentLogo(null);
      showMessage('success', t('settings.logo.deleted'));
    } catch {
      showMessage('error', t('settings.logo.error_delete'));
    }
  };

  if (isLoading) return null;

  return (
    <div className="card space-y-5">

      {/* Titolo sezione */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          {t('settings.logo.title')}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {t('settings.logo.description')}
        </p>
      </div>

      {/* Anteprima logo corrente */}
      <div className="flex items-center gap-6">
        <div className="w-48 h-20 border-2 border-dashed border-gray-300 rounded-lg
                        flex items-center justify-center bg-gray-50 overflow-hidden
                        flex-shrink-0">
          {currentLogo ? (
            <img
              src={currentLogo}
              alt="Logo personalizzato"
              className="max-w-full max-h-full object-contain p-2"
            />
          ) : (
            <div className="flex flex-col items-center text-gray-400">
              <ImageIcon className="w-8 h-8 mb-1" />
              <span className="text-xs">{t('settings.logo.no_logo')}</span>
            </div>
          )}
        </div>

        {/* Info e stato */}
        <div className="flex-1 space-y-1">
          {currentLogo ? (
            <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>{t('settings.logo.active')}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{t('settings.logo.using_default')}</span>
            </div>
          )}
          <p className="text-xs text-gray-400">
            {t('settings.logo.specs')}
          </p>
        </div>
      </div>

      {/* Pulsanti azione */}
      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">

        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.webp"
          onChange={handleFileSelect}
          className="hidden"
          id="logo-upload-input"
        />

        <label
          htmlFor="logo-upload-input"
          className={`btn btn-primary flex items-center gap-2 cursor-pointer
                      ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <Upload className="w-4 h-4" />
          {isSaving
            ? t('settings.logo.uploading')
            : currentLogo
              ? t('settings.logo.btn_change')
              : t('settings.logo.btn_upload')}
        </label>

        {currentLogo && (
          <button
            onClick={handleDelete}
            className="btn btn-danger flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {t('settings.logo.btn_delete')}
          </button>
        )}
      </div>

      {/* Messaggio feedback */}
      {message && (
        <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success'
            ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}
    </div>
  );
};