import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Sparkles, Loader2, Rocket, DollarSign, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

type Role = "entrepreneur" | "investor" | "explorer";

export default function Register() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("explorer");
  const [loading, setLoading] = useState(false);

  const roles = [
    { value: "entrepreneur" as Role, label: t.auth.entrepreneur, desc: t.auth.entrepreneurDesc, icon: Rocket },
    { value: "investor" as Role, label: t.auth.investor, desc: t.auth.investorDesc, icon: DollarSign },
    { value: "explorer" as Role, label: t.auth.explorer, desc: t.auth.explorerDesc, icon: Compass },
  ];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: t.common.error, description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      toast({ title: t.common.error, description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Insert role
    if (data.user) {
      await supabase.from("user_roles").insert({ user_id: data.user.id, role });
    }

    setLoading(false);
    toast({ title: t.common.success, description: "Account created successfully!" });
    navigate("/dashboard");
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t.auth.register}</h1>
        </div>

        <div className="glass rounded-2xl p-8 shadow-glass">
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fullName">{t.auth.fullName}</Label>
              <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t.auth.email}</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t.auth.password}</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <Label>{t.auth.role}</Label>
              <div className="grid gap-2">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border text-start transition-all",
                      role === r.value
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                      role === r.value ? "gradient-primary" : "bg-muted"
                    )}>
                      <r.icon className={cn("h-5 w-5", role === r.value ? "text-primary-foreground" : "text-muted-foreground")} />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-foreground">{r.label}</div>
                      <div className="text-xs text-muted-foreground">{r.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full gradient-primary border-0 text-primary-foreground" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t.auth.signUp}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {t.auth.hasAccount}{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">{t.auth.signIn}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
