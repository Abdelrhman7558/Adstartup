import { fetchDashboardData as fetchFromWebhook } from './n8nWebhookService';
import type { DashboardData } from './dataTransformer';

export async function fetchDashboardData(userId: string): Promise<DashboardData> {
  return fetchFromWebhook(userId);
}

export type { DashboardData };
