// verify-id-card: Mindee Egyptian ID OCR + cross-check + AI tampering check
// Input: { frontPath, backPath, userEnteredNationalId }
// Output: { ok, autoApproved, mindee, ai, reason? }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MINDEE_BASE = "https://api-v2.mindee.net/v2";

async function runMindee(modelId: string, apiKey: string, imageUrl: string) {
  // Download then upload to Mindee
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error("Failed to fetch image for Mindee");
  const buf = new Uint8Array(await imgRes.arrayBuffer());
  const fd = new FormData();
  fd.append("model_id", modelId);
  fd.append("file", new Blob([buf]), "id.jpg");

  const enq = await fetch(`${MINDEE_BASE}/inferences/enqueue`, {
    method: "POST",
    headers: { Authorization: apiKey },
    body: fd,
  });
  if (!enq.ok) throw new Error(`Mindee enqueue failed: ${enq.status} ${await enq.text()}`);
  const enqJson = await enq.json();
  const jobId = enqJson?.job?.id || enqJson?.id;
  if (!jobId) throw new Error("Mindee: no job id");

  // poll
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    const j = await fetch(`${MINDEE_BASE}/jobs/${jobId}`, { headers: { Authorization: apiKey } });
    const jj = await j.json();
    const status = jj?.job?.status || jj?.status;
    if (status === "Processed" || status === "completed") {
      const resultUrl = jj?.job?.polling_url?.replace("/jobs/", "/inferences/") || `${MINDEE_BASE}/inferences/${jobId}`;
      const ir = await fetch(resultUrl, { headers: { Authorization: apiKey } });
      return await ir.json();
    }
    if (status === "Failed") throw new Error("Mindee processing failed");
  }
  throw new Error("Mindee timeout");
}

function pickField(prediction: any, keys: string[]): string | null {
  if (!prediction) return null;
  for (const k of keys) {
    const v = prediction?.[k]?.value ?? prediction?.fields?.[k]?.value ?? prediction?.[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const MINDEE_API_KEY = Deno.env.get("MINDEE_API_KEY");
    const MINDEE_MODEL_ID = Deno.env.get("MINDEE_MODEL_ID");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: ud, error: ue } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (ue || !ud.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = ud.user.id;

    const body = await req.json();
    const { frontPath, backPath, userEnteredNationalId } = body || {};
    if (!frontPath || !backPath) {
      return new Response(JSON.stringify({ error: "Missing image paths" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [frontSigned, backSigned] = await Promise.all([
      supabase.storage.from("kyc-documents").createSignedUrl(frontPath, 600),
      supabase.storage.from("kyc-documents").createSignedUrl(backPath, 600),
    ]);
    if (frontSigned.error || backSigned.error) {
      return new Response(JSON.stringify({ error: "Failed to access images" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === 1) Mindee OCR on the front side (where national ID + name + DOB live) ===
    let mindeeResult: any = null;
    let extractedId: string | null = null;
    let extractedName: string | null = null;
    let extractedDob: string | null = null;
    if (MINDEE_API_KEY && MINDEE_MODEL_ID) {
      try {
        const mr = await runMindee(MINDEE_MODEL_ID, MINDEE_API_KEY, frontSigned.data.signedUrl);
        mindeeResult = mr;
        const pred = mr?.inference?.prediction || mr?.document?.inference?.prediction || mr?.prediction;
        extractedId = pickField(pred, ["national_id", "id_number", "nationalIdNumber", "id"]);
        extractedName = pickField(pred, ["full_name", "name", "given_names", "surname"]);
        extractedDob = pickField(pred, ["date_of_birth", "birth_date", "dob"]);
      } catch (e) {
        console.error("Mindee error:", e);
      }
    }

    // === 2) AI tampering / face presence check (Gemini Vision) ===
    let aiResult: any = null;
    if (LOVABLE_API_KEY) {
      try {
        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content: "You verify Egyptian national ID cards. Return JSON via the tool. Reject if image is not an ID card.",
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
                name: "report",
                parameters: {
                  type: "object",
                  properties: {
                    is_id_card: { type: "boolean", description: "True only if both images are clearly Egyptian national ID card sides" },
                    has_face_photo: { type: "boolean" },
                    tampering_detected: { type: "boolean" },
                    image_quality: { type: "string", enum: ["excellent", "good", "poor", "unreadable"] },
                    confidence: { type: "number" },
                    notes: { type: "string" },
                  },
                  required: ["is_id_card", "has_face_photo", "tampering_detected", "image_quality", "confidence"],
                },
              },
            }],
            tool_choice: { type: "function", function: { name: "report" } },
          }),
        });
        if (aiResp.ok) {
          const aj = await aiResp.json();
          const tc = aj.choices?.[0]?.message?.tool_calls?.[0];
          if (tc) aiResult = JSON.parse(tc.function.arguments);
        }
      } catch (e) {
        console.error("AI error:", e);
      }
    }

    // === 3) Decide: auto-approve if Mindee ID matches user input AND AI confirms it's an ID card with no tampering ===
    let autoApproved = false;
    let reason: string | null = null;

    const normEntered = (userEnteredNationalId || "").replace(/\D/g, "");
    const normExtracted = (extractedId || "").replace(/\D/g, "");

    if (aiResult && aiResult.is_id_card === false) {
      reason = "Uploaded image is not an Egyptian national ID card";
    } else if (aiResult && aiResult.tampering_detected) {
      reason = "Possible tampering detected on the ID card";
    } else if (aiResult && aiResult.image_quality === "unreadable") {
      reason = "ID image is unreadable, please upload clearer photos";
    } else if (normEntered && normExtracted && normEntered.length === 14 && normExtracted.length === 14) {
      if (normEntered === normExtracted) {
        autoApproved = true;
      } else {
        reason = `National ID mismatch: you entered ${normEntered}, ID card shows ${normExtracted}`;
      }
    } else if (!normExtracted) {
      reason = null;
    } else if (normEntered && normEntered.length !== 14) {
      reason = "National ID must be exactly 14 digits";
    }

    // === 4) Persist on KYC row ===
    const updates: Record<string, unknown> = {
      mindee_extracted_data: mindeeResult,
      mindee_verified_at: new Date().toISOString(),
      ai_verification_result: aiResult,
      ai_verified_at: new Date().toISOString(),
    };
    if (autoApproved) {
      updates.status = "approved";
      updates.reviewed_at = new Date().toISOString();
    } else if (reason) {
      updates.status = "rejected";
      updates.rejection_reason = reason;
    } else {
      updates.status = "pending";
      updates.rejection_reason = "Needs manual admin review: OCR could not confidently read all required fields.";
    }
    await supabase.from("kyc_verifications").update(updates).eq("user_id", userId);

    return new Response(JSON.stringify({
      ok: true,
      autoApproved,
      reason,
      extractedId: normExtracted,
      mindeeAvailable: !!mindeeResult,
      ai: aiResult,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("verify-id-card error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
