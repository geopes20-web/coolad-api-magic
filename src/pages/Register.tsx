import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Sparkles, Loader2, Rocket, DollarSign, Compass, Phone, Eye, EyeOff, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import GoogleSignInButton from "@/components/GoogleSignInButton";

type Role = "entrepreneur" | "investor" | "explorer";

export default function Register() {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<Role>("explorer");
  const [loading, setLoading] = useState(false);
  
  // حالات التحكم في رؤية كلمة المرور
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // حالات فحص شروط كلمة المرور لحظة بلحظة
  const [checks, setChecks] = useState({
    hasUppercase: false,
    hasSymbol: false,
    hasNumber: false,
    hasMinLength: false,
  });

  const roles = [
    { value: "entrepreneur" as Role, label: t.auth.entrepreneur, desc: t.auth.entrepreneurDesc, icon: Rocket },
    { value: "investor" as Role, label: t.auth.investor, desc: t.auth.investorDesc, icon: DollarSign },
    { value: "explorer" as Role, label: t.auth.explorer, desc: t.auth.explorerDesc, icon: Compass },
  ];

  // تتبع وفحص كلمة المرور لحظياً أثناء الكتابة لعمل الـ Checklist التفاعلية
  useEffect(() => {
    setChecks({
      hasUppercase: /[A-Z]/.test(password),
      hasSymbol: /[^A-Za-z0-9]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasMinLength: password.length >= 8,
    });
  }, [password]);

  const validatePhone = (p: string) => /^[\d+\s()-]{8,20}$/.test(p.trim());

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // التحقق الشامل من تلبية كافة شروط كلمة المرور الأربعة قبل الإرسال
    if (!checks.hasUppercase || !checks.hasSymbol || !checks.hasNumber || !checks.hasMinLength) {
      toast({ 
        title: t.common.error, 
        description: isAr 
          ? "يجب تلبية جميع شروط كلمة المرور أولاً." 
          : "All password requirements must be met.", 
        variant: "destructive" 
      });
      return;
    }

    // التحقق من تطابق كلمة المرور مع حقل التأكيد
    if (password !== confirmPassword) {
      toast({ 
        title: t.common.error, 
        description: isAr ? "كلمات المرور غير متطابقة" : "Passwords do not match", 
        variant: "destructive" 
      });
      return;
    }

    if (!validatePhone(phone)) {
      toast({ title: t.common.error, description: isAr ? "رقم هاتف غير صالح" : "Invalid phone number", variant: "destructive" });
      return;
    }
    
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone_number: phone.trim() },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      toast({ title: t.common.error, description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Insert role if user was created
    if (data.user) {
      await supabase.from("user_roles").upsert(
        { user_id: data.user.id, role },
        { onConflict: "user_id" }
      );
    }

    setLoading(false);

    // If session exists → email confirmation is disabled (dev mode) → go straight to dashboard
    if (data.session) {
      toast({
        title: t.common.success,
        description: isAr ? "تم إنشاء الحساب بنجاح!" : "Account created successfully!",
      });
      navigate("/dashboard");
    } else {
      // Email confirmation required
      toast({
        title: isAr ? "تحقق من بريدك الإلكتروني" : "Check your email",
        description: isAr
          ? `تم إرسال رابط التأكيد إلى ${email}. بعد التأكيد يمكنك تسجيل الدخول.`
          : `A confirmation link was sent to ${email}. Click it, then log in.`,
      });
      navigate("/login");
    }
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
          <GoogleSignInButton label={isAr ? "التسجيل عبر Google" : "Sign up with Google"} />
          <div className="my-5 flex items-center gap-3">
            <div className="h-px bg-border flex-1" />
            <span className="text-xs text-muted-foreground">{isAr ? "أو" : "OR"}</span>
            <div className="h-px bg-border flex-1" />
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">{t.auth.fullName}</Label>
              <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">{t.auth.email}</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {isAr ? "رقم الهاتف *" : "Phone Number *"}
              </Label>
              <Input id="phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+201234567890" />
            </div>

            {/* حقل كلمة المرور الأساسي مع دالة الإظهار والإخفاء التفاعلية */}
            <div className="space-y-2 relative">
              <Label htmlFor="password">{t.auth.password}</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors h-5 w-5 flex items-center justify-center"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* لوحة تفاعلية لحظية (Checklist) تعرض متطلبات كلمة المرور الأربعة ونسبة تحققها باللون الأخضر أو الرمادي */}
            <div className="p-3 bg-muted/20 border border-border/40 rounded-xl space-y-1.5 font-sans text-xs">
              <div className={cn("flex items-center gap-1.5 transition-colors", checks.hasMinLength ? "text-emerald-500" : "text-muted-foreground")}>
                {checks.hasMinLength ? <Check className="h-3.5 w-3.5 shrink-0" /> : <X className="h-3.5 w-3.5 shrink-0" />}
                <span>{isAr ? "على الأقل 8 أحرف" : "At least 8 characters"}</span>
              </div>
              <div className={cn("flex items-center gap-1.5 transition-colors", checks.hasUppercase ? "text-emerald-500" : "text-muted-foreground")}>
                {checks.hasUppercase ? <Check className="h-3.5 w-3.5 shrink-0" /> : <X className="h-3.5 w-3.5 shrink-0" />}
                <span>{isAr ? "يحتوي على حرف كابيتل واحد على الأقل (A-Z)" : "At least one uppercase letter (A-Z)"}</span>
              </div>
              <div className={cn("flex items-center gap-1.5 transition-colors", checks.hasNumber ? "text-emerald-500" : "text-muted-foreground")}>
                {checks.hasNumber ? <Check className="h-3.5 w-3.5 shrink-0" /> : <X className="h-3.5 w-3.5 shrink-0" />}
                <span>{isAr ? "يحتوي على أرقام (0-9)" : "Contains numbers (0-9)"}</span>
              </div>
              <div className={cn("flex items-center gap-1.5 transition-colors", checks.hasSymbol ? "text-emerald-500" : "text-muted-foreground")}>
                {checks.hasSymbol ? <Check className="h-3.5 w-3.5 shrink-0" /> : <X className="h-3.5 w-3.5 shrink-0" />}
                <span>{isAr ? "يحتوي على رموز مخصصة (@,#,$,...)" : "Contains symbols (@,#,$,...)"}</span>
              </div>
            </div>

            {/* حقل تأكيد كلمة المرور (Confirm Password) */}
            <div className="space-y-2 relative">
              <Label htmlFor="confirmPassword">{isAr ? "تأكيد كلمة المرور" : "Confirm Password"}</Label>
              <div className="relative">
                <Input 
                  id="confirmPassword" 
                  type={showConfirmPassword ? "text" : "password"} 
                  required 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors h-5 w-5 flex items-center justify-center"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

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