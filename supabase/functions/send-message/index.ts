// Server-side message sending with chat filter validation
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mirror of client-side filter (server-side authoritative)
function normalizeText(text: string): string {
  let t = text.replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g, '').normalize('NFKC');
  const charMap: Record<string, string> = {
    'O':'0','o':'0','Q':'0','I':'1','l':'1','|':'1','L':'1','Z':'2','z':'2','E':'3','e':'3',
    'A':'4','a':'4','@':'4','S':'5','s':'5','$':'5','G':'6','b':'6','T':'7','t':'7','B':'8','g':'9','q':'9',
    '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9',
  };
  return t.split('').map(c => charMap[c] || c).join('');
}
function stripSeparators(text: string): string {
  return text.replace(/(\d)[\s\-\._/\\(),\[\]<>~`*'"]+(?=\d)/g, '$1');
}
function convertSpelled(text: string): string {
  const map: Record<string,string> = {
    'zero':'0','one':'1','two':'2','three':'3','four':'4','five':'5','six':'6','seven':'7','eight':'8','nine':'9',
    'صفر':'0','واحد':'1','اثنين':'2','ثلاثة':'3','اربعة':'4','خمسة':'5','ستة':'6','سبعة':'7','ثمانية':'8','تسعة':'9',
  };
  let r = text.toLowerCase();
  for (const [w, d] of Object.entries(map)) r = r.replace(new RegExp(`\\b${w}\\b`, 'gi'), d);
  return r;
}
function detectViolations(text: string): string[] {
  const detected: string[] = [];
  const norm = stripSeparators(normalizeText(text));
  const spelled = stripSeparators(convertSpelled(norm));
  if (/(\+?20|0)?1[0125]\d{8}/.test(spelled)) detected.push('egyptian_phone');
  else if (/\+\d{7,15}/.test(spelled)) detected.push('intl_phone');
  else if (/\d{7,15}/.test(spelled)) detected.push('phone');
  if (/[\w.\-+]{2,}\s*(?:@|\[at\]|\(at\)|أت|\bat\b)\s*[\w.\-]{2,}\s*(?:\.|dot|دوت|نقطة)\s*[a-z]{2,10}/i.test(norm)) detected.push('email_obf');
  if (/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/.test(norm)) detected.push('email');
  if (/(?:https?:\/\/|www\.)[^\s]{2,}/i.test(text)) detected.push('url');
  if (/\b[a-zA-Z0-9\-]{2,}\.(com|net|org|io|me|co|app|dev|info|biz|xyz|ly|gl|sh|tv|ai|gg|tk|cc|eg|sa|ae)\b/i.test(text)) detected.push('domain');
  if (/(facebook|fb|instagram|insta|whatsapp|wa|telegram|twitter|linkedin|snapchat|tiktok|discord|skype|signal|viber)/i.test(text)) detected.push('social');
  if (/(واتساب|فيسبوك|انستجرام|انستا|تليجرام|تلجرام|تويتر|سناب|تيكتوك|ديسكورد|جيميل|ياهو|هوتميل)/i.test(text)) detected.push('arabic_social');
  if (/@[\w.\-]{3,30}/.test(text)) detected.push('handle');
  return detected;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { receiver_id, content, idea_id } = await req.json();

    if (!receiver_id || !content || typeof content !== "string") {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (content.length > 2000) {
      return new Response(JSON.stringify({ error: "Message too long" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Run server-side filter
    const violations = detectViolations(content);
    if (violations.length > 0) {
      // Log the violation
      const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      await admin.from("chat_violations").insert({
        user_id: user.id,
        receiver_id,
        blocked_content: content.slice(0, 500),
        detected_patterns: violations,
        severity: violations.length >= 3 ? 'high' : 'medium',
      });

      return new Response(JSON.stringify({
        error: "blocked",
        message: "External contact info detected",
        patterns: violations,
      }), { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Insert message
    const { data, error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id,
      idea_id: idea_id || null,
      content: content.trim(),
    }).select().single();

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, message: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-message error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
