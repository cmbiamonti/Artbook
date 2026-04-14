// src/components/Settings/SettingsModal.tsx

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ImageIcon,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen:  boolean;
  onClose: () => void;
}

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const { t } = useTranslation();

  const [currentLogo, setCurrentLogo] = useState<string | null>(null);
  const [isLoading,   setIsLoading]   = useState(true);
  const [isSaving,    setIsSaving]    = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error'; text: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef     = useRef<HTMLDivElement>(null);

  // ── Carica logo al mount / apertura modale ──────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const loadLogo = async () => {
      setIsLoading(true);
      try {
        const result = await window.electronAPI.getCustomLogo();
        setCurrentLogo(result.success && result.data ? result.data : null);
      } catch {
        setCurrentLogo(null);
      } finally {
        setIsLoading(false);
      }
    };
    loadLogo();
  }, [isOpen]);

  // ── Chiudi con ESC ───────────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return ()  => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // ── Blocca scroll body quando il modale è aperto ─────────────────────────
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // ── Upload logo ──────────────────────────────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowed.includes(file.type)) {
      showMessage('error', t('settings.logo.error_format'));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showMessage('error', t('settings.logo.error_size'));
      return;
    }

    setIsSaving(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      try {
        const result = await window.electronAPI.saveCustomLogo(base64);
        if (result.success) {
          setCurrentLogo(base64);
          showMessage('success', t('settings.logo.saved'));
        } else {
          showMessage('error', result.error || t('settings.logo.error_save'));
        }
      } catch {
        showMessage('error', t('settings.logo.error_save'));
      } finally {
        setIsSaving(false);
      }
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Elimina logo ─────────────────────────────────────────────────────────
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

  // ── Chiudi cliccando fuori dal modale ────────────────────────────────────
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center
                 bg-black/50 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg
                   max-h-[90vh] overflow-y-auto animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── Header modale ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4
                        border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {t('settings.title')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700
                       hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Corpo modale ─────────────────────────────────────────────── */}
        <div className="px-6 py-5 space-y-6">

          {/* ── Sezione logo ─────────────────────────────────────────── */}
          <div className="space-y-4">

            <div>
              <h3 className="text-base font-semibold text-gray-900">
                {t('settings.logo.title')}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {t('settings.logo.description')}
              </p>
            </div>

            {/* Anteprima */}
            {isLoading ? (
              <div className="w-full h-20 bg-gray-100 rounded-lg animate-pulse" />
            ) : (
              <div className="flex items-center gap-5">

                {/* Box anteprima logo */}
                <div
                  className="w-44 h-20 border-2 border-dashed border-gray-300
                              rounded-xl flex items-center justify-center
                              bg-gray-50 overflow-hidden flex-shrink-0"
                >
                  {currentLogo ? (
                    <img
                      src={currentLogo}
                      alt="Logo personalizzato"
                      className="max-w-full max-h-full object-contain p-2"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-gray-400">
                      <ImageIcon className="w-7 h-7 mb-1" />
                      <span className="text-xs">{t('settings.logo.no_logo')}</span>
                    </div>
                  )}
                </div>

                {/* Stato e specifiche */}
                <div className="flex-1 space-y-1.5">
                  {currentLogo ? (
                    <div className="flex items-center gap-1.5
                                    text-green-700 text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{t('settings.logo.active')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5
                                    text-gray-500 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{t('settings.logo.using_default')}</span>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {t('settings.logo.specs')}
                  </p>
                </div>
              </div>
            )}

            {/* Pulsanti */}
            <div className="flex items-center gap-3">
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

              {currentLogo && !isSaving && (
                <button
                  onClick={handleDelete}
                  className="btn btn-danger flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('settings.logo.btn_delete')}
                </button>
              )}
            </div>

            {/* Feedback */}
            {message && (
              <div className={`flex items-center gap-2 text-sm px-3 py-2
                              rounded-lg border ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border-green-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}>
                {message.type === 'success'
                  ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  : <AlertCircle  className="w-4 h-4 flex-shrink-0" />}
                <span>{message.text}</span>
              </div>
            )}
          </div>

          {/* ── Divisore — spazio per future sezioni impostazioni ─────── */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400 text-center">
              {t('settings.version', { version: '1.0' })}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};