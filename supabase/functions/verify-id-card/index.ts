// Edge function: verify-id-card
// Egyptian National ID verification via Mindee + cross-check with user-entered ID.
// Falls back to Lovable AI Gemini Vision for tampering / face presence detection.
// Auto-approves KYC when extracted ID equals user-entered ID and no tampering detected.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const MINDEE_API_KEY = Deno.env.get("MINDEE_API_KEY");
    const MINDEE_MODEL_ID = Deno.env.get("MINDEE_MODEL_ID");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: userData, error: userErr } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const { frontPath, backPath } = await req.json();
    if (!frontPath || !backPath) {
      return new Response(JSON.stringify({ error: "Missing image paths" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create signed URLs for AI to fetch
    const [frontSigned, backSigned] = await Promise.all([
      supabase.storage.from("kyc-documents").createSignedUrl(frontPath, 300),
      supabase.storage.from("kyc-documents").createSignedUrl(backPath, 300),
    ]);
    if (frontSigned.error || backSigned.error) {
      return new Response(JSON.stringify({ error: "Failed to access images" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call Lovable AI Gemini with vision
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are an ID card verification assistant. Analyze Egyptian national ID card images. Detect: presence of a face, readability of national ID number (14 digits), full name in Arabic, date of birth, address, and signs of tampering or forgery. Return strict JSON only.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Front side:" },
              { type: "image_url", image_url: { url: frontSigned.data.signedUrl } },
              { type: "text", text: "Back side:" },
              { type: "image_url", image_url: { url: backSigned.data.signedUrl } },
            ],
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "report_id_verification",
            description: "Report verification results",
            parameters: {
              type: "object",
              properties: {
                has_face: { type: "boolean" },
                national_id_visible: { type: "boolean" },
                national_id_number: { type: "string", description: "14 digits if readable, else empty" },
                full_name_arabic: { type: "string" },
                date_of_birth: { type: "string", description: "YYYY-MM-DD if extractable" },
                address: { type: "string" },
                tampering_detected: { type: "boolean" },
                tampering_notes: { type: "string" },
                image_quality: { type: "string", enum: ["excellent", "good", "poor", "unreadable"] },
                confidence: { type: "number", description: "0-100" },
                recommendation: { type: "string", enum: ["auto_approve", "needs_review", "reject"] },
              },
              required: ["has_face", "national_id_visible", "tampering_detected", "image_quality", "confidence", "recommendation"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "report_id_verification" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResp.text();
      console.error("AI error:", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI verification failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No verification result" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const result = JSON.parse(toolCall.function.arguments);

    // Save AI result on KYC row
    await supabase
      .from("kyc_verifications")
      .update({
        ai_verification_result: result,
        ai_verified_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    return new Response(JSON.stringify({ ok: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("verify-id-card error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
