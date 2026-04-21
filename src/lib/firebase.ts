/**
 * Firebase phone OTP helper.
 * Loads publishable Firebase config from the backend (no secrets in source).
 */
import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth, RecaptchaVerifier, signInWithPhoneNumber,
  type Auth, type ConfirmationResult,
} from "firebase/auth";
import { supabase } from "@/integrations/supabase/client";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

async function ensureApp(): Promise<Auth> {
  if (auth) return auth;
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/firebase-config`;
  const res = await fetch(url, {
    headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string },
  });
  if (!res.ok) throw new Error("Phone OTP service unavailable");
  const cfg = await res.json();
  if (!cfg.apiKey) throw new Error("Phone OTP not configured");
  app = initializeApp(cfg);
  auth = getAuth(app);
  auth.languageCode = "ar";
  return auth;
}

let verifier: RecaptchaVerifier | null = null;

export async function sendPhoneOtp(phoneE164: string, containerId: string): Promise<ConfirmationResult> {
  const a = await ensureApp();
  if (!verifier) {
    verifier = new RecaptchaVerifier(a, containerId, { size: "invisible" });
    await verifier.render();
  }
  return signInWithPhoneNumber(a, phoneE164, verifier);
}

export async function confirmPhoneOtp(
  confirmation: ConfirmationResult,
  code: string,
): Promise<{ idToken: string; phone: string }> {
  const result = await confirmation.confirm(code);
  const idToken = await result.user.getIdToken();
  return { idToken, phone: result.user.phoneNumber || "" };
}

export async function verifyPhoneWithBackend(idToken: string, phoneE164: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not signed in");
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-phone-otp`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
      },
      body: JSON.stringify({ idToken, phoneNumber: phoneE164 }),
    },
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Verification failed");
  return json;
}
