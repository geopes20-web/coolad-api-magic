import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function ResetPassword() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);

  useEffect(() => {
    (async () => {
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
      const hashParams = new URLSearchParams(hash);
      const queryParams = new URLSearchParams(window.location.search);

      const access_token = hashParams.get("access_token") || queryParams.get("access_token");
      const refresh_token = hashParams.get("refresh_token") || queryParams.get("refresh_token");
      const type = hashParams.get("type") || queryParams.get("type");
      const errorDesc = hashParams.get("error_description") || queryParams.get("error_description");

      if (errorDesc) {
        toast({ title: t.common.error, description: errorDesc, variant: "destructive" });
        navigate("/forgot-password", { replace: true });
        return;
      }

      // CRITICAL: a recovery link must establish a fresh session for the
      // recipient email. Drop any pre-existing session first so we never
      // update the currently-logged-in user by accident.
      if (access_token && refresh_token && type === "recovery") {
        try { await supabase.auth.signOut({ scope: "local" } as any); } catch {}
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        // Strip tokens from the URL so a reload can't re-apply them.
        window.history.replaceState({}, "", "/reset-password");
        if (error) {
          toast({ title: t.common.error, description: error.message, variant: "destructive" });
          navigate("/forgot-password", { replace: true });
          return;
        }
        setCheckingLink(false);
        return;
      }

      // No tokens at all → must come from the email link.
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate("/forgot-password", { replace: true });
        return;
      }
      setCheckingLink(false);
    })();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: t.common.error, description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: t.common.error, description: "Password confirmation does not match", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: t.common.error, description: error.message, variant: "destructive" });
    } else {
      toast({ title: t.common.success, description: t.auth.passwordUpdated });
      navigate("/dashboard");
    }
  };

  if (checkingLink) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">{t.auth.resetPassword}</h1>
        </div>
        <div className="glass rounded-2xl p-8 shadow-glass">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t.auth.newPassword}</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input id="confirm-password" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full gradient-primary border-0 text-primary-foreground" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t.auth.updatePassword}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
