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
  if (!idToken) throw new Error("Verification token missing");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const payload = {
    phone_number: phoneE164,
    phone_verified_at: new Date().toISOString(),
  };

  const [{ error: profileError }, { error: kycError }] = await Promise.all([
    supabase.from("profiles").update(payload).eq("id", user.id),
    supabase.from("kyc_verifications").update({ phone_number: phoneE164 }).eq("user_id", user.id),
  ]);

  if (profileError) throw new Error(profileError.message || "Verification failed");
  if (kycError && kycError.code !== "PGRST116") throw new Error(kycError.message || "Verification failed");

  return { ok: true, phone: phoneE164 };
}
