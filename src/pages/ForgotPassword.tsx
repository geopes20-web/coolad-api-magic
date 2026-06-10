import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown(v => Math.max(0, v - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return;
    setLoading(true);
    const redirectOrigin = window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${redirectOrigin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      const wait = Number(error.message.match(/after\s+(\d+)\s+seconds/i)?.[1] || 60);
      if (/security purposes|rate limit|after\s+\d+\s+seconds/i.test(error.message)) setCooldown(wait);
      toast({ title: t.common.error, description: error.message, variant: "destructive" });
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">{t.auth.resetPassword}</h1>
        </div>
        <div className="glass rounded-2xl p-8 shadow-glass">
          {sent ? (
            <div className="text-center">
              <p className="text-muted-foreground mb-4">{t.auth.resetSent}</p>
              <Link to="/login">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 me-2" />
                  {t.auth.signIn}
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t.auth.email}</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <Button type="submit" className="w-full gradient-primary border-0 text-primary-foreground" disabled={loading || cooldown > 0}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : cooldown > 0 ? `Wait ${cooldown}s` : t.auth.resetLink}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
