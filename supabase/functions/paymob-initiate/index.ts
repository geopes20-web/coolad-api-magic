import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PAYMOB_BASE = "https://accept.paymob.com/api";
const PLATFORM_FEE_PCT = 10;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const PAYMOB_API_KEY  = Deno.env.get("PAYMOB_API_KEY");
    const INTEGRATION_ID  = Deno.env.get("PAYMOB_INTEGRATION_ID");
    if (!PAYMOB_API_KEY || !INTEGRATION_ID) {
      return new Response(JSON.stringify({ error: "Paymob not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Auth ────────────────────────────────────────────────────────
    const auth = req.headers.get("Authorization");
    if (!auth) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: corsHeaders,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: ud } = await supabase.auth.getUser(auth.replace("Bearer ", ""));
    if (!ud.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: corsHeaders,
      });
    }

    // ── Body ────────────────────────────────────────────────────────
    const { idea_id, amount_usd, equity_percentage, valuation_usd, contract_terms } = await req.json();
    if (!idea_id || !amount_usd || amount_usd <= 0) {
      return new Response(JSON.stringify({ error: "Missing or invalid fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 409: duplicate processing guard ─────────────────────────────
    const { data: existingEvent } = await supabase
      .from("payment_events")
      .select("id, status, created_at")
      .eq("idea_id",  idea_id)
      .eq("user_id",  ud.user.id)
      .eq("status",   "pending")
      .maybeSingle();

    if (existingEvent) {
      // If it's been pending for less than 30 min, block duplicate
      const ageMs = Date.now() - new Date(existingEvent.created_at).getTime();
      if (ageMs < 30 * 60 * 1000) {
        return new Response(
          JSON.stringify({
            error:   "Payment already in progress for this idea.",
            code:    "ALREADY_PROCESSING",
            hint:    "Complete the current payment or wait 30 minutes for it to expire.",
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // Older than 30 min → clean up and allow a fresh attempt
      await supabase.from("payment_events").delete().eq("id", existingEvent.id);
    }

    // ── Idea lookup ─────────────────────────────────────────────────
    const { data: idea } = await supabase
      .from("ideas")
      .select("id, founder_id, title")
      .eq("id", idea_id)
      .maybeSingle();

    if (!idea) {
      return new Response(JSON.stringify({ error: "Idea not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Financials ──────────────────────────────────────────────────
    const platformFee   = +(amount_usd * PLATFORM_FEE_PCT / 100).toFixed(2);
    const fxRate        = 50; // 1 USD = 50 EGP (adjust as needed)
    
    const isDataRoom = amount_usd <= 5.5;
    const amountToChargeUsd = isDataRoom ? amount_usd : platformFee;
    const totalEGPCents = Math.round(amountToChargeUsd * fxRate * 100);

    // ── Redirect URL ────────────────────────────────────────────────
    const origin        = req.headers.get("origin") || "https://coolad-api-magic.lovable.app";
    const redirectionUrl = `${origin}/payment-result`;

    // ── 1. Paymob auth token ────────────────────────────────────────
    const authRes  = await fetch(`${PAYMOB_BASE}/auth/tokens`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: PAYMOB_API_KEY }),
    });
    const authJson = await authRes.json();
    if (!authRes.ok) throw new Error(`Paymob auth failed: ${JSON.stringify(authJson)}`);
    const token = authJson.token;

    // ── 2. Create deal in DB ────────────────────────────────────────
    const { data: deal, error: dealErr } = await supabase.from("deals").insert({
      idea_id,
      investor_id:            ud.user.id,
      founder_id:             idea.founder_id,
      investment_amount_usd:  amount_usd,
      equity_percentage:      equity_percentage || null,
      valuation_usd:          valuation_usd     || null,
      contract_terms:         contract_terms    || `Investment of $${amount_usd} in ${idea.title}`,
      platform_fee_percentage: PLATFORM_FEE_PCT,
      platform_fee_amount:    platformFee,
      payment_status:         "pending",
      escrow_status:          "none",
      status:                 "pending_founder",
    }).select().single();

    if (dealErr) throw new Error(`Deal creation failed: ${dealErr.message}`);

    // ── Generate a string merchant_order_id (NOT a raw UUID) ────────
    // Format: DR_<first8ofIdeaId>_<unixTimestampMs>
    const shortIdeaId       = idea_id.replace(/-/g, "").slice(0, 8).toUpperCase();
    const tsMs              = Date.now();
    const merchantOrderId   = `DR_${shortIdeaId}_${tsMs}`;   // e.g. "DR_4F7282FB_1718231800000"

    // ── 3. Paymob order ─────────────────────────────────────────────
    const orderRes  = await fetch(`${PAYMOB_BASE}/ecommerce/orders`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token:       token,
        delivery_needed:  false,
        amount_cents:     totalEGPCents,
        currency:         "EGP",
        merchant_order_id: merchantOrderId,   // ✅ String, not UUID
        items: [{
          name:         `Investment in ${idea.title}`.slice(0, 50),
          amount_cents: totalEGPCents,
          description:  "IDEVEST",
          quantity:     1,
        }],
      }),
    });
    const orderJson = await orderRes.json();
    if (!orderRes.ok) throw new Error(`Paymob order failed: ${JSON.stringify(orderJson)}`);

    // ── 4. Payment key ───────────────────────────────────────────────
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone_number")
      .eq("id", ud.user.id)
      .maybeSingle();

    const [firstName, ...restName] = (profile?.full_name || "Investor").split(" ");
    const keyRes  = await fetch(`${PAYMOB_BASE}/acceptance/payment_keys`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token:   token,
        amount_cents: totalEGPCents,
        expiration:   3600,
        order_id:     orderJson.id,
        billing_data: {
          first_name:      firstName || "Investor",
          last_name:       restName.join(" ") || "User",
          email:           ud.user.email || "investor@idevest.com",
          phone_number:    profile?.phone_number || "+201000000000",
          apartment:       "NA", floor: "NA", street: "NA", building: "NA",
          shipping_method: "NA", postal_code: "NA", city: "Cairo",
          country:         "EG", state: "NA",
        },
        currency:            "EGP",
        integration_id:      Number(INTEGRATION_ID),
        lock_order_when_paid: true,
        use_redirection:     true,
        redirection_url:     redirectionUrl,
      }),
    });
    const keyJson = await keyRes.json();
    if (!keyRes.ok) throw new Error(`Paymob payment_key failed: ${JSON.stringify(keyJson)}`);

    // ── 5. Log pending payment_event ────────────────────────────────
    await supabase.from("payment_events").insert({
      deal_id:            deal.id,
      idea_id,
      user_id:            ud.user.id,
      event_type:         "payment.initiated",
      provider:           "paymob",
      external_reference: merchantOrderId,
      amount_usd,
      currency:           "EGP",
      status:             "pending",
      raw_payload:        { merchant_order_id: merchantOrderId, paymob_order_id: orderJson.id },
    }).catch(e => console.warn("payment_event insert warn:", e));

    // ── 6. If it's a Data Room payment, create pending data_room_access ──
    if (amount_usd <= 5.5) {   // $5 data room fee (with small tolerance)
      await supabase.from("data_room_access").upsert({
        user_id:           ud.user.id,
        idea_id,
        status:            "pending",
        payment_reference: merchantOrderId,
        deal_id:           deal.id,
      }, { onConflict: "user_id,idea_id" }).catch(e => console.warn("data_room_access warn:", e));
    }

    // ── 7. Build iframe / redirect URL ──────────────────────────────
    const iframeId  = Deno.env.get("PAYMOB_IFRAME_ID") || "";
    const iframeUrl = iframeId
      ? `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${keyJson.token}`
      : `https://accept.paymob.com/api/acceptance/iframes/887024?payment_token=${keyJson.token}`;

    // Store deal_id in session for payment-result page lookup
    return new Response(JSON.stringify({
      ok:                  true,
      deal_id:             deal.id,
      merchant_order_id:   merchantOrderId,
      payment_token:       keyJson.token,
      iframe_url:          iframeUrl,
      order_id:            orderJson.id,
      amount_usd,
      platform_fee_usd:    platformFee,
      net_to_founder_usd:  +(amount_usd - platformFee).toFixed(2),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("paymob-initiate error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});