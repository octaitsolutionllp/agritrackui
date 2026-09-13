import client from './client';

export function getCaptcha() {
  return client.get('/api/auth/captcha').then((res) => res.data);
}

export function register({ name, emailOrPhone, password, preferredLanguage, captchaToken, captchaAnswer }) {
  return client
    .post('/api/auth/register', { name, emailOrPhone, password, preferredLanguage, captchaToken, captchaAnswer })
    .then((res) => res.data);
}

export function login({ emailOrPhone, password, captchaToken, captchaAnswer }) {
  return client
    .post('/api/auth/login', { emailOrPhone, password, captchaToken, captchaAnswer })
    .then((res) => res.data);
}

export function updateLanguage(preferredLanguage) {
  return client.put('/api/profile/language', { preferredLanguage }).then((res) => res.data);
}

export function changePassword({ currentPassword, newPassword }) {
  return client.put('/api/profile/password', { currentPassword, newPassword }).then((res) => res.data);
}

export function deleteAccount({ currentPassword }) {
  return client.post('/api/profile/delete-account', { currentPassword });
}

export function getSelectedCropTypeIds() {
  return client.get('/api/profile/crop-types').then((res) => res.data);
}

export function setCropTypeIds(cropTypeIds) {
  return client.put('/api/profile/crop-types', { cropTypeIds }).then((res) => res.data);
}
