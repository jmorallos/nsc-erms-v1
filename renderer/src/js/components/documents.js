import { setHTML } from '../utils/helpers.js';

/** Documents API / disk storage comes next — 201 File is empty for now. */
export function initDocuments() {}

export function renderTabDocs(emp) {
  setHTML(
    'tab-docs',
    `
    <div class="empty" style="padding:24px 0;text-align:center;">
      <p style="margin-bottom:8px;font-weight:600;">201 File storage is not connected yet.</p>
      <p style="font-size:12px;color:var(--text-3);">
        Employee <strong>${emp?.employeeNo || ''}</strong> — document upload, scan-to-folder, and preview will land in the next phase.
      </p>
    </div>`,
  );
}
