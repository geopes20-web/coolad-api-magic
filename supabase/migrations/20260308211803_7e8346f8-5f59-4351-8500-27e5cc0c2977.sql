
-- Create storage bucket for idea documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('idea-documents', 'idea-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own documents
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'idea-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to read their own documents
CREATE POLICY "Users can read own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'idea-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to delete their own documents
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'idea-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
