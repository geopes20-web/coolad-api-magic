-- Add phone_number column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_number TEXT DEFAULT '+201000000000';

-- Add external_reference column to deals table (for merchant order tracking)
ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS external_reference TEXT;
