import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Mail, Loader2, ArrowLeft } from "lucide-react";

export default function ConfirmEmail() {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  const email = searchParams.get("email")?.trim().toLowerCase() ?? "";

  const resendEmail = async () => {
    if (!email) {
      toast({
        title: t.common.error,
        description: isAr
          ? "يرجى إدخال البريد الإلكتروني لإعادة إرسال رابط التأكيد."
          : "Please provide your email address to resend the confirmation link.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resend({
      email,
      type: "signup",
      options: {
        emailRedirectTo: `${window.location.origin}/confirm-email?email=${encodeURIComponent(email)}`,
      },
    });
    setLoading(false);

    if (error) {
      toast({ title: t.common.error, description: error.message, variant: "destructive" });
    } else {
      toast({ title: t.common.success, description: t.auth.resendConfirmationSuccess });
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t.auth.confirmEmail}</h1>
        </div>

        <div className="glass rounded-2xl p-8 shadow-glass space-y-6">
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>{t.auth.confirmEmailSent}</p>
            {email && (
              <p>
                <span className="font-medium text-foreground">{email}</span>
              </p>
            )}
          </div>

          <div className="space-y-4">
            <Button className="w-full gradient-primary border-0 text-primary-foreground" onClick={resendEmail} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t.auth.resendConfirmation}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate("/login")}> 
              <ArrowLeft className="mr-2 h-4 w-4" />
              {isAr ? "العودة لتسجيل الدخول" : "Back to login"}
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            {isAr
              ? "بعد تأكيد حسابك عبر البريد الإلكتروني، يمكنك تسجيل الدخول والمتابعة." 
              : "After confirming your email, sign in again to continue."}
          </p>

          <p className="text-center text-sm text-muted-foreground">
            <Link to="/register" className="text-primary hover:underline">
              {isAr ? "إنشاء حساب جديد" : "Create a new account"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
