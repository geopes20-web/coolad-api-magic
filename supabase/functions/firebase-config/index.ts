// firebase-config: returns Firebase web config (publishable values) so the frontend
// doesn't need them hardcoded. Only non-secret fields are returned.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  return new Response(JSON.stringify({
    apiKey: Deno.env.get("FIREBASE_API_KEY") || "",
    authDomain: Deno.env.get("FIREBASE_AUTH_DOMAIN") || "",
    projectId: Deno.env.get("FIREBASE_PROJECT_ID") || "",
    appId: Deno.env.get("FIREBASE_APP_ID") || "",
    messagingSenderId: Deno.env.get("FIREBASE_MESSAGING_SENDER_ID") || "",
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
