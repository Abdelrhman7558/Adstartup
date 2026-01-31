import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'adstartup-auth-token',
  },
});

export interface Profile {
  id: string;
  full_name: string;
  phone_number: string;
  meta_connected: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_name: string;
  plan_price: number;
  payment_method: string;
  payment_id?: string;
  status: string;
  current_period_start: string;
  current_period_end?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  renewal_date?: string;
  plan_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Brief {
  id: string;
  user_id: string;
  email: string;
  business_name: string;
  website: string;
  product_description: string;
  target_country: string;
  monthly_budget: string;
  goal: string;
  notes: string;
  created_at: string;
}

export interface UserState {
  user_id: string;
  current_step: string | null;
  has_active_subscription: boolean;
  has_completed_brief: boolean;
  has_connected_meta: boolean;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  subscription_id?: string;
  amount: number;
  provider: string;
  status: string;
  paid_at?: string;
  created_at: string;
}

export interface MetaConnection {
  id: string;
  user_id: string;
  access_token?: string;
  ad_account_id?: string;
  business_manager_id?: string;
  pixel_id?: string;
  catalog_id?: string;
  is_connected: boolean;
  connected_at?: string;
  updated_at: string;
}

export interface UserAsset {
  id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  file_path: string;
  file_size: number;
  storage_bucket: string;
  storage_path: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

export interface Ad {
  id: string;
  user_id: string;
  name: string;
  status: 'active' | 'paused' | 'disabled' | 'deleted' | 'unknown';
  campaign_id?: string;
  ad_account_id?: string;
  created_by: 'manual' | 'api' | 'meta';
  meta_sync_status: 'pending' | 'synced' | 'failed';
  last_synced_at?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AdAction {
  id: string;
  user_id: string;
  ad_id: string;
  action_type: 'kill' | 'remove' | 'pause' | 'activate';
  action_reason?: string;
  status: 'pending' | 'completed' | 'failed';
  error_message?: string;
  webhook_sent_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface Webhook {
  id: string;
  user_id: string;
  event_type: 'kill_all_ads' | 'remove_ad' | 'pause_ad' | 'asset_uploaded';
  payload: Record<string, any>;
  target_url: string;
  retry_count: number;
  max_retries: number;
  status: 'pending' | 'sent' | 'failed' | 'delivered';
  response_code?: number;
  response_body?: string;
  last_attempted_at?: string;
  sent_at?: string;
  created_at: string;
}
