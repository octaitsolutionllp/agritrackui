import client from './client';

export function listCropCycles(status) {
  return client.get('/api/crop-cycles', { params: { status } }).then((res) => res.data);
}

export function getCropCycle(id) {
  return client.get(`/api/crop-cycles/${id}`).then((res) => res.data);
}

export function createCropCycle({
  fieldId,
  cropTypeId,
  seedVariety,
  sownDate,
  expectedHarvestDate,
  cycleLabel,
  parentCropCycleId,
}) {
  return client
    .post('/api/crop-cycles', {
      fieldId,
      cropTypeId,
      seedVariety,
      sownDate,
      expectedHarvestDate,
      cycleLabel,
      parentCropCycleId,
    })
    .then((res) => res.data);
}

export function advanceCropCycleStage(id) {
  return client.post(`/api/crop-cycles/${id}/advance-stage`).then((res) => res.data);
}

export function getCycleLineage(id) {
  return client.get(`/api/crop-cycles/${id}/lineage`).then((res) => res.data);
}
