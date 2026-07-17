import { getSetupStatus, completeSetup } from '../api/setup.js';
import { ApiError } from '../api/client.js';
import { getEl } from '../utils/helpers.js';
import { showToast } from '../utils/toast.js';

let _onComplete = null;

export function initSetupWizard(onComplete) {
  _onComplete = onComplete;
  getEl('setup-finish-btn').addEventListener('click', handleFinish);
}

export async function checkSetupNeeded() {
  const status = await getSetupStatus();
  return status;
}

export function showSetupWizard(status) {
  getEl('setup-screen').style.display = 'flex';
  getEl('login-screen').style.display = 'none';
  getEl('app').style.display = 'none';
  getEl('setup-org').value = status.orgName || 'Northern Samar Colleges';
  getEl('setup-files').value =
    status.filesRoot || status.filesRootHint || 'C:\\nsc-erms-files';
  getEl('setup-inbox').value =
    status.scanInboxPath || status.scanInboxHint || 'C:\\nsc-erms-files\\inbox';
  getEl('setup-max').value = String(status.maxUploadBytes || 31457280);
  getEl('setup-err').textContent = '';
}

export function hideSetupWizard() {
  getEl('setup-screen').style.display = 'none';
}

async function handleFinish() {
  const errEl = getEl('setup-err');
  const btn = getEl('setup-finish-btn');
  const orgName = getEl('setup-org').value.trim();
  const filesRoot = getEl('setup-files').value.trim();
  const scanInboxPath = getEl('setup-inbox').value.trim();
  const maxUploadBytes = Number(getEl('setup-max').value);

  errEl.textContent = '';
  if (!orgName || !filesRoot || !scanInboxPath) {
    errEl.textContent = 'Organization name and paths are required.';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Saving…';
  try {
    await completeSetup({ orgName, filesRoot, scanInboxPath, maxUploadBytes });
    hideSetupWizard();
    showToast('Setup complete.', 'success');
    _onComplete?.();
  } catch (err) {
    errEl.textContent =
      err instanceof ApiError ? err.message : 'Setup failed.';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Finish setup';
  }
}
