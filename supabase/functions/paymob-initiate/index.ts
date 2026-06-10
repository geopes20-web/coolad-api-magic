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
    const PAYMOB_API_KEY = Deno.env.get("PAYMOB_API_KEY");
    const INTEGRATION_ID = Deno.env.get("PAYMOB_INTEGRATION_ID");
    if (!PAYMOB_API_KEY || !INTEGRATION_ID) {
      return new Response(JSON.stringify({ error: "Paymob not configured" }), {
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

    const { idea_id, amount_usd, equity_percentage, valuation_usd, contract_terms, deal_id } = await req.json();
    const effectiveAmountUsd = amount_usd;
    if (!idea_id || !effectiveAmountUsd || effectiveAmountUsd <= 0) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: idea } = await supabase.from("ideas").select("id, founder_id, title").eq("id", idea_id).maybeSingle();
    if (!idea) {
      return new Response(JSON.stringify({ error: "Idea not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const platformFee = +(effectiveAmountUsd * PLATFORM_FEE_PCT / 100).toFixed(2);
    const fxRate = 50;
    const totalEGPCents = Math.round(effectiveAmountUsd * fxRate * 100);

    // ✅ Dynamic redirection URL based on request origin
    const origin = req.headers.get("origin") || "https://coolad-api-magic.lovable.app";
    const redirectionUrl = `${origin}/payment-result`;

    // 1. Auth token
    const authRes = await fetch(`${PAYMOB_BASE}/auth/tokens`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: PAYMOB_API_KEY }),
    });
    const authJson = await authRes.json();
    if (!authRes.ok) throw new Error(`Paymob auth failed: ${JSON.stringify(authJson)}`);
    const token = authJson.token;

    // 2. Use the signed deal when available; otherwise create a fresh deal.
    let merchantOrderId: string;
    let dealId: string | null = null;
    if (deal_id) {
      const { data: existing, error: existingErr } = await supabase
        .from("deals")
        .select("id, investor_id, founder_id, payment_status")
        .eq("id", deal_id)
        .eq("idea_id", idea_id)
        .maybeSingle();
      if (existingErr) throw new Error(`Deal lookup failed: ${existingErr.message}`);
      if (!existing) throw new Error("Deal not found");
      if (existing.investor_id !== ud.user.id && existing.founder_id !== ud.user.id) throw new Error("Not allowed for this deal");
      if (existing.payment_status === "paid") throw new Error("Deal already paid");
      dealId = existing.id;
      merchantOrderId = existing.id;
    } else {
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
      }).select().single();
      if (dealErr) throw new Error(`Deal creation failed: ${dealErr.message}`);
      dealId = deal.id;
      merchantOrderId = deal.id;
    }

    // 3. Order
    const orderRes = await fetch(`${PAYMOB_BASE}/ecommerce/orders`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: token,
        delivery_needed: false,
        amount_cents: totalEGPCents,
        currency: "EGP",
        merchant_order_id: merchantOrderId,
        items: [{ name: `Investment in ${idea.title}`.slice(0, 50), amount_cents: totalEGPCents, description: "IDEVEST", quantity: 1 }],
      }),
    });
    const orderJson = await orderRes.json();
    if (!orderRes.ok) throw new Error(`Paymob order failed: ${JSON.stringify(orderJson)}`);

    // 4. Payment key
    const { data: profile } = await supabase.from("profiles").select("full_name, phone_number").eq("id", ud.user.id).maybeSingle();
    const [first, ...rest] = (profile?.full_name || "Investor").split(" ");
    const keyRes = await fetch(`${PAYMOB_BASE}/acceptance/payment_keys`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: token,
        amount_cents: totalEGPCents,
        expiration: 3600,
        order_id: orderJson.id,
        billing_data: {
          first_name: first || "Investor",
          last_name: rest.join(" ") || "User",
          email: ud.user.email || "investor@idevest.com",
          phone_number: profile?.phone_number || "+201000000000",
          apartment: "NA", floor: "NA", street: "NA", building: "NA",
          shipping_method: "NA", postal_code: "NA", city: "Cairo",
          country: "EG", state: "NA",
        },
        currency: "EGP",
        integration_id: Number(INTEGRATION_ID),
        lock_order_when_paid: true,
        use_redirection: true,
        redirection_url: redirectionUrl,
      }),
    });
    const keyJson = await keyRes.json();
    if (!keyRes.ok) throw new Error(`Paymob payment_key failed: ${JSON.stringify(keyJson)}`);

    const iframeId = Deno.env.get("PAYMOB_IFRAME_ID") || "";
    const iframeUrl = iframeId
      ? `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${keyJson.token}`
      : null;

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
    console.error("paymob-initiate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});