import client from './client';

export function listActivities(cropCycleId) {
  return client.get(`/api/crop-cycles/${cropCycleId}/activities`).then((res) => res.data);
}

export function logActivity({ cropCycleId, activityType, activityDate, cost, notes }) {
  return client
    .post('/api/activities', { cropCycleId, activityType, activityDate, cost, notes })
    .then((res) => res.data);
}

export function deleteActivity(id) {
  return client.delete(`/api/activities/${id}`);
}
