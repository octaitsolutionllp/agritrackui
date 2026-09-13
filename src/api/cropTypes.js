import client from './client';

export function listCropTypes() {
  return client.get('/api/crop-types').then((res) => res.data);
}

// Only the crop types the user has selected (falls back to every crop type if they haven't chosen any yet).
export function listMyCropTypes() {
  return client.get('/api/crop-types/mine').then((res) => res.data);
}
