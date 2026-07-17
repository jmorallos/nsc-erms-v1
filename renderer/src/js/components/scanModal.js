import { getEl } from '../utils/helpers.js';
import { showToast } from '../utils/toast.js';

export function initScanModal() {
  getEl('scan-close-btn')?.addEventListener('click', closeScanModal);
  getEl('scan-btn')?.addEventListener('click', () => {
    showToast('Scan-to-folder ingest will connect next (no mock scanners).', 'info');
  });
  getEl('close-scan-modal')?.addEventListener('click', closeScanModal);
}

export function openScanModal() {
  showToast('Scanner mock removed. Use scan-to-folder when document storage ships.', 'info');
}

function closeScanModal() {
  getEl('scan-overlay')?.classList.remove('open');
}
