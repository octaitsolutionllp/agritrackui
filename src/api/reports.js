import client from './client';

export function getPnlByCropCycle(cropCycleId) {
  return client.get(`/api/reports/pnl/${cropCycleId}`).then((res) => res.data);
}

export function getPnlSummary(farmId, fieldId) {
  return client.get('/api/reports/pnl-summary', { params: { farmId, fieldId } }).then((res) => res.data);
}

export function getReminders() {
  return client.get('/api/reports/reminders').then((res) => res.data);
}
