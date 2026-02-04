/*
  # Fix Trial Duration
  
  Updates the trial duration from 14 days to 7 days in the start_user_trial function.
*/

CREATE OR REPLACE FUNCTION start_user_trial(user_uuid uuid)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET 
    plan_type = 'trial',
    trial_start_at = now(),
    trial_end_at = now() + interval '7 days',
    trial_expired = false,
    updated_at = now()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
