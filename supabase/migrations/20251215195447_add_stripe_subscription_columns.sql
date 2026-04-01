/*
  # Add Stripe Integration Columns

  1. Updates
    - Add stripe_customer_id to subscriptions
    - Add stripe_subscription_id to subscriptions
    - Add renewal_date to subscriptions
    - Add plan_id to subscriptions
  
  2. Security
    - Maintain existing RLS policies
    - All updates controlled by user_states triggers
*/

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS renewal_date timestamptz;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan_id text;

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);