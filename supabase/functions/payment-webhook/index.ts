// Generic payment webhook — ready to plug into Stripe/Paddle/manual triggers
// Handles: payment.succeeded, payment.failed, payment.refunded
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature, paddle-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const payload = await req.json();
    const provider = payload.provider || req.headers.get("x-provider") || "manual";
    const eventType = payload.type || payload.event_type || "payment.received";
    const dealId = payload.deal_id || payload.metadata?.deal_id;
    const externalRef = payload.id || payload.reference || payload.transaction_id;
    const amount = payload.amount || payload.amount_total || 0;
    const currency = payload.currency || "USD";
    const status = payload.status || (eventType.includes("succeeded") ? "succeeded" : eventType.includes("failed") ? "failed" : "pending");

    // Log the payment event
    const { error: logErr } = await admin.from("payment_events").insert({
      deal_id: dealId,
      event_type: eventType,
      provider,
      external_reference: externalRef,
      amount_usd: amount,
      currency,
      status,
      raw_payload: payload,
    });

    if (logErr) console.error("Failed to log payment event:", logErr);

    // Update deal status if successful
    if (dealId && status === "succeeded") {
      await admin.from("deals").update({
        payment_status: "paid",
        payment_reference: externalRef,
        status: "completed",
      }).eq("id", dealId);
    } else if (dealId && status === "failed") {
      await admin.from("deals").update({ payment_status: "failed" }).eq("id", dealId);
    }

    return new Response(JSON.stringify({ ok: true, processed: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("payment-webhook error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
