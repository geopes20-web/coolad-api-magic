import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import PhoneOtpVerify from "@/components/PhoneOtpVerify";
import { Loader2, Phone } from "lucide-react";
import { useUserGate } from "@/hooks/useUserGate";

export default function VerifyPhone() {
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const nav = useNavigate();
  const { refresh } = useUserGate();

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="container mx-auto px-4 py-10 max-w-md">
      <div className="glass rounded-2xl p-6 shadow-glass space-y-4">
        <div className="flex items-center gap-3">
          <Phone className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">{isAr ? "تأكيد رقم الهاتف" : "Verify Phone"}</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {isAr ? "نحتاج لتأكيد رقم هاتفك عبر كود يصلك على الواتساب/SMS قبل المتابعة لـ KYC." : "We need to confirm your phone via SMS code before continuing to KYC."}
        </p>
        <PhoneOtpVerify
          isAr={isAr}
          onVerified={async () => { await refresh(); nav("/kyc"); }}
        />
      </div>
    </div>
  );
}
