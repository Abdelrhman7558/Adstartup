import { fetchDashboardData as fetchFromWebhook } from './n8nWebhookService';
import type { DashboardData } from './dataTransformer';

export async function fetchDashboardData(userId: string, datePreset: string = 'last_30d'): Promise<DashboardData> {
  return fetchFromWebhook(userId, datePreset);
}

export type { DashboardData };
