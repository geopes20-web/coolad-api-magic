import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! // Service role for bypassing RLS to check deals/kyc securely
    );
    
    // Get calling user
    const { data: { user }, error: authErr } = await supabase.auth.getUser(auth.replace("Bearer ", ""));
    if (authErr || !user) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: corsHeaders });

    const { partner_id } = await req.json();
    if (!partner_id) {
      return new Response(JSON.stringify({ error: "Missing partner_id" }), { status: 400, headers: corsHeaders });
    }

    // Check if there is a paid deal between user and partner_id
    const { data: deals, error: dealErr } = await supabase
      .from("deals")
      .select("id")
      .or(`and(founder_id.eq.${user.id},investor_id.eq.${partner_id}),and(founder_id.eq.${partner_id},investor_id.eq.${user.id})`)
      .eq("payment_status", "paid")
      .limit(1);

    if (dealErr || !deals || deals.length === 0) {
      return new Response(JSON.stringify({ error: "No paid deal found. Access denied." }), { status: 403, headers: corsHeaders });
    }

    // Fetch partner KYC
    const { data: kyc, error: kycErr } = await supabase
      .from("kyc_verifications")
      .select("status, full_legal_name, national_id, date_of_birth, phone_number, nationality, reviewed_at, id_card_front_url, id_card_back_url")
      .eq("user_id", partner_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (kycErr || !kyc) {
      return new Response(JSON.stringify({ error: "Partner KYC not found" }), { status: 404, headers: corsHeaders });
    }

    // Fetch partner email from profiles (or auth users if possible, but profiles usually doesn't have email. Wait, in Contract.tsx we used `email` from profile or fallback)
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone_number")
      .eq("id", partner_id)
      .maybeSingle();
      
    // Create signed URLs for images
    let frontUrl = null;
    let backUrl = null;
    
    if (kyc.id_card_front_url) {
      const { data: frontData } = await supabase.storage.from("kyc-documents").createSignedUrl(kyc.id_card_front_url, 3600);
      frontUrl = frontData?.signedUrl || null;
    }
    
    if (kyc.id_card_back_url) {
      const { data: backData } = await supabase.storage.from("kyc-documents").createSignedUrl(kyc.id_card_back_url, 3600);
      backUrl = backData?.signedUrl || null;
    }

    // We fetch email via admin auth API because the profiles table doesn't have email in this DB schema.
    const { data: adminUser } = await supabase.auth.admin.getUserById(partner_id);
    const email = adminUser?.user?.email || null;

    return new Response(JSON.stringify({
      ok: true,
      partner: {
        full_name: kyc.full_legal_name || profile?.full_name,
        email: email,
        phone_number: kyc.phone_number || profile?.phone_number,
        national_id: kyc.national_id,
        nationality: kyc.nationality,
        date_of_birth: kyc.date_of_birth,
        kyc_status: kyc.status,
        verified_at: kyc.reviewed_at,
        id_card_front_url: frontUrl,
        id_card_back_url: backUrl,
      }
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
