-- Approval workflow on agent_actions
-- Lets the operator (or manager) approve / reject a pending recommendation
-- before the engine executes it. Used by `execute-pending-action`.

ALTER TABLE public.agent_actions
  ADD COLUMN IF NOT EXISTS approved_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at    timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejected_at    timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_note text;

-- Allow the wider set of actions Claude can recommend (create / delete /
-- duplicate / archive). The CHECK on `status` already lets us track lifecycle.
-- Index pending so the UI can list them fast.
CREATE INDEX IF NOT EXISTS agent_actions_pending_idx
  ON public.agent_actions(user_id, created_at DESC)
  WHERE status = 'pending';

-- Allow users to approve/reject their own pending actions, or managers any.
DROP POLICY IF EXISTS "Users approve own actions" ON public.agent_actions;
CREATE POLICY "Users approve own actions"
  ON public.agent_actions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_manager_or_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_manager_or_admin());
