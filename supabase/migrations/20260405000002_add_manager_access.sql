-- Create function to check if user is a bot manager
CREATE OR REPLACE FUNCTION public.is_bot_manager()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (auth.jwt() ->> 'email') IN ('7bd02025@gmail.com', 'jihadalcc@gmail.com');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update meta_campaigns RLS
DROP POLICY IF EXISTS "Users can manage own meta campaigns" ON public.meta_campaigns;

CREATE POLICY "Users can manage own meta campaigns" ON public.meta_campaigns FOR
ALL TO authenticated USING (auth.uid() = user_id OR public.is_bot_manager());

-- Update optimization_logs RLS
DROP POLICY IF EXISTS "Users can read own optimization logs" ON public.optimization_logs;
DROP POLICY IF EXISTS "Users can insert own optimization logs" ON public.optimization_logs;

CREATE POLICY "Users can manage optimization logs" ON public.optimization_logs FOR
ALL TO authenticated USING (auth.uid() = user_id OR public.is_bot_manager());

-- Update bot_instructions RLS
DROP POLICY IF EXISTS "Users can manage own bot instructions" ON public.bot_instructions;

CREATE POLICY "Users can manage bot instructions" ON public.bot_instructions FOR
ALL TO authenticated USING (auth.uid() = user_id OR public.is_bot_manager());

-- Update notifications RLS (assuming it exists based on service)
-- If it doesn't exist, this will fail gracefully or we can create it
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
        ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Users can manage own notifications" ON public.notifications;
        CREATE POLICY "Users can manage own notifications" ON public.notifications FOR
        ALL TO authenticated USING (auth.uid() = user_id OR public.is_bot_manager());
    END IF;
END $$;
