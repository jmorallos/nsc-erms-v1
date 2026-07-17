import { api } from './client.js';

export function login(username, password) {
  return api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function logout() {
  return api('/auth/logout', { method: 'POST', body: '{}' });
}

export function me() {
  return api('/auth/me');
}

export function changePassword(currentPassword, newPassword) {
  return api('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}
