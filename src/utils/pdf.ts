import jsPDF from 'jspdf';
import type { Artwork } from '../types/artwork.types';
import { formatCurrency, formatDate } from './formatters';
import i18n from '../i18n';

const t = (key: string, opts?: Record<string, any>) => i18n.t(key, opts);

// ── Costanti header ───────────────────────────────────────────────────────────
const HEADER_HEIGHT   = 22;
const LOGO_MAX_HEIGHT = 16;
const LOGO_MAX_WIDTH  = 55;
const APP_NAME        = 'Krea4u - ArtBook';

// ── Helpers immagini ──────────────────────────────────────────────────────────

const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });

const getImageUrl = async (imagePath: string): Promise<string> => {
  if (!window.electronAPI) throw new Error('Electron API not available');
  const response = await window.electronAPI.getImagePath(imagePath);
  if (!response.success || !response.data)
    throw new Error(response.error || 'Failed to get image path');
  return response.data;
};

// ── Rileva formato immagine dalla data URL ────────────────────────────────────
// FIX ERRORE 2: evita di passare sempre 'JPEG' a jsPDF

const detectImageFormat = (dataUrl: string): string => {
  if (dataUrl.startsWith('data:image/png'))  return 'PNG';
  if (dataUrl.startsWith('data:image/webp')) return 'WEBP';
  if (dataUrl.startsWith('data:image/gif'))  return 'GIF';
  return 'JPEG'; // default
};

// ── Logo personalizzato ───────────────────────────────────────────────────────

const loadCustomLogo = async (): Promise<{
  dataUrl: string;
  nativeW: number;
  nativeH: number;
} | null> => {
  try {
    // FIX ERRORE 3: verifica esplicita del metodo
    if (!window.electronAPI?.getCustomLogo) return null;

    const result = await window.electronAPI.getCustomLogo();
    if (!result.success || !result.data) return null;

    const img = await loadImage(result.data);
    return {
      dataUrl: result.data,
      nativeW: img.naturalWidth,
      nativeH: img.naturalHeight,
    };
  } catch {
    return null;
  }
};

// ── Header PDF ────────────────────────────────────────────────────────────────

const drawHeader = async (
  pdf: jsPDF,
  pageWidth: number,
  margin: number
): Promise<void> => {
  const logo = await loadCustomLogo();

  if (logo) {
    // Sfondo bianco + bordo inferiore
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, HEADER_HEIGHT, 'F');
    pdf.setDrawColor(229, 231, 235);
    pdf.setLineWidth(0.5);
    pdf.line(0, HEADER_HEIGHT, pageWidth, HEADER_HEIGHT);

    // Calcola dimensioni logo con proporzioni
    const ratio = logo.nativeW / logo.nativeH;
    let logoH   = LOGO_MAX_HEIGHT;
    let logoW   = logoH * ratio;
    if (logoW > LOGO_MAX_WIDTH) {
      logoW = LOGO_MAX_WIDTH;
      logoH = logoW / ratio;
    }

    const logoY  = (HEADER_HEIGHT - logoH) / 2;
    const format = detectImageFormat(logo.dataUrl); // FIX ERRORE 2
    pdf.addImage(logo.dataUrl, format, margin, logoY, logoW, logoH);

    // Nome app a destra in grigio
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(156, 163, 175);
    pdf.text(APP_NAME, pageWidth - margin, HEADER_HEIGHT / 2 + 1.5, {
      align: 'right',
    });

  } else {
    // Header blu predefinito
    pdf.setFillColor(2, 132, 199);
    pdf.rect(0, 0, pageWidth, HEADER_HEIGHT, 'F');
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(APP_NAME, pageWidth / 2, HEADER_HEIGHT / 2 + 3, {
      align: 'center',
    });
  }
};

// ── Traduzione valori enum ────────────────────────────────────────────────────

const translateValue = (field: string, value: any): string => {
  const keyMap: Record<string, Record<string, string>> = {
    certificate_authenticity: {
      yes: 'common.yes',
      no:  'common.no',
    },
    artist_signature: {
      yes:          'common.yes',
      no:           'common.no',
      unverifiable: 'components.artworks.artwork_form.non_verificabile',
    },
    condition_state: {
      excellent:         'pdf.condition.excellent',
      good:              'pdf.condition.good',
      fair:              'pdf.condition.fair',
      needs_restoration: 'components.artworks.artwork_form.da_restaurare',
    },
    current_location: {
      studio:     'pdf.location.studio',
      warehouse:  'pdf.location.warehouse',
      on_loan:    'components.artworks.artwork_form.in_prestito',
      on_display: 'components.artworks.artwork_form.in_mostra',
      other:      'pdf.location.other',
    },
    frame_included:     { yes: 'common.yes', no: 'common.no' },
    available_for_sale: { yes: 'common.yes', no: 'common.no' },
  };

  const i18nKey = keyMap[field]?.[value];
  if (i18nKey) return t(i18nKey);
  return value?.toString() || '';
};

// ── Generatore PDF principale ─────────────────────────────────────────────────

export const generatePDF = async (artworks: Artwork[]) => {
  const pdf        = new jsPDF('p', 'mm', 'a4');
  const pageWidth  = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin       = 15;
  const contentWidth = pageWidth - 2 * margin;

  for (let i = 0; i < artworks.length; i++) {
    const artwork = artworks[i];
    if (i > 0) pdf.addPage();

    // ── Header ───────────────────────────────────────────────────────────────
    await drawHeader(pdf, pageWidth, margin);
    let yPosition = HEADER_HEIGHT + 7;

    // ── Titolo e Artista ──────────────────────────────────────────────────────
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(31, 41, 55);
    const titleLines = pdf.splitTextToSize(artwork.title, contentWidth);
    pdf.text(titleLines, margin, yPosition);
    yPosition += titleLines.length * 7;

    if (artwork.artist_name) {
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(75, 85, 99);
      pdf.text(artwork.artist_name, margin, yPosition);
      yPosition += 8;
    }

    pdf.setDrawColor(229, 231, 235);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // ── Galleria immagini ─────────────────────────────────────────────────────
    try {
      const imagesResult = await window.electronAPI.getArtworkImages(artwork.id);

      // FIX ERRORE 5: controllo esplicito senza optional chaining su >
      if (
        imagesResult.success &&
        imagesResult.data &&
        imagesResult.data.length > 0
      ) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(31, 41, 55);
        pdf.text(
          t('pdf.gallery_title', { count: imagesResult.data.length }),
          margin, yPosition
        );
        yPosition += 8;

        const imagesPerRow   = 3;
        const imageBoxWidth  = (contentWidth - (imagesPerRow - 1) * 5) / imagesPerRow;
        const imageBoxHeight = imageBoxWidth * 0.75;
        const gap            = 5;
        const images         = imagesResult.data;

        // FIX ERRORE 4: gestione corretta currentRowStart nelle nuove pagine
        let currentRowStart = yPosition;
        let currentPage     = 0;

        for (let idx = 0; idx < images.length; idx++) {
          const col  = idx % imagesPerRow;
          const row  = Math.floor(idx / imagesPerRow);
          const imgX = margin + col * (imageBoxWidth + gap);
          const imgY = currentRowStart + row * (imageBoxHeight + gap);

          if (imgY + imageBoxHeight > pageHeight - 20) {
            pdf.addPage();
            currentPage++;
            currentRowStart = margin;
            // Ridisegna l'header nella nuova pagina della galleria
            await drawHeader(pdf, pageWidth, margin);
            const newImgY = currentRowStart + (idx % imagesPerRow === 0
              ? 0
              : Math.floor((idx - currentPage * imagesPerRow) % imagesPerRow)
                * (imageBoxHeight + gap));
            await drawImageInGrid(
              pdf, images[idx], imgX, currentRowStart, imageBoxWidth, imageBoxHeight
            );
          } else {
            await drawImageInGrid(pdf, images[idx], imgX, imgY, imageBoxWidth, imageBoxHeight);
          }
        }

        const totalRows = Math.ceil(images.length / imagesPerRow);
        yPosition = currentRowStart + totalRows * (imageBoxHeight + gap) + 10;
      }
    } catch (error) {
      console.error('Error loading gallery:', error);
    }

    // ── Informazioni Base ─────────────────────────────────────────────────────
    const categoryLabel = artwork.category
      ? t(`categories.${artwork.category}`, { defaultValue: artwork.category })
      : null;
    const subcategoryLabel = artwork.subcategory
      ? t(`categories.${artwork.subcategory}`, { defaultValue: artwork.subcategory })
      : null;

    yPosition = addInfoSection(pdf, t('pdf.sections.basic_info'), [
      [t('pdf.fields.category'),        categoryLabel],
      [t('pdf.fields.subcategory'),     subcategoryLabel],
      [t('pdf.fields.year'),            artwork.year],
      [t('pdf.fields.dimensions'),      artwork.dimensions],
      [t('pdf.fields.technique'),       artwork.technique],
      [t('pdf.fields.estimated_value'), artwork.estimated_value
        ? formatCurrency(artwork.estimated_value) : null],
    ], yPosition, pageHeight, margin, contentWidth, 249, 250, 251);

    // ── Identificazione ───────────────────────────────────────────────────────
    yPosition = addInfoSection(pdf, t('pdf.sections.identification'), [
      [t('pdf.fields.catalog_number'),     artwork.catalog_number],
      [t('pdf.fields.certificate'),        artwork.certificate_authenticity,
                                           'certificate_authenticity'],
      [t('pdf.fields.certificate_number'), artwork.certificate_number],
      [t('pdf.fields.signature'),          artwork.artist_signature,
                                           'artist_signature'],
      [t('pdf.fields.condition'),          artwork.condition_state,
                                           'condition_state'],
      [t('pdf.fields.edition_number'),     artwork.edition_number],
    ], yPosition, pageHeight, margin, contentWidth, 239, 246, 255);

    // ── Localizzazione ────────────────────────────────────────────────────────
    yPosition = addInfoSection(pdf, t('pdf.sections.logistics'), [
      [t('pdf.fields.location'),          artwork.current_location,
                                          'current_location'],
      [t('pdf.fields.location_details'),  artwork.location_details],
      [t('pdf.fields.insurance_value'),   artwork.insurance_value
        ? formatCurrency(artwork.insurance_value) : null],
      [t('pdf.fields.insurance_company'), artwork.insurance_company],
      [t('pdf.fields.insurance_expiry'),  artwork.insurance_expiry
        ? formatDate(artwork.insurance_expiry) : null],
      [t('pdf.fields.frame_included'),    artwork.frame_included,
                                          'frame_included'],
      [t('pdf.fields.frame_description'), artwork.frame_description],
    ], yPosition, pageHeight, margin, contentWidth, 243, 232, 255);

    // ── Mercato ───────────────────────────────────────────────────────────────
    yPosition = addInfoSection(pdf, t('pdf.sections.market'), [
      [t('pdf.fields.purchase_price'),     artwork.purchase_price
        ? formatCurrency(artwork.purchase_price) : null],
      [t('pdf.fields.purchase_date'),      artwork.purchase_date
        ? formatDate(artwork.purchase_date) : null],
      [t('pdf.fields.seller'),             artwork.seller_gallery],
      [t('pdf.fields.available_for_sale'), artwork.available_for_sale,
                                           'available_for_sale'],
      [t('pdf.fields.asking_price'),       artwork.asking_price
        ? formatCurrency(artwork.asking_price) : null],
    ], yPosition, pageHeight, margin, contentWidth, 236, 253, 245);

    // ── Provenienza ───────────────────────────────────────────────────────────
    if (artwork.provenance) {
      yPosition = addTextSection(
        pdf, t('pdf.sections.provenance'),
        artwork.provenance, yPosition, pageHeight, margin, contentWidth
      );
    }

    // ── Descrizione ───────────────────────────────────────────────────────────
    if (artwork.description) {
      yPosition = addTextSection(
        pdf, t('pdf.sections.description'),
        artwork.description, yPosition, pageHeight, margin, contentWidth
      );
    }

    // ── Footer ────────────────────────────────────────────────────────────────
    const footerY = pageHeight - 10;
    pdf.setFontSize(8);
    pdf.setTextColor(156, 163, 175);
    pdf.setFont('helvetica', 'italic');
    pdf.text(
      t('pdf.footer.generated', { date: formatDate(new Date().toISOString()) }),
      margin, footerY
    );
    pdf.text(
      t('pdf.footer.page', { current: i + 1, total: artworks.length }),
      pageWidth - margin, footerY, { align: 'right' }
    );
    pdf.setFontSize(6);
    pdf.text(`ID: ${artwork.id}`, pageWidth / 2, footerY, { align: 'center' });
  }

  const fileName = artworks.length === 1
    ? `${artworks[0].title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`
    : `artbook_export_${Date.now()}.pdf`;

  pdf.save(fileName);
};

// ── Helper: disegna immagine nella griglia ────────────────────────────────────

async function drawImageInGrid(
  pdf: jsPDF, imageData: any,
  x: number, y: number,
  boxWidth: number, boxHeight: number
) {
  try {
    const imageUrl = await getImageUrl(imageData.image_path);
    const img      = await loadImage(imageUrl);

    let imgW = boxWidth - 4;
    let imgH = (img.height * imgW) / img.width;
    if (imgH > boxHeight - 4) {
      imgH = boxHeight - 4;
      imgW = (img.width * imgH) / img.height;
    }

    const imgX   = x + (boxWidth  - imgW) / 2;
    const imgY   = y + (boxHeight - imgH) / 2;

    pdf.setDrawColor(229, 231, 235);
    pdf.setFillColor(255, 255, 255);
    pdf.rect(x, y, boxWidth, boxHeight, 'FD');

    // FIX ERRORE 2: usa JPEG per le immagini della galleria artwork
    // (sono sempre salvate come JPEG da Electron)
    pdf.addImage(imageUrl, 'JPEG', imgX, imgY, imgW, imgH);

    if (imageData.is_primary === 1) {
      pdf.setFillColor(234, 179, 8);
      pdf.rect(x + 2, y + 2, 25, 5, 'F');
      pdf.setFontSize(7);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.text(t('pdf.primary_badge'), x + 4, y + 5);
    }

  } catch {
    pdf.setDrawColor(229, 231, 235);
    pdf.setFillColor(249, 250, 251);
    pdf.rect(x, y, boxWidth, boxHeight, 'FD');
    pdf.setFontSize(8);
    pdf.setTextColor(156, 163, 175);
    pdf.text(
      t('components.artworks.image_gallery.immagine_non_disponibile'),
      x + boxWidth / 2,
      y + boxHeight / 2,
      { align: 'center' }
    );
  }
}

// ── Helper: sezione informazioni con box colorato ─────────────────────────────

function addInfoSection(
  pdf: jsPDF,
  title: string,
  data: Array<[string, any, string?]>,
  yPosition: number,
  pageHeight: number,
  margin: number,
  contentWidth: number,
  bgR: number,
  bgG: number,
  bgB: number
): number {
  const validData = data.filter(([_, v]) => v != null && v !== '');
  if (validData.length === 0) return yPosition;

  if (yPosition > pageHeight - 60) {
    pdf.addPage();
    yPosition = margin;
  }

  // FIX ERRORE 1: Math.max(0, ...) per evitare valori RGB negativi
  pdf.setFillColor(
    Math.max(0, bgR - 20),
    Math.max(0, bgG - 20),
    Math.max(0, bgB - 20)
  );
  pdf.rect(margin, yPosition - 5, contentWidth, 7, 'F');

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(31, 41, 55);
  pdf.text(title, margin + 2, yPosition);
  yPosition += 10;

  const containerStartY = yPosition;
  pdf.setFontSize(9);

  validData.forEach(([label, value, translateKey]) => {
    if (yPosition > pageHeight - 25) {
      pdf.addPage();
      yPosition = margin + 3;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(107, 114, 128);
    pdf.text(`${label}:`, margin + 3, yPosition);

    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(31, 41, 55);

    const displayValue = translateKey
      ? translateValue(translateKey, value)
      : value.toString();

    const lines = pdf.splitTextToSize(displayValue, contentWidth - 55);
    lines.forEach((line: string, idx: number) => {
      if (idx > 0) yPosition += 4;
      pdf.text(line, margin + 50, yPosition);
    });
    yPosition += 5;
  });

  yPosition += 2;
  pdf.rect(
    margin,
    containerStartY - 5,
    contentWidth,
    yPosition - containerStartY + 3
  );
  return yPosition + 8;
}

// ── Helper: sezione testo libero ──────────────────────────────────────────────

function addTextSection(
  pdf: jsPDF,
  title: string,
  text: string,
  yPosition: number,
  pageHeight: number,
  margin: number,
  contentWidth: number
): number {
  if (yPosition > pageHeight - 60) {
    pdf.addPage();
    yPosition = margin;
  }

  pdf.setFillColor(229, 231, 235);
  pdf.rect(margin, yPosition - 5, contentWidth, 7, 'F');

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(31, 41, 55);
  pdf.text(title, margin + 2, yPosition);
  yPosition += 10;

  const containerStartY = yPosition;

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(75, 85, 99);

  const lines = pdf.splitTextToSize(text, contentWidth - 6);
  lines.forEach((line: string) => {
    if (yPosition > pageHeight - 25) {
      pdf.addPage();
      yPosition = margin + 3;
    }
    pdf.text(line, margin + 3, yPosition);
    yPosition += 4.5;
  });

  yPosition += 2;
  pdf.rect(
    margin,
    containerStartY - 5,
    contentWidth,
    yPosition - containerStartY + 3
  );
  return yPosition + 8;
}