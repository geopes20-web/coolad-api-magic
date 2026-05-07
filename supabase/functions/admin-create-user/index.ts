// Admin-only: create a new admin user (email + password). Requires caller to be admin.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data: ud } = await admin.auth.getUser(auth.replace("Bearer ", ""));
    if (!ud.user) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: corsHeaders });

    const { data: roleRow } = await admin.from("user_roles").select("role").eq("user_id", ud.user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) return new Response(JSON.stringify({ error: "Admin only" }), { status: 403, headers: corsHeaders });

    const { email, password, full_name, role } = await req.json();
    if (!email || !password) return new Response(JSON.stringify({ error: "email & password required" }), { status: 400, headers: corsHeaders });

    const { data: created, error } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { full_name: full_name || email.split("@")[0] },
    });
    if (error) throw error;

    await admin.from("profiles").upsert({ id: created.user.id, full_name: full_name || email.split("@")[0] }, { onConflict: "id" });
    await admin.from("user_roles").upsert({ user_id: created.user.id, role: role || "admin" }, { onConflict: "user_id,role" });

    return new Response(JSON.stringify({ ok: true, user_id: created.user.id, email }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});