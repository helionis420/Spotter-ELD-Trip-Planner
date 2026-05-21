import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

export async function planTrip(payload) {
  const response = await api.post('/api/plan-trip/', payload);
  return response.data;
}
