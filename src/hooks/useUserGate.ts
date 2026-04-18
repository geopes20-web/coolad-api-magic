/**
 * useUserGate
 * Centralized check for what the user is allowed to do.
 * Order: phone -> KYC approved -> NDA per chat thread.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserGateState {
  loading: boolean;
  hasPhone: boolean;
  kycStatus: "not_started" | "pending" | "approved" | "rejected";
  isAdmin: boolean;
  /** True when phone present AND KYC approved. Required to chat / sign deals. */
  canTransact: boolean;
  refresh: () => Promise<void>;
}

export function useUserGate(): UserGateState {
  const { user, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasPhone, setHasPhone] = useState(false);
  const [kycStatus, setKycStatus] = useState<UserGateState["kycStatus"]>("not_started");

  const load = async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const [{ data: profile }, { data: kyc }] = await Promise.all([
      supabase.from("profiles").select("phone_number").eq("id", user.id).maybeSingle(),
      supabase.from("kyc_verifications").select("status").eq("user_id", user.id).maybeSingle(),
    ]);
    setHasPhone(!!profile?.phone_number?.trim());
    setKycStatus((kyc?.status as UserGateState["kycStatus"]) || "not_started");
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id]);

  const isAdmin = userRole === "admin";
  const canTransact = hasPhone && kycStatus === "approved";

  return { loading, hasPhone, kycStatus, isAdmin, canTransact, refresh: load };
}
