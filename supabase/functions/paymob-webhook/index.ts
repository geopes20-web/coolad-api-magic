import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const payload = await req.json();
    const obj = payload?.obj || payload;
    const success = obj?.success === true || obj?.success === "true";
    const merchantId: string = String(obj?.order?.merchant_order_id ?? obj?.merchant_order_id ?? "");

    if (!merchantId) {
      return new Response(JSON.stringify({ ok: false, reason: "no merchant id" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Log raw event for audit
    await admin.from("payment_events").insert({
      provider: "paymob",
      event_type: success ? "paid" : "failed",
      merchant_order_id: merchantId,
      raw_payload: payload,
    } as any).then(() => {}, () => {});

    // --- Data Room one-off purchase ---
    if (merchantId.startsWith("DR_")) {
      const parts = merchantId.split("_"); // DR_{idea_id}_{user_id}_{ts}
      const idea_id = parts[1];
      const user_id = parts[2];
      if (success && idea_id && user_id) {
        await admin.from("data_room_access").upsert(
          { user_id, idea_id, status: "approved", amount_usd: 5.0, paid_at: new Date().toISOString() },
          { onConflict: "user_id,idea_id" }
        );
      }
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    // --- Investment deal payment ---
    if (success) {
      await admin.from("deals").update({
        payment_status: "paid",
        escrow_status: "held",
        status: "signed",
      }).eq("external_reference", merchantId);
    } else {
      await admin.from("deals").update({ payment_status: "failed" }).eq("external_reference", merchantId);
    }

    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (e) {
    console.error("paymob-webhook error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});