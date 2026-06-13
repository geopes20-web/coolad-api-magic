// IDEVEST — Payment Webhook (Paymob + generic)
// Handles: HMAC validation, deal update, data_room_access approval,
//          payment_events log, and contract generation
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature, x-paymob-signature",
};

// Paymob HMAC-512 verification
async function verifyPaymobHmac(
  obj: any,
  providedHmac: string,
  secret: string
): Promise<boolean> {
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
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret),
    { name: "HMAC", hash: "SHA-512" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(concat));
  const hex = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, "0")).join("");
  return hex.toLowerCase() === (providedHmac || "").toLowerCase();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url         = new URL(req.url);
    const hmacQuery   = url.searchParams.get("hmac");
    const payload     = await req.json();
    const isPaymob    = !!payload?.obj || (!payload?.type && !!payload?.amount_cents);
    const provider    = isPaymob
      ? "paymob"
      : (payload.provider || req.headers.get("x-provider") || "manual");

    // ── HMAC verification ──────────────────────────────────────────
    if (isPaymob && hmacQuery) {
      const hmacSecret = Deno.env.get("PAYMOB_HMAC_SECRET");
      if (hmacSecret) {
        const valid = await verifyPaymobHmac(payload, hmacQuery, hmacSecret);
        if (!valid) {
          console.error("Paymob HMAC verification failed");
          return new Response(JSON.stringify({ error: "Invalid HMAC" }), {
            status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    const obj         = payload.obj || payload;
    const eventType   = payload.type || (obj.success ? "payment.succeeded" : "payment.failed");

    // ── Extract merchant_order_id (our DR_xxx_ts string) ──────────
    // Paymob sends it back as obj.order.merchant_order_id
    const merchantOrderId: string =
      obj?.order?.merchant_order_id ||
      obj?.merchant_order_id        ||
      obj?.metadata?.deal_id        ||
      payload?.deal_id              ||
      "";

    const externalRef = String(obj.id || payload.id || payload.reference || "");
    const amount      = isPaymob
      ? (obj.amount_cents ? obj.amount_cents / 100 : 0)
      : (payload.amount || 0);
    const currency    = obj.currency || payload.currency || "EGP";

    const status = isPaymob
      ? (obj.success === true || obj.success === "true"
          ? "succeeded"
          : obj.pending
            ? "pending"
            : "failed")
      : (payload.status || (eventType.includes("succeeded") ? "succeeded" : "failed"));

    console.log(`🔔 Webhook - Provider: ${provider} | MerchantOrder: ${merchantOrderId} | Status: ${status}`);

    // ── Look up deal by merchant_order_id (external_reference) ─────
    // Our payment_events row was inserted with external_reference = merchantOrderId
    let dealId: string | null = null;
    let ideaId: string | null = null;
    let investorId: string | null = null;

    if (merchantOrderId) {
      const { data: peRow } = await admin
        .from("payment_events")
        .select("deal_id, idea_id, user_id")
        .eq("external_reference", merchantOrderId)
        .maybeSingle();

      if (peRow) {
        dealId     = peRow.deal_id;
        ideaId     = peRow.idea_id;
        investorId = peRow.user_id;
      }
    }

    // ── Log payment event ──────────────────────────────────────────
    await admin.from("payment_events").insert({
      deal_id:            dealId,
      idea_id:            ideaId,
      user_id:            investorId,
      event_type:         eventType,
      provider,
      external_reference: externalRef,
      amount_usd:         amount,
      currency,
      status,
      raw_payload:        payload,
    }).catch(e => console.error("Failed to log payment event:", e));

    // ── Handle success ─────────────────────────────────────────────
    if (status === "succeeded") {
      const isAuth    = obj.is_auth    === true || obj.is_auth    === "true";
      const isCapture = obj.is_capture === true || obj.is_capture === "true";
      const platformFee = amount * 0.10;
      let escrowStatus = "held";
      if (isCapture) escrowStatus = "captured";
      if (!isAuth && !isCapture) escrowStatus = "completed";

      // ── Update deal ──────────────────────────────────────────────
      if (dealId) {
        const { error: updateErr } = await admin.from("deals").update({
          payment_status:          "paid",
          payment_reference:       externalRef,
          escrow_hold_id:          isAuth ? externalRef : null,
          escrow_status:           escrowStatus,
          platform_fee_percentage: 10,
          platform_fee_amount:     platformFee,
          status:                  "completed",
        }).eq("id", dealId);

        if (updateErr) console.error("Failed to update deal:", updateErr);

        // ── Approve data_room_access if this is a $5 fee ─────────
        if (ideaId && investorId) {
          const { error: draErr } = await admin.from("data_room_access").upsert({
            user_id:           investorId,
            idea_id:           ideaId,
            status:            "approved",
            payment_reference: externalRef,
            deal_id:           dealId,
          }, { onConflict: "user_id,idea_id" });

          if (draErr) console.error("data_room_access update error:", draErr);
          else console.log(`✅ Data room access APPROVED for user=${investorId} idea=${ideaId}`);
        }

        // ── Generate contract HTML ────────────────────────────────
        try {
          const { data: deal } = await admin
            .from("deals")
            .select("*, ideas(title)")
            .eq("id", dealId)
            .maybeSingle();

          if (deal && !deal.contract_url) {
            const html = `<!doctype html><html><head><meta charset="utf-8"><title>Investment Contract</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 780px; margin: 40px auto; padding: 24px; color: #111; }
  h1   { border-bottom: 2px solid #000; padding-bottom: 8px; }
  h2   { color: #333; margin-top: 32px; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  td   { padding: 10px; border: 1px solid #ccc; }
  td:first-child { font-weight: bold; background: #f9f9f9; width: 35%; }
  .sig { margin-top: 48px; display: flex; justify-content: space-between; gap: 24px; }
  .sig-box { border-top: 1px solid #000; padding-top: 8px; flex: 1; font-size: 13px; }
  .badge { display: inline-block; background: #16a34a; color: #fff; padding: 4px 12px; border-radius: 4px; font-size: 13px; }
</style>
</head><body>
<h1>🏛️ IDEVEST — Investment Agreement</h1>
<p class="badge">CONFIRMED &amp; PAID</p>
<p style="margin-top:12px">This agreement records the investment transaction completed via the IDEVEST platform.</p>
<h2>Transaction Details</h2>
<table>
  <tr><td>Project</td><td>${deal.ideas?.title || "—"}</td></tr>
  <tr><td>Investment Amount</td><td>$${Number(deal.investment_amount_usd).toLocaleString()}</td></tr>
  <tr><td>Equity</td><td>${deal.equity_percentage || "—"}%</td></tr>
  <tr><td>Valuation</td><td>$${Number(deal.valuation_usd || 0).toLocaleString()}</td></tr>
  <tr><td>Platform Fee (10%)</td><td>$${platformFee.toFixed(2)}</td></tr>
  <tr><td>Net to Founder</td><td>$${(amount - platformFee).toFixed(2)}</td></tr>
  <tr><td>Paymob Transaction ID</td><td>${externalRef}</td></tr>
  <tr><td>Merchant Order ID</td><td>${merchantOrderId}</td></tr>
  <tr><td>Date</td><td>${new Date().toLocaleString("en-EG")}</td></tr>
</table>
<h2>Contract Terms</h2>
<p>${deal.contract_terms || "Standard IDEVEST investment terms apply."}</p>
<div class="sig">
  <div class="sig-box">Founder signed: ${deal.founder_signed_at || "Pending"}</div>
  <div class="sig-box">Investor signed: ${deal.investor_signed_at || "Pending"}</div>
</div>
</body></html>`;

            const dataUrl = `data:text/html;base64,${btoa(unescape(encodeURIComponent(html)))}`;
            await admin.from("deals").update({ contract_url: dataUrl }).eq("id", dealId);
            console.log(`📄 Contract generated for deal ${dealId}`);
          }
        } catch (contractErr) {
          console.error("Contract generation failed:", contractErr);
        }
      }

      // ── Update payment_events status to succeeded ────────────────
      if (merchantOrderId) {
        await admin.from("payment_events")
          .update({ status: "succeeded" })
          .eq("external_reference", merchantOrderId)
          .eq("status", "pending");
      }

    } else if (status === "failed") {
      if (dealId) {
        await admin.from("deals").update({ payment_status: "failed" }).eq("id", dealId);
      }
      if (ideaId && investorId) {
        await admin.from("data_room_access").upsert({
          user_id:           investorId,
          idea_id:           ideaId,
          status:            "failed",
          payment_reference: externalRef,
        }, { onConflict: "user_id,idea_id" });
      }
      if (merchantOrderId) {
        await admin.from("payment_events")
          .update({ status: "failed" })
          .eq("external_reference", merchantOrderId)
          .eq("status", "pending");
      }
    }

    return new Response(JSON.stringify({ ok: true, processed: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("payment-webhook error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});