/*
  # Enable Email Confirmation

  1. Changes
    - Email confirmation is now required for Supabase Auth
    - Users must confirm their email before first sign in
    - Reset password flow sends confirmation emails
  
  2. Configuration
    - Update Supabase project settings to require email confirmation
    - This must be configured in Supabase dashboard under Authentication > Providers > Email
*/

-- Note: Email confirmation must be enabled in Supabase Dashboard
-- Go to: Authentication > Providers > Email > Enable Email Confirmation
-- This enables the email verification flow