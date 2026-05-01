REVOKE EXECUTE ON FUNCTION public.ensure_user_wallet(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.ensure_user_wallet(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.ensure_user_wallet(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_admin_stats() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO authenticated;