-- Migration: Storage bucket + RLS policies fix for doctor-documents
-- Run: supabase db push  ya  supabase migration up

-- ─── 1. Bucket create/update karo ───────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'doctor-documents',
  'doctor-documents',
  false,
  5242880,
  ARRAY['image/jpeg','image/jpg','image/png','application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit    = 5242880,
  allowed_mime_types = ARRAY['image/jpeg','image/jpg','image/png','application/pdf'];

-- ─── 2. Purani policies drop karo ────────────────────────────────────────────
DROP POLICY IF EXISTS "Doctors can upload own degree"   ON storage.objects;
DROP POLICY IF EXISTS "Doctors can read own degree"     ON storage.objects;
DROP POLICY IF EXISTS "Doctors can update own degree"   ON storage.objects;
DROP POLICY IF EXISTS "Doctors can delete own degree"   ON storage.objects;

-- ─── 3. RLS enable karo ──────────────────────────────────────────────────────
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ─── 4. UPLOAD — sirf apne folder mein ──────────────────────────────────────
CREATE POLICY "Doctors can upload own degree"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'doctor-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ─── 5. READ — sirf apni file ────────────────────────────────────────────────
CREATE POLICY "Doctors can read own degree"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'doctor-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ─── 6. UPDATE ───────────────────────────────────────────────────────────────
CREATE POLICY "Doctors can update own degree"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'doctor-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ─── 7. DELETE ───────────────────────────────────────────────────────────────
CREATE POLICY "Doctors can delete own degree"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'doctor-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ─── 8. doctor_profiles table mein path column add karo ──────────────────────
-- (URL expire hoti hai isliye path store karo, URL nahi)
ALTER TABLE public.doctor_profiles
  ADD COLUMN IF NOT EXISTS degree_document_path text;

-- Agar purana degree_document_url column hai toh path populate karo usse
UPDATE public.doctor_profiles
SET degree_document_path = REPLACE(
  degree_document_url,
  'https://' || current_setting('app.supabase_url', true) || '/storage/v1/object/public/doctor-documents/',
  ''
)
WHERE degree_document_url IS NOT NULL
  AND degree_document_path IS NULL;