import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export default function BlockedBanner() {
  const { user, isBlocked, blockedReason, signOut } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  if (!user || !isBlocked) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass rounded-2xl p-8 max-w-md w-full text-center shadow-glass border border-destructive/30">
        <div className="w-14 h-14 rounded-2xl bg-destructive/10 mx-auto flex items-center justify-center mb-4">
          <ShieldAlert className="h-7 w-7 text-destructive" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          {isAr ? "تم حظر حسابك" : "Your account is blocked"}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {isAr
            ? "تم تعليق حسابك من قبل إدارة المنصة. لا يمكنك إجراء أي عمليات في الوقت الحالي."
            : "Your account has been suspended by platform administration. You cannot perform any actions at this time."}
        </p>
        {blockedReason && (
          <div className="rounded-xl bg-muted/40 p-3 mb-4 text-xs text-muted-foreground">
            <strong className="text-foreground">{isAr ? "السبب: " : "Reason: "}</strong>
            {blockedReason}
          </div>
        )}
        <Button variant="outline" onClick={signOut} className="w-full">
          {isAr ? "تسجيل الخروج" : "Sign out"}
        </Button>
      </div>
    </div>
  );
}