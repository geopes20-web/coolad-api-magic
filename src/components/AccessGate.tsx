/**
 * AccessGate
 * Blocks access to chat/deals when the user has not completed:
 * 1. Phone number (in profile)
 * 2. KYC approval
 * Renders a friendly call-to-action with progress.
 */
import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { useUserGate } from "@/hooks/useUserGate";
import { ShieldCheck, Phone, Loader2, CheckCircle2, Clock, XCircle } from "lucide-react";

interface AccessGateProps {
  children: ReactNode;
  /** What feature is being gated (for friendlier copy). */
  feature?: "chat" | "deals" | "generic";
}

export default function AccessGate({ children, feature = "generic" }: AccessGateProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { loading, hasPhone, kycStatus, canTransact } = useUserGate();

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (canTransact) return <>{children}</>;

  const featureLabel =
    feature === "chat" ? (isAr ? "الدردشة" : "Chat") :
    feature === "deals" ? (isAr ? "الصفقات" : "Deals") :
    (isAr ? "هذه الميزة" : "this feature");

  const StepIcon = ({ done, pending }: { done: boolean; pending?: boolean }) =>
    done ? <CheckCircle2 className="h-5 w-5 text-primary" /> :
    pending ? <Clock className="h-5 w-5 text-muted-foreground" /> :
    <XCircle className="h-5 w-5 text-muted-foreground/50" />;

  return (
    <div className="container mx-auto px-4 py-10 max-w-xl">
      <div className="glass rounded-2xl p-8 shadow-glass text-center">
        <div className="w-14 h-14 rounded-2xl gradient-primary mx-auto flex items-center justify-center mb-4">
          <ShieldCheck className="w-7 h-7 text-primary-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          {isAr ? "أكمل التحقق للوصول إلى " : "Complete verification to access "}{featureLabel}
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          {isAr
            ? "لحماية المنصة وضمان الجدية، عليك إكمال الخطوات التالية:"
            : "To protect the platform and ensure authenticity, please complete the following steps:"}
        </p>

        <div className="space-y-3 text-start mb-6">
          <div className="flex items-center gap-3 p-3 rounded-xl border border-border/60">
            <StepIcon done={hasPhone} />
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-sm text-foreground">
              {isAr ? "1. رقم الهاتف في الملف الشخصي" : "1. Phone number on profile"}
            </span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl border border-border/60">
            <StepIcon done={kycStatus === "approved"} pending={kycStatus === "pending"} />
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-sm text-foreground">
              {isAr
                ? `2. التحقق من الهوية (KYC) — ${kycStatus === "pending" ? "قيد المراجعة" : kycStatus === "rejected" ? "مرفوض" : kycStatus === "not_started" ? "لم يبدأ" : ""}`
                : `2. Identity verification (KYC) — ${kycStatus}`}
            </span>
          </div>
        </div>

        <div className="flex gap-2 justify-center">
          {!hasPhone && (
            <Link to="/dashboard">
              <Button variant="outline">{isAr ? "أضف الهاتف" : "Add Phone"}</Button>
            </Link>
          )}
          {kycStatus !== "approved" && (
            <Link to="/kyc">
              <Button className="gradient-primary border-0 text-primary-foreground">
                {isAr ? "ابدأ التحقق" : "Start KYC"}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
