// verify-phone-otp: validates a Firebase ID token returned after phone OTP signInWithPhoneNumber.
// Input: { idToken, phoneNumber }
// Verifies token via Firebase REST then writes phone_verified_at on profile.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const FIREBASE_API_KEY = Deno.env.get("FIREBASE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!FIREBASE_API_KEY) {
      return new Response(JSON.stringify({ error: "Phone OTP not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: ud } = await supabase.auth.getUser(auth.replace("Bearer ", ""));
    if (!ud.user) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: corsHeaders });

    const { idToken, phoneNumber } = await req.json();
    if (!idToken || !phoneNumber) {
      return new Response(JSON.stringify({ error: "Missing idToken or phoneNumber" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify Firebase ID token by calling lookup endpoint
    const lookupRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!lookupRes.ok) {
      return new Response(JSON.stringify({ error: "Invalid Firebase token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const lookup = await lookupRes.json();
    const fbUser = lookup?.users?.[0];
    const fbPhone = fbUser?.phoneNumber;
    if (!fbPhone || fbPhone.replace(/\s+/g, "") !== phoneNumber.replace(/\s+/g, "")) {
      return new Response(JSON.stringify({ error: "Phone number mismatch" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("profiles").update({
      phone_number: fbPhone,
      phone_verified_at: new Date().toISOString(),
    }).eq("id", ud.user.id);

    return new Response(JSON.stringify({ ok: true, phone: fbPhone }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
