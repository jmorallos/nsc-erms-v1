import { api } from './client.js';

export function getSetupStatus() {
  return api('/setup/status');
}

export function completeSetup(payload) {
  return api('/setup/complete', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
