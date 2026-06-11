import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PAYMOB_BASE = "https://accept.paymob.com/api";
const PLATFORM_FEE_PCT = 10;
const FX_USD_TO_EGP = 50;

function makeMerchantOrderId() {
  return Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const PAYMOB_API_KEY = Deno.env.get("PAYMOB_API_KEY");
    const INTEGRATION_ID = Deno.env.get("PAYMOB_INTEGRATION_ID");
    const IFRAME_ID = Deno.env.get("PAYMOB_IFRAME_ID");
    
    console.log("🔍 Checking Paymob config...");
    console.log("PAYMOB_API_KEY:", PAYMOB_API_KEY ? "✅" : "❌");
    console.log("INTEGRATION_ID:", INTEGRATION_ID ? "✅" : "❌");
    console.log("IFRAME_ID:", IFRAME_ID ? "✅" : "⚠️ Optional");
    
    if (!PAYMOB_API_KEY || !INTEGRATION_ID) {
      const msg = "Paymob not configured: need PAYMOB_API_KEY and PAYMOB_INTEGRATION_ID";
      console.error("❌ " + msg);
      return new Response(JSON.stringify({ error: msg }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: ud } = await supabase.auth.getUser(auth.replace("Bearer ", ""));
    if (!ud.user) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: corsHeaders });

    const { idea_id, amount_usd, equity_percentage, valuation_usd, contract_terms, payment_type, deal_id } = await req.json();
    const isDataRoom = payment_type === "data_room_fee";
    const effectiveAmountUsd = isDataRoom ? 5.0 : amount_usd;
    
    console.log("📥 Request params:", { idea_id, amount_usd, effectiveAmountUsd, isDataRoom, deal_id });
    
    if (!idea_id || !effectiveAmountUsd || effectiveAmountUsd <= 0) {
      return new Response(JSON.stringify({ error: "Missing fields: idea_id, amount_usd" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: idea } = await supabase.from("ideas").select("id, founder_id, title").eq("id", idea_id).maybeSingle();
    if (!idea) {
      return new Response(JSON.stringify({ error: "Idea not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (isDataRoom) {
      const { data: existingAccess } = await supabase.from("data_room_access").select("id").eq("user_id", ud.user.id).eq("idea_id", idea_id).eq("status", "approved").maybeSingle();
      if (existingAccess) {
        return new Response(JSON.stringify({ error: "Data room already unlocked" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabase.from("access_requests").upsert({
        investor_id: ud.user.id,
        idea_id,
        founder_id: idea.founder_id,
        transaction_type: "data_room_fee",
        data_room_fee_usd: effectiveAmountUsd,
        payment_status: "pending",
        status: "pending",
        message: "Awaiting Paymob payment confirmation",
      }, { onConflict: ["investor_id", "idea_id"] }).then(() => {}, () => {});
    }

    const platformFee = isDataRoom ? 0 : +(effectiveAmountUsd * PLATFORM_FEE_PCT / 100).toFixed(2);
    const totalEGPCents = Math.round(effectiveAmountUsd * FX_USD_TO_EGP * 100);

    const origin = req.headers.get("origin") || "https://coolad-api-magic.lovable.app";
    const redirectionUrl = `${origin}/payment-result`;

    // 1. Auth token
    console.log("🔐 Getting Paymob auth token...");
    const authRes = await fetch(`${PAYMOB_BASE}/auth/tokens`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: PAYMOB_API_KEY }),
    });
    const authJson = await authRes.json();
    if (!authRes.ok) throw new Error(`Paymob auth failed (${authRes.status}): ${JSON.stringify(authJson)}`);
    if (!authJson.token) throw new Error("Paymob auth: no token in response");
    const token = authJson.token;

    // 2. Create or reuse deal
    let merchantOrderId: number | string;
    let dealId: string | null = null;
    
    if (isDataRoom) {
      merchantOrderId = `DR_${idea_id}_${ud.user.id}_${Date.now()}`;
      console.log("💳 Data Room payment, merchant ID:", merchantOrderId);
    } else if (deal_id) {
      // Use existing deal
      console.log("♻️ Using existing deal:", deal_id);
      const { data: existing } = await supabase.from("deals").select("id").eq("id", deal_id).maybeSingle();
      if (!existing) throw new Error("Deal not found");
      dealId = deal_id;
      merchantOrderId = makeMerchantOrderId();
    } else {
      // Create new deal
      console.log("➕ Creating new deal...");
      merchantOrderId = makeMerchantOrderId();
      const { data: deal, error: dealErr } = await supabase.from("deals").insert({
        idea_id,
        investor_id: ud.user.id,
        founder_id: idea.founder_id,
        investment_amount_usd: effectiveAmountUsd,
        equity_percentage: equity_percentage || null,
        valuation_usd: valuation_usd || null,
        contract_terms: contract_terms || `Investment of $${effectiveAmountUsd} in ${idea.title}`,
        platform_fee_percentage: PLATFORM_FEE_PCT,
        platform_fee_amount: platformFee,
        payment_status: "pending",
        escrow_status: "none",
        status: "pending_founder",
        external_reference: String(merchantOrderId),
      }).select().single();
      if (dealErr) throw new Error(`Deal creation failed: ${dealErr.message}`);
      dealId = deal.id;
    }

    // 3. Order
    console.log("📦 Creating Paymob order, merchant ID:", merchantOrderId);
    const orderRes = await fetch(`${PAYMOB_BASE}/ecommerce/orders`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: token,
        delivery_needed: false,
        amount_cents: totalEGPCents,
        currency: "EGP",
        merchant_order_id: merchantOrderId,
        items: [{ name: (isDataRoom ? `Data Room: ${idea.title}` : `Investment in ${idea.title}`).slice(0, 50), amount_cents: totalEGPCents, description: "IDEVEST", quantity: 1 }],
      }),
    });
    const orderJson = await orderRes.json();
    if (!orderRes.ok) throw new Error(`Paymob order failed (${orderRes.status}): ${JSON.stringify(orderJson)}`);
    if (!orderJson.id) throw new Error("Paymob order: no order ID in response");

    // 4. Payment key
    console.log("🔑 Getting Paymob payment key...");
    let profile: any = null;
    try {
      const result = await supabase.from("profiles").select("full_name, phone_number").eq("id", ud.user.id).maybeSingle();
      profile = result.data;
    } catch (e) {
      console.warn("⚠️ Could not fetch profile, using defaults:", e instanceof Error ? e.message : String(e));
    }
    const [first, ...rest] = (profile?.full_name || "Investor").split(" ");
    const keyRes = await fetch(`${PAYMOB_BASE}/acceptance/payment_keys`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: token,
        amount_cents: totalEGPCents,
        expiration: 3600,
        order_id: orderJson.id,
        billing_data: {
          first_name: (first || "Investor").slice(0, 50),
          last_name: (rest.join(" ") || "User").slice(0, 50),
          email: (ud.user.email || "investor@idevest.com").slice(0, 100),
          phone_number: (profile?.phone_number || "+201000000000").slice(0, 20),
          apartment: "NA", floor: "NA", street: "NA", building: "NA",
          shipping_method: "NA", postal_code: "12345", city: "Cairo",
          country: "EG", state: "Cairo",
        },
        currency: "EGP",
        integration_id: Number(INTEGRATION_ID),
        lock_order_when_paid: true,
      }),
    });
    const keyJson = await keyRes.json();
    if (!keyRes.ok) throw new Error(`Paymob payment key failed (${keyRes.status}): ${JSON.stringify(keyJson)}`);
    if (!keyJson.token) throw new Error("Paymob payment key: no token in response");

    const iframeUrl = IFRAME_ID
      ? `https://accept.paymob.com/api/acceptance/iframes/${IFRAME_ID}?payment_token=${keyJson.token}`
      : null;

    console.log("✅ Payment initiation successful");
    return new Response(JSON.stringify({
      ok: true,
      deal_id: dealId,
      merchant_order_id: merchantOrderId,
      payment_token: keyJson.token,
      iframe_url: iframeUrl,
      order_id: orderJson.id,
      amount_usd: effectiveAmountUsd,
      platform_fee_usd: platformFee,
      net_to_founder_usd: +(effectiveAmountUsd - platformFee).toFixed(2),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("❌ paymob-initiate error:", msg);
    console.error("Full error:", e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});