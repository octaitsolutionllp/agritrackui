import client from './client';

export function listFarms() {
  return client.get('/api/farms').then((res) => res.data);
}

export function createFarm({ name, totalAreaAcres }) {
  return client.post('/api/farms', { name, totalAreaAcres }).then((res) => res.data);
}

export function createField({ farmId, name, areaAcres, soilType, location }) {
  return client.post('/api/fields', { farmId, name, areaAcres, soilType, location }).then((res) => res.data);
}
