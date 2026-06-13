import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Sparkles, Loader2, Eye, EyeOff } from "lucide-react";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default function Login() {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [canResendConfirmation, setCanResendConfirmation] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    setLoading(false);

    if (error) {
      const errorMessage = error.message.toLowerCase();
      const shouldOfferResend = /confirm|unconfirmed|verify|verification/.test(errorMessage);
      setCanResendConfirmation(shouldOfferResend);
      toast({ title: t.common.error, description: error.message, variant: "destructive" });
    } else if (data.user) {
      const roleMetadata = data.user.user_metadata?.role as string | undefined;
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (!roleRow && roleMetadata) {
        await supabase.from("user_roles").insert({ user_id: data.user.id, role: roleMetadata });
      }

      const isAdmin = roleRow?.role === "admin";
      navigate(isAdmin ? "/admin" : "/dashboard");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t.auth.login}</h1>
        </div>

        <div className="glass rounded-2xl p-8 shadow-glass">
          <GoogleSignInButton label={isAr ? "تسجيل الدخول عبر Google" : "Sign in with Google"} />
          <div className="my-5 flex items-center gap-3">
            <div className="h-px bg-border flex-1" />
            <span className="text-xs text-muted-foreground">{isAr ? "أو" : "OR"}</span>
            <div className="h-px bg-border flex-1" />
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t.auth.email}</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">{t.auth.password}</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                  {t.auth.forgotPassword}
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pe-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full gradient-primary border-0 text-primary-foreground" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t.auth.signIn}
            </Button>
          </form>

          {canResendConfirmation && (
            <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
              <p className="mb-3">
                {isAr
                  ? "حسابك لم يتم تأكيده بعد. يمكنك إعادة إرسال رابط التأكيد إلى بريدك الإلكتروني." 
                  : "Your email is not confirmed yet. You can resend the confirmation link."}
              </p>
              <Button
                type="button"
                className="w-full"
                variant="outline"
                disabled={resendLoading || !email.trim()}
                onClick={async () => {
                  setResendLoading(true);
                  const { error } = await supabase.auth.resend({
                    email: email.trim().toLowerCase(),
                    type: "signup",
                    options: {
                      emailRedirectTo: `${window.location.origin}/confirm-email?email=${encodeURIComponent(email.trim().toLowerCase())}`,
                    },
                  });
                  setResendLoading(false);
                  if (error) {
                    toast({ title: t.common.error, description: error.message, variant: "destructive" });
                  } else {
                    toast({ title: t.common.success, description: t.auth.resendConfirmationSuccess });
                  }
                }}
              >
                {resendLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t.auth.resendConfirmation}
              </Button>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            {t.auth.noAccount}{" "}
            <Link to="/register" className="text-primary hover:underline font-medium">{t.auth.signUp}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
