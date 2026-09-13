import client from './client';

export function listExpenses(cropCycleId) {
  return client.get(`/api/crop-cycles/${cropCycleId}/expenses`).then((res) => res.data);
}

export function createExpense({ cropCycleId, category, amount, expenseDate, notes }) {
  return client
    .post('/api/expenses', { cropCycleId, category, amount, expenseDate, notes })
    .then((res) => res.data);
}

export function deleteExpense(id) {
  return client.delete(`/api/expenses/${id}`);
}
