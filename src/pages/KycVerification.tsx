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
import {
  Loader2, ShieldCheck, ShieldAlert, ShieldQuestion, ArrowLeft,
  CheckCircle2, Clock, XCircle, Upload, ImageIcon, Sparkles,
} from "lucide-react";

type KycStatus = "not_started" | "pending" | "approved" | "rejected";

interface KycRow {
  id: string; status: KycStatus;
  full_legal_name: string | null; national_id: string | null;
  date_of_birth: string | null; nationality: string | null;
  address: string | null; phone_number: string | null;
  rejection_reason: string | null;
  id_card_front_url: string | null; id_card_back_url: string | null;
  ai_verification_result: any;
}

export default function KycVerification() {
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiChecking, setAiChecking] = useState(false);
  const [kyc, setKyc] = useState<KycRow | null>(null);
  const [form, setForm] = useState({
    full_legal_name: "", national_id: "", date_of_birth: "",
    nationality: "", address: "", phone_number: "",
  });
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);

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

  const handleFileChange = (side: "front" | "back", file: File | null) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: isAr ? "حجم كبير" : "Too large", description: isAr ? "الحد الأقصى 5MB" : "Max 5MB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (side === "front") { setFrontFile(file); setFrontPreview(reader.result as string); }
      else { setBackFile(file); setBackPreview(reader.result as string); }
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (file: File, side: "front" | "back"): Promise<string | null> => {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/id-${side}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("kyc-documents").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return null;
    }
    return path;
  };

  const handleSubmit = async () => {
    if (!form.full_legal_name || !form.national_id || !form.date_of_birth || !form.phone_number) {
      toast({ title: isAr ? "خطأ" : "Error", description: isAr ? "يرجى ملء الحقول المطلوبة" : "Please fill required fields", variant: "destructive" });
      return;
    }
    if (!frontFile && !kyc?.id_card_front_url) {
      toast({ title: isAr ? "صورة مطلوبة" : "Required", description: isAr ? "ارفع صورة الوجه الأمامي للبطاقة" : "Upload ID front", variant: "destructive" });
      return;
    }
    if (!backFile && !kyc?.id_card_back_url) {
      toast({ title: isAr ? "صورة مطلوبة" : "Required", description: isAr ? "ارفع صورة الوجه الخلفي للبطاقة" : "Upload ID back", variant: "destructive" });
      return;
    }

    setSaving(true);
    let frontPath = kyc?.id_card_front_url;
    let backPath = kyc?.id_card_back_url;
    if (frontFile) frontPath = await uploadImage(frontFile, "front");
    if (backFile) backPath = await uploadImage(backFile, "back");

    if (!frontPath || !backPath) { setSaving(false); return; }

    const payload = {
      ...form, user_id: user.id, status: "pending" as KycStatus,
      id_card_front_url: frontPath, id_card_back_url: backPath,
    };

    const { error } = kyc
      ? await supabase.from("kyc_verifications").update(payload).eq("user_id", user.id)
      : await supabase.from("kyc_verifications").insert(payload);

    // Sync phone to profile
    await supabase.from("profiles").update({ phone_number: form.phone_number }).eq("id", user.id);

    if (error) {
      toast({ title: isAr ? "خطأ" : "Error", description: error.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    // Trigger AI verification (best-effort, async)
    setAiChecking(true);
    supabase.functions.invoke("verify-id-card", { body: { frontPath, backPath } })
      .then(({ data, error }) => {
        if (error) console.warn("AI verify failed:", error);
        else if (data?.result) {
          const r = data.result;
          if (r.tampering_detected) {
            toast({ title: "⚠️", description: isAr ? "تم اكتشاف علامات تزوير محتملة. سيتم المراجعة." : "Possible tampering detected — will be reviewed.", variant: "destructive" });
          } else {
            toast({ title: isAr ? "تم التحليل" : "AI Analyzed", description: `${isAr ? "الثقة:" : "Confidence:"} ${r.confidence}%` });
          }
        }
      })
      .finally(() => setAiChecking(false));

    setSaving(false);
    toast({ title: isAr ? "تم!" : "Success!", description: isAr ? "تم تقديم بياناتك للمراجعة" : "Submitted for review" });
    const { data: refreshed } = await supabase.from("kyc_verifications").select("*").eq("user_id", user.id).maybeSingle();
    setKyc(refreshed as KycRow);
    setFrontFile(null); setBackFile(null);
  };

  const status = kyc?.status || "not_started";
  const isLocked = status === "approved" || status === "pending";

  const StatusBadge = () => {
    if (status === "approved") return <Badge className="bg-primary/10 text-primary border-primary/20"><CheckCircle2 className="h-3 w-3 me-1" />{isAr ? "موافق عليه" : "Approved"}</Badge>;
    if (status === "pending") return <Badge variant="outline" className="text-muted-foreground"><Clock className="h-3 w-3 me-1" />{isAr ? "قيد المراجعة" : "Under Review"}</Badge>;
    if (status === "rejected") return <Badge variant="destructive"><XCircle className="h-3 w-3 me-1" />{isAr ? "مرفوض" : "Rejected"}</Badge>;
    return <Badge variant="outline"><ShieldQuestion className="h-3 w-3 me-1" />{isAr ? "لم يبدأ" : "Not Started"}</Badge>;
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const FileSlot = ({ side, preview, existing }: { side: "front" | "back"; preview: string | null; existing: string | null }) => (
    <label className="block cursor-pointer">
      <input type="file" accept="image/*" capture="environment" className="hidden"
        disabled={isLocked}
        onChange={(e) => handleFileChange(side, e.target.files?.[0] || null)} />
      <div className="rounded-xl border-2 border-dashed border-border/60 hover:border-primary/50 transition-colors p-4 text-center min-h-[140px] flex flex-col items-center justify-center gap-2">
        {preview ? (
          <img src={preview} alt={side} className="max-h-32 rounded-lg" />
        ) : existing ? (
          <>
            <ImageIcon className="h-8 w-8 text-primary" />
            <p className="text-xs text-muted-foreground">{isAr ? "تم الرفع — اضغط للاستبدال" : "Uploaded — tap to replace"}</p>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{isAr ? `ارفع الوجه ${side === "front" ? "الأمامي" : "الخلفي"} للبطاقة` : `Upload ${side} of ID`}</p>
          </>
        )}
      </div>
    </label>
  );

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

        {/* ID Card Upload */}
        <div className="mb-6">
          <Label className="mb-2 block">{isAr ? "صور البطاقة الشخصية *" : "ID Card Images *"}</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FileSlot side="front" preview={frontPreview} existing={kyc?.id_card_front_url || null} />
            <FileSlot side="back" preview={backPreview} existing={kyc?.id_card_back_url || null} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {isAr ? "📷 صور واضحة، إضاءة جيدة، بدون انعكاسات. الحد الأقصى 5MB." : "📷 Clear photos, good lighting, no glare. Max 5MB."}
          </p>
        </div>

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
            <Label htmlFor="phone">{isAr ? "رقم الهاتف *" : "Phone Number *"}</Label>
            <Input id="phone" type="tel" value={form.phone_number} onChange={e => setForm({...form, phone_number: e.target.value})} disabled={isLocked} placeholder="+201234567890" />
          </div>
          <div>
            <Label htmlFor="nat">{isAr ? "الجنسية" : "Nationality"}</Label>
            <Input id="nat" value={form.nationality} onChange={e => setForm({...form, nationality: e.target.value})} disabled={isLocked} placeholder={isAr ? "مصري" : "Egyptian"} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="addr">{isAr ? "العنوان" : "Address"}</Label>
            <Textarea id="addr" value={form.address} onChange={e => setForm({...form, address: e.target.value})} disabled={isLocked} rows={2} />
          </div>
        </div>

        {!isLocked && (
          <Button onClick={handleSubmit} disabled={saving || aiChecking} className="w-full mt-6 gradient-primary border-0 text-primary-foreground">
            {saving || aiChecking ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <ShieldCheck className="h-4 w-4 me-2" />}
            {saving ? (isAr ? "جاري الحفظ..." : "Saving...") :
             aiChecking ? (isAr ? "تحليل الذكاء الاصطناعي..." : "AI analyzing...") :
             (status === "rejected" ? (isAr ? "إعادة التقديم" : "Resubmit") : (isAr ? "تقديم للمراجعة" : "Submit for Review"))}
          </Button>
        )}

        <div className="mt-6 p-4 rounded-xl bg-muted/30 text-xs text-muted-foreground flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          {isAr ? "صورك مشفّرة ومحمية. يتم تحليلها تلقائياً بالذكاء الاصطناعي ثم تراجع من الأدمن. لن نشاركها مع أي طرف ثالث." : "Your images are encrypted and protected. They are analyzed by AI then reviewed by an admin. We will never share them with third parties."}
        </div>
      </div>
    </div>
  );
}
