// Generic payment webhook — ready to plug into Stripe/Paddle/manual triggers
// Handles: Paymob HMAC-validated callbacks + generic fallback + 10% Platform Fees
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
    const isPaymob = !!payload?.obj || (!!payload?.type === false && !!payload?.amount_cents);
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
    
    // استخراج الـ dealId الصحيح المتطابق مع الـ Merchant Order ID في السيستم
    const dealId = obj.merchant_order_id || obj.metadata?.deal_id || payload.deal_id || obj.order?.merchant_order_id;
    const externalRef = String(obj.id || payload.id || payload.reference || "");
    const amount = isPaymob ? (obj.amount_cents ? obj.amount_cents / 100 : 0) : (payload.amount || 0);
    const currency = obj.currency || payload.currency || "EGP";
    
    // قراءة دقيقة لحالة النجاح والتعليق
    const status = isPaymob
      ? (obj.success === true || obj.success === "true" ? "succeeded" : obj.pending ? "pending" : "failed")
      : (payload.status || (eventType.includes("succeeded") ? "succeeded" : "failed"));

    console.log(`🔔 Webhook Triggered - Provider: ${provider}, Deal ID: ${dealId}, Status: ${status}, Amount: ${amount}`);

    // توثيق وحفظ الحدث المالي كاملاً ببيانات الـ Raw Payload
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

    // عند التحقق المالي وتأكيد نجاح المعاملة
    if (dealId && status === "succeeded") {
      const isAuth = obj.is_auth === true || obj.is_auth === "true";
      const isCapture = obj.is_capture === true || obj.is_capture === "true";
      
      // حساب عمولة المنصة وحفظ الـ 10% برمجياً في خادم قاعدة البيانات لقفل العقد
      const platformFee = amount * 0.10;

      // ضبط حالة محفظة الضمان (Escrow) بدقة
      let escrowStatus = "held"; 
      if (isCapture) escrowStatus = "captured";
      if (!isAuth && !isCapture) escrowStatus = "completed";

      const { error: updateErr } = await admin.from("deals").update({
        payment_status: "paid",
        payment_reference: externalRef,
        escrow_hold_id: isAuth ? externalRef : null,
        escrow_status: escrowStatus,
        platform_fee_percentage: 10,
        platform_fee_amount: platformFee, // ترسيخ النسبة ماليًا في العمود المخصص بجدول الـ deals
        status: "completed", 
      }).eq("id", dealId);

      if (updateErr) console.error("Failed to update deal fields:", updateErr);

      // البناء الآلي للعقد الأساسي بهيكل HTML المحدث بنسبة الـ 10% الجديد
      try {
        const { data: deal } = await admin.from("deals").select("*, ideas(title)").eq("id", dealId).maybeSingle();
        if (deal && !deal.contract_url) {
          const html = `<!doctype html><html><head><meta charset="utf-8"><title>Investment Contract</title><style>body{font-family:Arial;max-width:780px;margin:40px auto;padding:24px;color:#111}h1{border-bottom:2px solid #000;padding-bottom:8px}table{width:100%;border-collapse:collapse;margin:16px 0}td{padding:8px;border:1px solid #ccc}.sig{margin-top:48px;display:flex;justify-content:space-between}</style></head><body><h1>IDEVEST — Investment Agreement</h1><p>This agreement records the investment transaction completed via the IDEVEST platform.</p><table><tr><td><b>Project</b></td><td>${deal.ideas?.title || ""}</td></tr><tr><td><b>Investment Amount</b></td><td>$${Number(deal.investment_amount_usd).toLocaleString()}</td></tr><tr><td><b>Equity</b></td><td>${deal.equity_percentage || "—"}%</td></tr><tr><td><b>Valuation</b></td><td>$${Number(deal.valuation_usd || 0).toLocaleString()}</td></tr><tr><td><b>Platform Fee (10%)</b></td><td>$${platformFee}</td></tr><tr><td><b>Paymob Transaction ID</b></td><td>${externalRef}</td></tr><tr><td><b>Date</b></td><td>${new Date().toISOString()}</td></tr></table><p>${deal.contract_terms || ""}</p><div class="sig"><div>Founder signed: ${deal.founder_signed_at || "—"}</div><div>Investor signed: ${deal.investor_signed_at || "—"}</div></div></body></html>`;
          const dataUrl = `data:text/html;base64,${btoa(unescape(encodeURIComponent(html)))}`;
          await admin.from("deals").update({ contract_url: dataUrl }).eq("id", dealId);
        }
      } catch (e) { console.error("contract generation failed", e); }
      
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