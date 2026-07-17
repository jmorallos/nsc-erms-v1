import { login as apiLogin } from '../api/auth.js';
import { ApiError } from '../api/client.js';
import { getEl } from '../utils/helpers.js';

export function initLogin(onSuccess) {
  const btn = getEl('login-btn');
  const userInput = getEl('login-user');
  const passInput = getEl('login-pass');

  const submit = (e) => {
    e?.preventDefault();
    attemptLogin(onSuccess);
  };

  btn.addEventListener('click', submit);
  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submit(e);
  });
  passInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submit(e);
  });
}

export async function attemptLogin(onSuccess) {
  const username = getEl('login-user').value.trim();
  const password = getEl('login-pass').value;
  const errEl = getEl('login-err');
  const btn = getEl('login-btn');

  errEl.textContent = '';
  if (!username || !password) {
    errEl.textContent = 'Enter username and password.';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Signing in…';
  try {
    const { user } = await apiLogin(username, password);
    getEl('login-pass').value = '';
    onSuccess(normalizeUser(user));
  } catch (err) {
    const message =
      err instanceof ApiError
        ? err.message
        : 'Unable to reach the server. Is the API running?';
    errEl.textContent = message;
    getEl('login-pass').value = '';
    setTimeout(() => {
      if (errEl.textContent === message) errEl.textContent = '';
    }, 4000);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign In';
  }
}

export function normalizeUser(user) {
  return {
    id: user.id,
    username: user.username,
    name: user.displayName || user.username,
    role: user.role?.name || user.role?.code || '',
    roleCode: user.role?.code || '',
    employeeId: user.employeeId ?? null,
    mustChangePassword: Boolean(user.mustChangePassword),
  };
}
