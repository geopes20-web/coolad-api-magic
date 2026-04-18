/**
 * Admin Dashboard
 * Full admin panel for IDEVEST.
 * - Visible only to users with role = "admin".
 * - Three tabs: Users, KYC reviews, Ideas moderation.
 */
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  Loader2, Shield, Users as UsersIcon, FileCheck, Lightbulb, Eye, Check, X, AlertCircle,
} from "lucide-react";

type KycRow = {
  id: string; user_id: string; status: string;
  full_legal_name: string | null; national_id: string | null;
  date_of_birth: string | null; phone_number: string | null;
  id_card_front_url: string | null; id_card_back_url: string | null;
  ai_verification_result: any; created_at: string;
};
type ProfileRow = { id: string; full_name: string; phone_number: string | null; created_at: string };
type IdeaRow = { id: string; title: string; sector: string; status: string; ai_score: number | null; founder_id: string; created_at: string };

export default function Admin() {
  const { user, userRole, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const [kycList, setKycList] = useState<KycRow[]>([]);
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [ideas, setIdeas] = useState<IdeaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKyc, setSelectedKyc] = useState<KycRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const isAdmin = userRole === "admin";

  const loadAll = async () => {
    setLoading(true);
    const [k, p, i] = await Promise.all([
      supabase.from("kyc_verifications").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("ideas").select("id,title,sector,status,ai_score,founder_id,created_at").order("created_at", { ascending: false }),
    ]);
    setKycList((k.data as KycRow[]) || []);
    setUsers((p.data as ProfileRow[]) || []);
    setIdeas((i.data as IdeaRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) loadAll(); }, [isAdmin]);

  if (authLoading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const approveKyc = async (id: string) => {
    const { error } = await supabase
      .from("kyc_verifications")
      .update({ status: "approved", reviewed_by: user.id, reviewed_at: new Date().toISOString(), rejection_reason: null })
      .eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: isAr ? "تمت الموافقة" : "Approved" }); loadAll(); setSelectedKyc(null); }
  };

  const rejectKyc = async (id: string) => {
    if (!rejectReason.trim()) { toast({ title: "Error", description: isAr ? "أدخل سبب الرفض" : "Reason required", variant: "destructive" }); return; }
    const { error } = await supabase
      .from("kyc_verifications")
      .update({ status: "rejected", reviewed_by: user.id, reviewed_at: new Date().toISOString(), rejection_reason: rejectReason })
      .eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: isAr ? "تم الرفض" : "Rejected" }); setRejectReason(""); loadAll(); setSelectedKyc(null); }
  };

  const toggleIdeaStatus = async (id: string, current: string) => {
    const next = current === "approved" ? "rejected" : "approved";
    const { error } = await supabase.from("ideas").update({ status: next, decision: next }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: isAr ? "تم التحديث" : "Updated" }); loadAll(); }
  };

  const getSignedUrl = async (path: string | null) => {
    if (!path) return null;
    const { data } = await supabase.storage.from("kyc-documents").createSignedUrl(path, 300);
    return data?.signedUrl || null;
  };

  const KycModal = ({ kyc }: { kyc: KycRow }) => {
    const [frontUrl, setFrontUrl] = useState<string | null>(null);
    const [backUrl, setBackUrl] = useState<string | null>(null);

    useEffect(() => {
      (async () => {
        setFrontUrl(await getSignedUrl(kyc.id_card_front_url));
        setBackUrl(await getSignedUrl(kyc.id_card_back_url));
      })();
    }, [kyc.id]);

    const ai = kyc.ai_verification_result;

    return (
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur flex items-center justify-center p-4 overflow-y-auto">
        <div className="glass rounded-2xl shadow-glass max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-bold text-foreground">{isAr ? "مراجعة KYC" : "Review KYC"} — {kyc.full_legal_name || "—"}</h3>
            <Button variant="ghost" size="icon" onClick={() => setSelectedKyc(null)}><X className="h-4 w-4" /></Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
            <div><span className="text-muted-foreground">{isAr ? "الاسم:" : "Name:"}</span> {kyc.full_legal_name}</div>
            <div><span className="text-muted-foreground">{isAr ? "رقم الهوية:" : "National ID:"}</span> {kyc.national_id}</div>
            <div><span className="text-muted-foreground">{isAr ? "تاريخ الميلاد:" : "DOB:"}</span> {kyc.date_of_birth}</div>
            <div><span className="text-muted-foreground">{isAr ? "الهاتف:" : "Phone:"}</span> {kyc.phone_number}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">{isAr ? "وجه أمامي" : "Front"}</p>
              {frontUrl ? <img src={frontUrl} alt="ID front" className="rounded-xl border border-border/60 w-full" /> : <div className="h-32 rounded-xl bg-muted flex items-center justify-center text-muted-foreground text-xs">{isAr ? "لم يرفع" : "Not uploaded"}</div>}
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">{isAr ? "وجه خلفي" : "Back"}</p>
              {backUrl ? <img src={backUrl} alt="ID back" className="rounded-xl border border-border/60 w-full" /> : <div className="h-32 rounded-xl bg-muted flex items-center justify-center text-muted-foreground text-xs">{isAr ? "لم يرفع" : "Not uploaded"}</div>}
            </div>
          </div>

          {ai && (
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 mb-4 text-xs">
              <p className="font-semibold mb-2 flex items-center gap-2 text-foreground"><AlertCircle className="h-4 w-4" />{isAr ? "تحليل الذكاء الاصطناعي" : "AI Analysis"}</p>
              <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                <div>Confidence: <span className="text-foreground font-medium">{ai.confidence}%</span></div>
                <div>Quality: <span className="text-foreground">{ai.image_quality}</span></div>
                <div>Has face: <span className="text-foreground">{ai.has_face ? "✓" : "✗"}</span></div>
                <div>ID visible: <span className="text-foreground">{ai.national_id_visible ? "✓" : "✗"}</span></div>
                <div>Tampering: <span className={ai.tampering_detected ? "text-destructive" : "text-foreground"}>{ai.tampering_detected ? "⚠️ DETECTED" : "None"}</span></div>
                <div>Recommend: <span className="text-foreground font-semibold">{ai.recommendation}</span></div>
              </div>
              {ai.tampering_notes && <p className="mt-2 text-destructive">⚠ {ai.tampering_notes}</p>}
            </div>
          )}

          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={isAr ? "سبب الرفض (في حالة الرفض)..." : "Rejection reason (if rejecting)..."}
            className="mb-3"
            rows={2}
          />

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => rejectKyc(kyc.id)} className="text-destructive">
              <X className="h-4 w-4 me-1" />{isAr ? "رفض" : "Reject"}
            </Button>
            <Button onClick={() => approveKyc(kyc.id)} className="gradient-primary border-0 text-primary-foreground">
              <Check className="h-4 w-4 me-1" />{isAr ? "موافقة" : "Approve"}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, string> = {
      approved: "bg-primary/10 text-primary border-primary/20",
      pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      rejected: "bg-destructive/10 text-destructive border-destructive/20",
      not_started: "bg-muted text-muted-foreground",
    };
    return <Badge variant="outline" className={map[status] || ""}>{status}</Badge>;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{isAr ? "لوحة تحكم الأدمن" : "Admin Dashboard"}</h1>
          <p className="text-sm text-muted-foreground">{isAr ? "إدارة المنصة بالكامل" : "Full platform control"}</p>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <Tabs defaultValue="kyc" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="kyc"><FileCheck className="h-4 w-4 me-1" />KYC ({kycList.filter(k => k.status === "pending").length})</TabsTrigger>
            <TabsTrigger value="users"><UsersIcon className="h-4 w-4 me-1" />{isAr ? "المستخدمون" : "Users"} ({users.length})</TabsTrigger>
            <TabsTrigger value="ideas"><Lightbulb className="h-4 w-4 me-1" />{isAr ? "الأفكار" : "Ideas"} ({ideas.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="kyc" className="space-y-2">
            {kycList.length === 0 ? <p className="text-center text-muted-foreground py-10">{isAr ? "لا توجد طلبات" : "No requests"}</p> :
              kycList.map(k => (
                <div key={k.id} className="glass rounded-xl p-4 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{k.full_legal_name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{k.national_id} · {k.phone_number}</p>
                  </div>
                  <StatusBadge status={k.status} />
                  <Button size="sm" variant="outline" onClick={() => setSelectedKyc(k)}><Eye className="h-4 w-4 me-1" />{isAr ? "مراجعة" : "Review"}</Button>
                </div>
              ))
            }
          </TabsContent>

          <TabsContent value="users" className="space-y-2">
            {users.map(u => (
              <div key={u.id} className="glass rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{u.full_name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{u.phone_number || (isAr ? "بدون هاتف" : "No phone")} · {new Date(u.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="ideas" className="space-y-2">
            {ideas.map(i => (
              <div key={i.id} className="glass rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{i.title}</p>
                  <p className="text-xs text-muted-foreground">{i.sector} · Score: {i.ai_score ?? "—"}</p>
                </div>
                <StatusBadge status={i.status} />
                <Button size="sm" variant="outline" onClick={() => toggleIdeaStatus(i.id, i.status)}>
                  {i.status === "approved" ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                </Button>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      )}

      {selectedKyc && <KycModal kyc={selectedKyc} />}
    </div>
  );
}
