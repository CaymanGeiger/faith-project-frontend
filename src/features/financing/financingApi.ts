import { apiFetch } from '../../lib/api/client';

export type FinancingInformation =
  | { title: string; available: false; description: null; url: null }
  | { title: string; available: true; description: string; url: string };

export const financingApi = {
  get: () => apiFetch<{ financing: FinancingInformation }>('/benefits/financing'),
};
