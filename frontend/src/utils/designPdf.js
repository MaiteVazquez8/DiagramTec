/**
 * Descarga del PDF guardado de un diseño.
 * Las listas ya no incluyen el PDF (solo `hasPdf`): se pide al servidor al pulsar "Descargar".
 */
import api from '../api.js';

function triggerDownload(href, filename) {
  // Solo data URLs: un "javascript:..." guardado se ejecutaría al hacer clic.
  if (!String(href || '').startsWith('data:')) return;
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.click();
}

/**
 * @param {{ id: number, title?: string, image?: string, hasPdf?: boolean|number }} design
 * @param {{ fallbackToImage?: boolean }} [options] si no hay PDF, descarga la imagen de vista previa
 */
export async function downloadDesignPdf(design, { fallbackToImage = false } = {}) {
  const baseName = design.title || 'diagrama';

  if (design.hasPdf) {
    const res = await api.get(`/designs/${design.id}/pdf`);
    if (res.data?.pdf_data) {
      triggerDownload(res.data.pdf_data, `${baseName}.pdf`);
      return;
    }
  }

  if (fallbackToImage && design.image) {
    triggerDownload(design.image, `${baseName}.png`);
  }
}
