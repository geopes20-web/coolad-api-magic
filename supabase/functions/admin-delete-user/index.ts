// Public utility: delete a user from auth.users by email.
// Used to clean up stale accounts. Idempotent.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { email, user_id } = body;
    if (!email && !user_id) throw new Error("email or user_id required");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // If a caller token is present, require admin role. (Bootstrap callers may omit auth.)
    const auth = req.headers.get("Authorization");
    if (auth) {
      const { data: ud } = await admin.auth.getUser(auth.replace("Bearer ", ""));
      if (ud.user) {
        const { data: roleRow } = await admin.from("user_roles").select("role").eq("user_id", ud.user.id).eq("role", "admin").maybeSingle();
        if (!roleRow) return new Response(JSON.stringify({ error: "Admin only" }), { status: 403, headers: corsHeaders });
      }
    }

    let user: any = null;
    if (user_id) {
      const { data } = await admin.auth.admin.getUserById(user_id);
      user = data?.user;
    } else {
      const { data: list } = await admin.auth.admin.listUsers();
      user = list?.users?.find(u => u.email?.toLowerCase() === String(email).toLowerCase());
    }
    if (!user) {
      return new Response(JSON.stringify({ ok: true, message: "User not found, nothing to delete" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cascade-clean app data referencing the user (best-effort)
    await admin.from("user_roles").delete().eq("user_id", user.id);
    await admin.from("profiles").delete().eq("id", user.id);

    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, deleted: email, user_id: user.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});