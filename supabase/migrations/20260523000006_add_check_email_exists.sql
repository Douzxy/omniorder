-- Migration: Add check_email_exists helper function
-- This allows service_role/edge functions to check if a user exists in auth.users by email.
CREATE OR REPLACE FUNCTION public.check_email_exists(email_to_check text)
RETURNS boolean
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users WHERE email = email_to_check
  );
END;
$$ LANGUAGE plpgsql;
