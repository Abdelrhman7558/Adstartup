/*
  # Extend profiles table with webhook configuration

  1. Modified Tables
    - `profiles`
      - Add `webhook_url` (text, webhook endpoint URL)
      - Add `webhook_secret` (text, webhook secret for validation)
      - Add `enable_webhooks` (boolean, enable/disable webhooks)

  2. Notes
    - If columns already exist, this migration is idempotent
    - webhook_url is used for all webhook deliveries
    - webhook_secret can be used for HMAC validation
    - enable_webhooks allows users to turn webhooks on/off
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'webhook_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN webhook_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'webhook_secret'
  ) THEN
    ALTER TABLE profiles ADD COLUMN webhook_secret text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'enable_webhooks'
  ) THEN
    ALTER TABLE profiles ADD COLUMN enable_webhooks boolean DEFAULT false;
  END IF;
END $$;
