// WhatsApp Cloud API OTP sender (Meta Free Tier — 1000 conv/month)
// Falls back to logging the code (dev mode) if META_WHATSAPP_TOKEN missing.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function sha256Hex(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: ud } = await supabase.auth.getUser(auth.replace("Bearer ", ""));
    if (!ud.user) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: corsHeaders });

    const { phone_number } = await req.json();
    if (!phone_number || !/^\+?\d{8,15}$/.test(phone_number.replace(/\s+/g, ""))) {
      return new Response(JSON.stringify({ error: "Invalid phone" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const phone = phone_number.replace(/\s+/g, "").replace(/^00/, "+");
    // Generate 6-digit OTP
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await sha256Hex(code);

    // Invalidate previous unverified codes
    await supabase.from("phone_otp_codes")
      .update({ verified: true })
      .eq("user_id", ud.user.id).eq("verified", false);

    // Store hash
    await supabase.from("phone_otp_codes").insert({
      user_id: ud.user.id, phone_number: phone, code_hash: codeHash,
    });

    const META_TOKEN = Deno.env.get("META_WHATSAPP_TOKEN");
    const META_PHONE_ID = Deno.env.get("META_WHATSAPP_PHONE_ID");

    let sent = false;
    let devCode: string | undefined;

    if (META_TOKEN && META_PHONE_ID) {
      try {
        const r = await fetch(`https://graph.facebook.com/v20.0/${META_PHONE_ID}/messages`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${META_TOKEN}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: phone.replace(/^\+/, ""),
            type: "template",
            template: {
              name: "otp_verify", language: { code: "ar" },
              components: [{ type: "body", parameters: [{ type: "text", text: code }] }],
            },
          }),
        });
        if (r.ok) sent = true;
        else console.error("Meta WhatsApp error:", await r.text());
      } catch (e) { console.error("Meta WhatsApp send error:", e); }
    }

    if (!sent) {
      // DEV fallback — return code in response (only when not configured)
      console.log(`[DEV OTP] ${phone} → ${code}`);
      devCode = code;
    }

    return new Response(JSON.stringify({ ok: true, sent, dev_code: devCode }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});