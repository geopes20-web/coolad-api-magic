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
    const amountCents = Number(obj?.amount_cents ?? obj?.order?.amount_cents ?? 0);

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
      status: success ? "paid" : "failed",
      deal_id: merchantId,
      external_reference: merchantId,
      amount_usd: amountCents ? +(amountCents / 100 / 50).toFixed(2) : null,
      currency: obj?.currency || obj?.order?.currency || "EGP",
      raw_payload: payload,
    } as any).then(() => {}, () => {});

    // --- Investment deal payment ---
    if (success) {
      await admin.from("deals").update({
        payment_status: "paid",
        escrow_status: "held",
        status: "signed",
      }).eq("id", merchantId);
    } else {
      await admin.from("deals").update({ payment_status: "failed" }).eq("id", merchantId);
    }

    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (e) {
    console.error("paymob-webhook error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});