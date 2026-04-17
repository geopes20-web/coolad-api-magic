import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck, ShieldAlert, ShieldQuestion, ArrowLeft, CheckCircle2, Clock, XCircle } from "lucide-react";

type KycStatus = "not_started" | "pending" | "approved" | "rejected";

interface KycRow {
  id: string; status: KycStatus;
  full_legal_name: string | null; national_id: string | null;
  date_of_birth: string | null; nationality: string | null;
  address: string | null; phone_number: string | null;
  rejection_reason: string | null;
}

export default function KycVerification() {
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [kyc, setKyc] = useState<KycRow | null>(null);
  const [form, setForm] = useState({
    full_legal_name: "", national_id: "", date_of_birth: "",
    nationality: "", address: "", phone_number: "",
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("kyc_verifications").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        setKyc(data as KycRow);
        setForm({
          full_legal_name: data.full_legal_name || "",
          national_id: data.national_id || "",
          date_of_birth: data.date_of_birth || "",
          nationality: data.nationality || "",
          address: data.address || "",
          phone_number: data.phone_number || "",
        });
      }
      setLoading(false);
    })();
  }, [user]);

  if (authLoading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/login" replace />;

  const handleSubmit = async () => {
    if (!form.full_legal_name || !form.national_id || !form.date_of_birth) {
      toast({ title: isAr ? "خطأ" : "Error", description: isAr ? "يرجى ملء الحقول المطلوبة" : "Please fill required fields", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = { ...form, user_id: user.id, status: "pending" as KycStatus };
    const { error } = kyc
      ? await supabase.from("kyc_verifications").update(payload).eq("user_id", user.id)
      : await supabase.from("kyc_verifications").insert(payload);
    setSaving(false);
    if (error) {
      toast({ title: isAr ? "خطأ" : "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: isAr ? "تم!" : "Success!", description: isAr ? "تم تقديم بياناتك للمراجعة" : "Submitted for review" });
      const { data } = await supabase.from("kyc_verifications").select("*").eq("user_id", user.id).maybeSingle();
      setKyc(data as KycRow);
    }
  };

  const status = kyc?.status || "not_started";
  const isLocked = status === "approved" || status === "pending";

  const StatusBadge = () => {
    if (status === "approved") return <Badge className="bg-primary/10 text-primary border-primary/20"><CheckCircle2 className="h-3 w-3 me-1" />{isAr ? "موافق عليه" : "Approved"}</Badge>;
    if (status === "pending") return <Badge variant="outline" className="text-yellow-500 border-yellow-500/30"><Clock className="h-3 w-3 me-1" />{isAr ? "قيد المراجعة" : "Under Review"}</Badge>;
    if (status === "rejected") return <Badge variant="destructive"><XCircle className="h-3 w-3 me-1" />{isAr ? "مرفوض" : "Rejected"}</Badge>;
    return <Badge variant="outline"><ShieldQuestion className="h-3 w-3 me-1" />{isAr ? "لم يبدأ" : "Not Started"}</Badge>;
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <button onClick={() => navigate(-1)} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4 me-1" /> {isAr ? "رجوع" : "Back"}
      </button>

      <div className="glass rounded-2xl p-6 md:p-8 shadow-glass">
        <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">{isAr ? "التحقق من الهوية (KYC)" : "Identity Verification (KYC)"}</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {isAr ? "مطلوب لإتمام صفقات الاستثمار وضمان أمان المنصة" : "Required to complete investment deals and ensure platform safety"}
            </p>
          </div>
          <StatusBadge />
        </div>

        {status === "rejected" && kyc?.rejection_reason && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex gap-3">
            <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-destructive mb-1">{isAr ? "سبب الرفض:" : "Rejection reason:"}</p>
              <p className="text-sm text-foreground">{kyc.rejection_reason}</p>
            </div>
          </div>
        )}

        {status === "approved" && (
          <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20 flex gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">
              {isAr ? "تم التحقق من هويتك بنجاح. يمكنك الآن المشاركة في صفقات الاستثمار." : "Your identity has been verified. You can now participate in investment deals."}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">{isAr ? "الاسم القانوني الكامل *" : "Full Legal Name *"}</Label>
            <Input id="name" value={form.full_legal_name} onChange={e => setForm({...form, full_legal_name: e.target.value})} disabled={isLocked} />
          </div>
          <div>
            <Label htmlFor="nid">{isAr ? "رقم الهوية الوطنية *" : "National ID *"}</Label>
            <Input id="nid" value={form.national_id} onChange={e => setForm({...form, national_id: e.target.value})} disabled={isLocked} />
          </div>
          <div>
            <Label htmlFor="dob">{isAr ? "تاريخ الميلاد *" : "Date of Birth *"}</Label>
            <Input id="dob" type="date" value={form.date_of_birth} onChange={e => setForm({...form, date_of_birth: e.target.value})} disabled={isLocked} />
          </div>
          <div>
            <Label htmlFor="nat">{isAr ? "الجنسية" : "Nationality"}</Label>
            <Input id="nat" value={form.nationality} onChange={e => setForm({...form, nationality: e.target.value})} disabled={isLocked} placeholder={isAr ? "مصري" : "Egyptian"} />
          </div>
          <div>
            <Label htmlFor="phone">{isAr ? "رقم الهاتف" : "Phone Number"}</Label>
            <Input id="phone" value={form.phone_number} onChange={e => setForm({...form, phone_number: e.target.value})} disabled={isLocked} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="addr">{isAr ? "العنوان" : "Address"}</Label>
            <Textarea id="addr" value={form.address} onChange={e => setForm({...form, address: e.target.value})} disabled={isLocked} rows={2} />
          </div>
        </div>

        {!isLocked && (
          <Button onClick={handleSubmit} disabled={saving} className="w-full mt-6 gradient-primary border-0 text-primary-foreground">
            {saving ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <ShieldCheck className="h-4 w-4 me-2" />}
            {saving ? (isAr ? "جاري الحفظ..." : "Saving...") : (status === "rejected" ? (isAr ? "إعادة التقديم" : "Resubmit") : (isAr ? "تقديم للمراجعة" : "Submit for Review"))}
          </Button>
        )}

        <div className="mt-6 p-4 rounded-xl bg-muted/30 text-xs text-muted-foreground">
          🔒 {isAr ? "بياناتك مشفرة ومحمية. لن نشاركها مع أي طرف ثالث بدون موافقتك." : "Your data is encrypted and protected. We will never share it with third parties without consent."}
        </div>
      </div>
    </div>
  );
}
