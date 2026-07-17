import {
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../api/departments.js';
import { ApiError } from '../api/client.js';
import { getEl, setHTML, escapeHtml } from '../utils/helpers.js';
import { showToast } from '../utils/toast.js';
import { refreshFilterDropdowns } from './employeeTable.js';

let _editingDeptId = null;

export function initDepartments() {
  getEl('add-dept-btn').addEventListener('click', () => openDeptModal(null));
  getEl('dept-modal-cancel').addEventListener('click', closeDeptModal);
  getEl('close-dept-modal').addEventListener('click', closeDeptModal);
  getEl('dept-modal-save').addEventListener('click', () => {
    saveDept().catch((err) => {
      showToast(err instanceof ApiError ? err.message : 'Save failed.', 'error');
    });
  });
}

export async function renderDepartmentPage() {
  try {
    const { departments } = await listDepartments();
    if (!departments.length) {
      setHTML('dept-grid', '<div class="empty">No departments yet.</div>');
      return;
    }
    setHTML(
      'dept-grid',
      departments
        .map(
          (dept) => `
      <div class="dept-card">
        <div class="dept-card-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </div>
        <h4>${escapeHtml(dept.name)}</h4>
        <div class="dsub">${escapeHtml(dept.description || 'No description')}</div>
        <div class="dcount">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          ${dept.employee_count ?? 0} employee(s)
        </div>
        <div style="display:flex;gap:7px;">
          <button class="btn btn-sm btn-edit" data-edit-dept="${dept.id}">Edit</button>
          <button class="btn btn-sm btn-del" data-delete-dept="${dept.id}">Delete</button>
        </div>
      </div>`,
        )
        .join(''),
    );

    document.querySelectorAll('[data-edit-dept]').forEach((btn) => {
      btn.addEventListener('click', () => openDeptModal(btn.dataset.editDept));
    });
    document.querySelectorAll('[data-delete-dept]').forEach((btn) => {
      btn.addEventListener('click', () => handleDeleteDept(btn.dataset.deleteDept));
    });
  } catch (err) {
    showToast(err instanceof ApiError ? err.message : 'Failed to load departments.', 'error');
  }
}

async function openDeptModal(deptId = null) {
  _editingDeptId = deptId;
  getEl('dept-modal-title').textContent = deptId ? 'Edit Department' : 'Add Department';
  if (deptId) {
    const { departments } = await listDepartments();
    const d = departments.find((x) => x.id === deptId);
    getEl('d-name').value = d?.name ?? '';
    getEl('d-desc').value = d?.description ?? '';
  } else {
    getEl('d-name').value = '';
    getEl('d-desc').value = '';
  }
  getEl('dept-overlay').classList.add('open');
}

function closeDeptModal() {
  getEl('dept-overlay').classList.remove('open');
  _editingDeptId = null;
}

async function saveDept() {
  const name = getEl('d-name').value.trim();
  if (!name) {
    showToast('Department name is required.', 'error');
    return;
  }
  const data = { name, description: getEl('d-desc').value.trim() };
  if (_editingDeptId) {
    await updateDepartment(_editingDeptId, data);
    showToast('Department updated.', 'success');
  } else {
    await createDepartment(data);
    showToast('Department added.', 'success');
  }
  closeDeptModal();
  await renderDepartmentPage();
  await refreshFilterDropdowns();
}

async function handleDeleteDept(deptId) {
  if (!confirm('Delete this department?')) return;
  try {
    await deleteDepartment(deptId);
    await renderDepartmentPage();
    await refreshFilterDropdowns();
    showToast('Department deleted.', 'success');
  } catch (err) {
    showToast(err instanceof ApiError ? err.message : 'Delete failed.', 'error');
  }
}
