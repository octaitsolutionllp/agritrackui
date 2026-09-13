import client from './client';

export function listHarvests(cropCycleId) {
  return client.get(`/api/crop-cycles/${cropCycleId}/harvests`).then((res) => res.data);
}

export function createHarvest({ cropCycleId, harvestDate, yieldQuantity, yieldUnit, saleIncome, notes }) {
  return client
    .post('/api/harvests', { cropCycleId, harvestDate, yieldQuantity, yieldUnit, saleIncome, notes })
    .then((res) => res.data);
}

export function deleteHarvest(id) {
  return client.delete(`/api/harvests/${id}`);
}
