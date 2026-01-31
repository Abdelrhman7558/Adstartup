/*
  # Create Teams Infrastructure

  1. New Tables
    - `teams`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `created_at` (timestamp)
    
    - `team_members`
      - `id` (uuid, primary key)
      - `team_id` (uuid, foreign key to teams.id)
      - `user_id` (uuid, foreign key to users.id)
      - `created_at` (timestamp)

  2. Functions
    - `get_teams_for_user(uuid)` - Returns teams for a specific user

  3. Security
    - Enable RLS on `teams` table
    - Enable RLS on `team_members` table
    - Add policies to restrict team access to members
    - Team members can only see teams they're part of
*/

-- Create teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Enable RLS on teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teams
CREATE POLICY "Team members can view their teams"
  ON public.teams
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create teams"
  ON public.teams
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Enable RLS on team_members
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_members
CREATE POLICY "Users can view team members of their teams"
  ON public.team_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
      AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can add team members"
  ON public.team_members
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create get_teams_for_user function
CREATE OR REPLACE FUNCTION public.get_teams_for_user(user_uuid UUID)
RETURNS TABLE(team_id UUID, team_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.name
  FROM public.teams t
  JOIN public.team_members tm ON tm.team_id = t.id
  WHERE tm.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_teams_for_user(UUID) TO authenticated;