// Generic payment webhook — ready to plug into Stripe/Paddle/manual triggers
// Handles: Paymob HMAC-validated callbacks + generic fallback
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature, paddle-signature, x-paymob-signature",
};

// Paymob HMAC verification (SHA-512 of concatenated transaction fields)
async function verifyPaymobHmac(obj: any, providedHmac: string, secret: string): Promise<boolean> {
  const o = obj.obj || obj;
  const concat = [
    o.amount_cents, o.created_at, o.currency, o.error_occured,
    o.has_parent_transaction, o.id, o.integration_id, o.is_3d_secure,
    o.is_auth, o.is_capture, o.is_refunded, o.is_standalone_payment,
    o.is_voided, o.order?.id, o.owner, o.pending,
    o.source_data?.pan, o.source_data?.sub_type, o.source_data?.type,
    o.success,
  ].map(v => v === undefined || v === null ? "" : String(v)).join("");
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-512" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(concat));
  const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
  return hex.toLowerCase() === (providedHmac || "").toLowerCase();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const hmacQuery = url.searchParams.get("hmac");
    const payload = await req.json();
    const isPaymob = !!payload?.obj || !!payload?.type === false && !!payload?.amount_cents;
    const provider = isPaymob ? "paymob" : (payload.provider || req.headers.get("x-provider") || "manual");

    // Paymob HMAC verification
    if (isPaymob) {
      const hmacSecret = Deno.env.get("PAYMOB_HMAC_SECRET");
      if (hmacSecret && hmacQuery) {
        const valid = await verifyPaymobHmac(payload, hmacQuery, hmacSecret);
        if (!valid) {
          console.error("Paymob HMAC verification failed");
          return new Response(JSON.stringify({ error: "Invalid HMAC" }), {
            status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    const obj = payload.obj || payload;
    const eventType = payload.type || (obj.success ? "payment.succeeded" : "payment.failed");
    const dealId = obj.merchant_order_id || obj.metadata?.deal_id || payload.deal_id || obj.order?.merchant_order_id;
    const externalRef = String(obj.id || payload.id || payload.reference || "");
    const amount = isPaymob ? (obj.amount_cents ? obj.amount_cents / 100 : 0) : (payload.amount || 0);
    const currency = obj.currency || payload.currency || "EGP";
    const status = isPaymob
      ? (obj.success === true ? "succeeded" : obj.pending ? "pending" : "failed")
      : (payload.status || (eventType.includes("succeeded") ? "succeeded" : "failed"));

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

    // Update deal status if successful (escrow-aware)
    if (dealId && status === "succeeded") {
      const isAuth = obj.is_auth === true; // Paymob: pre-auth/hold
      const isCapture = obj.is_capture === true; // Paymob: captured
      await admin.from("deals").update({
        payment_status: "paid",
        payment_reference: externalRef,
        escrow_hold_id: isAuth ? externalRef : null,
        escrow_status: isCapture ? "captured" : isAuth ? "held" : "completed",
        status: isCapture ? "completed" : "signed",
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
