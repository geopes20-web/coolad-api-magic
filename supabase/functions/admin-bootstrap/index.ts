// One-shot admin bootstrap: creates admin@idevest.com / Admin@123456 if missing.
// Idempotent — safe to call multiple times. Public (no JWT) so it can be called from anywhere.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ADMIN_EMAIL = "admin@idevest.com";
const ADMIN_PASSWORD = "Admin@123456";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Check if admin already exists
    const { data: existing } = await admin.auth.admin.listUsers();
    let adminUser = existing?.users?.find(u => u.email === ADMIN_EMAIL);

    if (!adminUser) {
      const { data: created, error } = await admin.auth.admin.createUser({
        email: ADMIN_EMAIL, password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: "IDEVEST Admin" },
      });
      if (error) throw error;
      adminUser = created.user;
    }

    // Ensure profile + admin role
    if (adminUser) {
      await admin.from("profiles").upsert({
        id: adminUser.id, full_name: "IDEVEST Admin",
      }, { onConflict: "id" });
      await admin.from("user_roles").upsert({
        user_id: adminUser.id, role: "admin",
      }, { onConflict: "user_id,role" });
    }

    return new Response(JSON.stringify({
      ok: true,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      user_id: adminUser?.id,
      message: "Admin ready. Sign in at /login with above credentials.",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});