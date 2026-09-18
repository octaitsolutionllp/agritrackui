import client from './client';

export function listUsers() {
  return client.get('/api/admin/users').then((res) => res.data);
}

export function listUsersCreatedByMe() {
  return client.get('/api/admin/users/created-by-me').then((res) => res.data);
}

export function createUser({ name, emailOrPhone, password, preferredLanguage }) {
  return client
    .post('/api/admin/users', { name, emailOrPhone, password, preferredLanguage })
    .then((res) => res.data);
}

export function resetUserPassword(userId, newPassword) {
  return client.post(`/api/admin/users/${userId}/reset-password`, { newPassword });
}

export function setUserRole(userId, role) {
  return client.put(`/api/admin/users/${userId}/role`, { role }).then((res) => res.data);
}

export function getUserData(userId) {
  return client.get(`/api/admin/users/${userId}/data`).then((res) => res.data);
}
