
-- 1. Fix overly permissive UPDATE policies on contacts/companies/deals
DROP POLICY IF EXISTS "Authed update contacts" ON public.contacts;
CREATE POLICY "Authed update contacts"
ON public.contacts
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Authed update companies" ON public.companies;
CREATE POLICY "Authed update companies"
ON public.companies
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Authed update deals" ON public.deals;
CREATE POLICY "Authed update deals"
ON public.deals
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2. Add restrictive policy on user_roles to prevent any non-admin INSERT/UPDATE/DELETE escalation
CREATE POLICY "Only admins can modify user_roles"
ON public.user_roles
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3. Revoke EXECUTE on trigger-only SECURITY DEFINER functions from public/authenticated
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
