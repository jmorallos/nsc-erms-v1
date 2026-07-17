import { api } from './client.js';

export function listUsers() {
  return api('/users');
}
