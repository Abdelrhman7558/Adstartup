/*
  # Create assets storage bucket with RLS policies

  1. Create storage bucket
  2. Enable RLS on storage
  3. Add policies for authenticated users
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('assets', 'assets', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload to their folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view their files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'assets' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'assets' AND (storage.foldername(name))[1] = auth.uid()::text);
