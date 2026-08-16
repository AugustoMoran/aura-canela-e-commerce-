export function getApiBaseUrl() {
  const raw = import.meta.env.VITE_API_URL || '/api';
  const trimmed = String(raw).replace(/\/+$/, '');
  if (trimmed.endsWith('/api')) return trimmed;
  return `${trimmed}/api`;
}
