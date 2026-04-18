-- Profiles: phone
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- KYC: ID card images + AI result
ALTER TABLE public.kyc_verifications 
  ADD COLUMN IF NOT EXISTS id_card_front_url TEXT,
  ADD COLUMN IF NOT EXISTS id_card_back_url TEXT,
  ADD COLUMN IF NOT EXISTS ai_verification_result JSONB,
  ADD COLUMN IF NOT EXISTS ai_verified_at TIMESTAMPTZ;

-- Storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload own KYC files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'kyc-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own KYC files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'kyc-documents' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);

CREATE POLICY "Users can update own KYC files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'kyc-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admin RLS
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can view all KYC"
ON public.kyc_verifications FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update all KYC"
ON public.kyc_verifications FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can view all ideas"
ON public.ideas FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update all ideas"
ON public.ideas FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete ideas"
ON public.ideas FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can view all violations"
ON public.chat_violations FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can view all deals"
ON public.deals FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Update handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone_number)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', '')
  );
  
  IF NEW.email = 'admin@idevest.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::public.app_role)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();