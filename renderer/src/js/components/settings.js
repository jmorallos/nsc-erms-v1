import { listUsers } from '../api/users.js';
import { listEmployees } from '../api/employees.js';
import { listDepartments } from '../api/departments.js';
import { ApiError } from '../api/client.js';
import { getEl, setHTML, escapeHtml } from '../utils/helpers.js';
import { showToast } from '../utils/toast.js';

let _getPrefs = null;
let _savePrefs = null;

export function initSettings(getPrefs, savePrefs) {
  _getPrefs = getPrefs;
  _savePrefs = savePrefs;

  getEl('dark-toggle').addEventListener('click', handleToggleDark);

  document.querySelectorAll('.fs-btn').forEach((btn) => {
    btn.addEventListener('click', () => handleSetFont(Number(btn.dataset.size), btn));
  });

  getEl('add-user-btn')?.addEventListener('click', () => {
    showToast('User create API will be added next. Use seed/superadmin for now.', 'info');
  });
  getEl('close-user-modal')?.addEventListener('click', () => {
    getEl('user-overlay').classList.remove('open');
  });
  getEl('user-modal-cancel')?.addEventListener('click', () => {
    getEl('user-overlay').classList.remove('open');
  });
  getEl('refresh')?.addEventListener('click', () => {
    refreshStats().catch(() => {});
  });
}

export async function renderSettingsPage() {
  await renderUserTable();
  await refreshStats();
}

function handleToggleDark() {
  const prefs = _getPrefs();
  prefs.darkMode = !prefs.darkMode;
  document.body.classList.toggle('dark', prefs.darkMode);
  getEl('dark-toggle').classList.toggle('on', prefs.darkMode);
  _savePrefs();
}

function handleSetFont(size, btnEl) {
  const prefs = _getPrefs();
  prefs.fontSize = size;
  document.documentElement.style.setProperty('--fs', size + 'px');
  document.querySelectorAll('.fs-btn').forEach((b) => b.classList.remove('active'));
  btnEl.classList.add('active');
  _savePrefs();
  showToast(`Font size set to ${size}px.`, 'info');
}

async function renderUserTable() {
  try {
    const { users } = await listUsers();
    setHTML(
      'user-table',
      `
    <tr><th>Name</th><th>Username</th><th>Role</th><th></th></tr>
    ${users
      .map(
        (u) => `
      <tr>
        <td>${escapeHtml(u.displayName || u.username)}</td>
        <td><code style="background:var(--bg-base);padding:2px 8px;border-radius:6px;font-size:12px;font-family:'DM Mono',monospace;">${escapeHtml(u.username)}</code></td>
        <td><span class="badge active" style="font-size:10px;">${escapeHtml(u.role.name)}</span></td>
        <td><span style="font-size:11px;color:var(--text-3);">${u.role.code === 'superadmin' ? 'Protected' : ''}</span></td>
      </tr>`,
      )
      .join('')}`,
    );
  } catch (err) {
    setHTML(
      'user-table',
      `<tr><td colspan="4" style="color:var(--text-3);font-size:12px;">${escapeHtml(err instanceof ApiError ? err.message : 'Unable to load users')}</td></tr>`,
    );
  }
}

async function refreshStats() {
  const el = document.getElementById('db-stats');
  if (!el) return;
  try {
    const [{ employees }, { departments }] = await Promise.all([
      listEmployees(),
      listDepartments(),
    ]);
    el.textContent = `${employees.length} employees · ${departments.length} departments`;
  } catch {
    el.textContent = '—';
  }
}
