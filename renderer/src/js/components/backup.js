import { setHTML, getEl } from '../utils/helpers.js';
import { showToast } from '../utils/toast.js';

export function initBackup() {
  getEl('create-backup-btn')?.addEventListener('click', () => {
    showToast('Server backup will use pg_dump + FILES_ROOT copy (not in-memory).', 'info');
  });
  getEl('restore-input')?.addEventListener('change', (e) => {
    e.target.value = '';
    showToast('Restore from JSON mock backups has been removed.', 'info');
  });
}

export function renderBackupPage() {
  setHTML(
    'bk-list',
    `<p style="font-size:12px;color:var(--text-3);text-align:center;padding:16px 0;">
      In-memory backups removed. Use database + file-root backup procedures for production.
    </p>`,
  );
}
