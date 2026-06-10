/**
 * Admin Dashboard
 * Essential control center for IDEVEST: stats, KYC, users, ideas, reports, payments, and access requests.
 */
import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  Loader2, Shield, Users as UsersIcon, FileCheck, Lightbulb, Eye, Check, X,
  AlertCircle, CreditCard, Flag, DollarSign, Trash2, UserPlus, BookOpen
} from "lucide-react";

type KycRow = {
  id: string; user_id: string; status: string;
  full_legal_name: string | null; national_id: string | null;
  date_of_birth: string | null; phone_number: string | null;
  id_card_front_url: string | null; id_card_back_url: string | null;
  ai_verification_result: any; rejection_reason?: string | null; created_at: string;
};
type ProfileFull = { id: string; full_name: string; phone_number: string | null; created_at: string; is_blocked?: boolean; blocked_reason?: string | null };
type IdeaRow = { id: string; title: string; sector: string; status: string; ai_score: number | null; founder_id: string; created_at: string; listing_type?: string | null };
type DealRow = { id: string; idea_id: string; investment_amount_usd: number; platform_fee_amount: number | null; payment_status: string; escrow_status: string | null; status: string; created_at: string };
type PaymentEvent = { id: string; deal_id: string | null; provider: string; external_reference: string | null; amount_usd: number | null; currency: string | null; status: string; event_type: string; created_at: string; raw_payload: any };
type ReportRow = { id: string; target_type: string; target_id: string; reason: string; details: string | null; status: string; created_at: string };
type AccessRow = { id: string; idea_id: string; investor_id: string; founder_id: string; status: string; created_at: string; message?: string | null; ideas?: { title: string } | null };
type Stats = Record<string, number>;

export default function Admin() {
  const { user, userRole, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const [stats, setStats] = useState<Stats>({});
  const [kycList, setKycList] = useState<KycRow[]>([]);
  const [users, setUsers] = useState<ProfileFull[]>([]);
  const [ideas, setIdeas] = useState<IdeaRow[]>([]);
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRow[]>([]);
  const [paymentEvents, setPaymentEvents] = useState<PaymentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKyc, setSelectedKyc] = useState<KycRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [createAdminOpen, setCreateAdminOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  const isAdmin = userRole === "admin";

  const loadAll = async () => {
    setLoading(true);
    const [s, k, p, i, d, r, a, pe] = await Promise.all([
      supabase.rpc("get_admin_stats"),
      supabase.from("kyc_verifications").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id,full_name,phone_number,created_at,is_blocked,blocked_reason").order("created_at", { ascending: false }),
      supabase.from("ideas").select("id,title,sector,status,ai_score,founder_id,created_at,listing_type").order("created_at", { ascending: false }),
      supabase.from("deals").select("id,idea_id,investment_amount_usd,platform_fee_amount,payment_status,escrow_status,status,created_at").order("created_at", { ascending: false }),
      supabase.from("reports").select("id,target_type,target_id,reason,details,status,created_at").order("created_at", { ascending: false }),
      (supabase as any).from("access_requests").select("id,idea_id,investor_id,founder_id,status,message,created_at,ideas(title)").order("created_at", { ascending: false }),
      supabase.from("payment_events").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    setStats((s.data as Stats) || {});
    setKycList((k.data as KycRow[]) || []);
    setUsers((p.data as ProfileFull[]) || []);
    setIdeas((i.data as IdeaRow[]) || []);
    setDeals((d.data as DealRow[]) || []);
    setReports((r.data as ReportRow[]) || []);
    setAccessRequests((a.data as AccessRow[]) || []);
    setPaymentEvents((pe.data as PaymentEvent[]) || []);
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) loadAll(); }, [isAdmin]);

  if (authLoading) return <LoaderScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  // 1. تصحيح احتساب الخزينة: الفلترة هنا تضمن جمع العمليات الناجحة والمكتملة نقديًا فقط (حالتها paid و completed)
  const totalPlatformFeesCollected = deals
    .filter(d => d.payment_status === "paid" && d.status === "completed")
    .reduce((sum, d) => sum + (d.investment_amount_usd * 0.10), 0);

  const approveKyc = async (id: string) => {
    const { error } = await supabase.from("kyc_verifications").update({ status: "approved", reviewed_by: user.id, reviewed_at: new Date().toISOString(), rejection_reason: null }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: isAr ? "تمت الموافقة" : "Approved" }); loadAll(); setSelectedKyc(null); }
  };

  const rejectKyc = async (id: string) => {
    if (!rejectReason.trim()) { toast({ title: "Error", description: isAr ? "أدخل سبب الرفض" : "Reason required", variant: "destructive" }); return; }
    const { error } = await supabase.from("kyc_verifications").update({ status: "rejected", reviewed_by: user.id, reviewed_at: new Date().toISOString(), rejection_reason: rejectReason }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: isAr ? "تم الرفض" : "Rejected" }); setRejectReason(""); loadAll(); setSelectedKyc(null); }
  };

  const updateIdeaStatus = async (id: string, status: "published" | "rejected") => {
    const { error } = await supabase.from("ideas").update({ status, decision: status === "published" ? "accepted" : "rejected" }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: isAr ? "تم تحديث الفكرة" : "Idea updated" }); loadAll(); }
  };

  const updateAccess = async (id: string, status: "approved" | "rejected") => {
    const { error } = await (supabase as any).from("access_requests").update({ status }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: isAr ? "تم تحديث طلب الوصول" : "Access request updated" }); loadAll(); }
  };

  const updateReport = async (id: string, status: "reviewing" | "resolved" | "dismissed") => {
    const patch: any = { status };
    if (status === "resolved" || status === "dismissed") { patch.resolved_by = user.id; patch.resolved_at = new Date().toISOString(); }
    const { error } = await supabase.from("reports").update(patch).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: isAr ? "تم تحديث البلاغ" : "Report updated" }); loadAll(); }
  };

  const blockUser = async (uid: string) => {
    const reason = prompt(isAr ? "سبب الحظر:" : "Reason:") || "Violation";
    const { error } = await supabase.rpc("admin_block_user", { _target_user: uid, _reason: reason });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: isAr ? "تم الحظر" : "Blocked" }); loadAll(); }
  };
  const unblockUser = async (uid: string) => {
    const { error } = await supabase.rpc("admin_unblock_user", { _target_user: uid });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: isAr ? "أُلغي الحظر" : "Unblocked" }); loadAll(); }
  };

  const deleteUser = async (uid: string) => {
    if (!confirm(isAr ? "حذف هذا المستخدم نهائياً؟" : "Permanently delete this user?")) return;
    const { error } = await supabase.functions.invoke("admin-delete-user", { body: { user_id: uid } });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: isAr ? "تم الحذف" : "Deleted" }); loadAll(); }
  };

  const createAdmin = async () => {
    if (!newAdminEmail || !newAdminPassword) { toast({ title: "Error", description: "Email & password required", variant: "destructive" }); return; }
    setCreatingAdmin(true);
    const { data, error } = await supabase.functions.invoke("admin-create-user", {
      body: { email: newAdminEmail, password: newAdminPassword, full_name: newAdminName, role: "admin" },
    });
    setCreatingAdmin(false);
    if (error || (data as any)?.error) { toast({ title: "Error", description: (data as any)?.error || error?.message, variant: "destructive" }); return; }
    toast({ title: isAr ? "تم إنشاء الأدمن" : "Admin created" });
    setCreateAdminOpen(false); setNewAdminEmail(""); setNewAdminPassword(""); setNewAdminName("");
    loadAll();
  };

  const statCards = [
    [isAr ? "المستخدمون" : "Users", stats.total_users, UsersIcon],
    ["KYC Pending", stats.pending_kyc, FileCheck],
    [isAr ? "الأفكار" : "Ideas", stats.total_ideas, Lightbulb],
    [isAr ? "البلاغات" : "Reports", stats.open_reports, Flag],
    [isAr ? "مدفوعات معلقة" : "Pending Pay", stats.pending_payments, CreditCard],
    [isAr ? "صافي أرباح المنصة المعتمدة" : "Verified Revenue (10%)", `$${Number(totalPlatformFeesCollected).toLocaleString()}`, DollarSign],
  ] as const;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center"><Shield className="w-5 h-5 text-primary-foreground" /></div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{isAr ? "لوحة تحكم الأدمن" : "Admin Dashboard"}</h1>
            <p className="text-sm text-muted-foreground">{isAr ? "مراجعة KYC، أرباح المنصة، المدفوعات، والبلاغات" : "KYC, platform earnings, payments, and reports"}</p>
          </div>
        </div>
        <Button variant="outline" onClick={loadAll}>{isAr ? "تحديث" : "Refresh"}</Button>
      </div>

      {loading ? <LoaderScreen /> : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {statCards.map(([label, value, Icon]) => <div key={label} className="glass rounded-xl p-4 shadow-glass"><Icon className="h-4 w-4 text-primary mb-2" /><div className="text-xl font-bold text-foreground">{value ?? 0}</div><div className="text-xs text-muted-foreground">{label}</div></div>)}
          </div>

          <Tabs defaultValue="kyc" className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7 mb-6 h-auto">
              <TabsTrigger value="kyc">KYC ({kycList.filter(k => k.status === "pending").length})</TabsTrigger>
              <TabsTrigger value="access">Access ({accessRequests.length})</TabsTrigger>
              <TabsTrigger value="payments">{isAr ? "أرباح الصفقات" : "Deals Revenue"} ({deals.length})</TabsTrigger>
              <TabsTrigger value="transfers">Transfers ({paymentEvents.length})</TabsTrigger>
              <TabsTrigger value="reports">Reports ({reports.filter(r => r.status === "open").length})</TabsTrigger>
              <TabsTrigger value="ideas">Ideas ({ideas.length})</TabsTrigger>
              <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="kyc" className="space-y-2">{kycList.map(k => <Row key={k.id} title={k.full_legal_name || "—"} sub={`${k.national_id || "—"} · ${k.phone_number || "—"}`} status={k.status}><Button size="sm" variant="outline" onClick={() => setSelectedKyc(k)}><Eye className="h-4 w-4 me-1" />{isAr ? "مراجعة" : "Review"}</Button></Row>)}</TabsContent>

            <TabsContent value="access" className="space-y-2">{accessRequests.map(a => <Row key={a.id} title={a.ideas?.title || a.idea_id} sub={a.message || (isAr ? "طلب وصول لتفاصيل المشروع" : "Project access request")} status={a.status}><Button size="sm" variant="outline" onClick={() => updateAccess(a.id, "rejected")}><X className="h-4 w-4" /></Button><Button size="sm" onClick={() => updateAccess(a.id, "approved")} className="gradient-primary border-0 text-primary-foreground"><Check className="h-4 w-4" /></Button></Row>)}</TabsContent>

            <TabsContent value="payments" className="space-y-3">
              <div className="glass rounded-xl p-4 mb-4 border border-emerald-500/20 bg-emerald-500/5">
                <h3 className="text-sm font-bold text-foreground mb-1">{isAr ? "ملخص الخزينة الاستثمارية المعتمدة" : "Verified Treasury Summary"}</h3>
                <p className="text-2xl font-black text-emerald-600">${Number(totalPlatformFeesCollected).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{isAr ? "إجمالي الرسوم المستقطعة والمؤمنة نقديًا بحسابات المنصة" : "Total fees audited and securely stored inside system escrow"}</p>
              </div>
              
              {deals.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4 text-center">{isAr ? "لا توجد عمليات ماليّة بعد" : "No deals logged yet"}</p>
              ) : (
                deals.map(d => {
                  // 2. تصحيح احتساب النسبة لكل صفحة: ضرب النسبة الحية 10% مباشرة لتطهير مخلفات البيانات التجريبية القديمة
                  const currentFee = d.investment_amount_usd * 0.10;
                  const relatedIdea = ideas.find(i => i.id === d.idea_id);
                  return (
                    <div key={d.id} className="glass rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-border/40">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="font-bold text-base text-foreground flex items-center gap-2">
                          <span>${Number(d.investment_amount_usd).toLocaleString()}</span>
                          <Badge variant="secondary" className="text-[10px] uppercase font-mono">{d.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium truncate">
                          {isAr ? "المشروع: " : "Project: "} <span className="text-foreground">{relatedIdea?.title || d.idea_id}</span>
                        </p>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-3 font-mono">
                          <div>Escrow: <span className="text-amber-500 font-bold">{d.escrow_status || "none"}</span></div>
                          <div>Payment: <span className="font-bold text-slate-700">{d.payment_status || "unpaid"}</span></div>
                          <div>Date: {new Date(d.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 justify-between md:justify-end shrink-0 border-t md:border-t-0 pt-2 md:pt-0">
                        <div className="text-right">
                          <span className="text-xs text-muted-foreground block">{isAr ? "عمولة المنصة (10%)" : "Platform Fee (10%)"}</span>
                          <span className="font-black font-mono text-emerald-600 text-sm">${Number(currentFee).toLocaleString()}</span>
                        </div>
                        <div className="flex gap-1">
                          <Link to={`/contract/${d.id}`}>
                            <Button size="sm" variant="outline" className="h-8">
                              <FileCheck className="h-3.5 w-3.5 me-1" /> {isAr ? "العقد" : "Contract"}
                            </Button>
                          </Link>
                          <Link to={`/idea/${d.idea_id}`}>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="transfers" className="space-y-2">
              {paymentEvents.length === 0 ? <p className="text-sm text-muted-foreground p-4">{isAr ? "لا توجد تحويلات بعد" : "No transfers yet"}</p> : paymentEvents.map(pe => {
                const inv = pe.raw_payload?.obj?.payment_key_claims?.billing_data || pe.raw_payload?.billing_data || {};
                const card = pe.raw_payload?.obj?.source_data?.pan || pe.raw_payload?.source_data?.pan;
                return <div key={pe.id} className="glass rounded-xl p-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="font-medium text-foreground">{pe.provider.toUpperCase()} · ${pe.amount_usd?.toLocaleString() || 0} {pe.currency}</div>
                    <StatusBadge status={pe.status} />
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Ref: <span className="font-mono">{pe.external_reference || "—"}</span></div>
                    <div>Deal: {pe.deal_id ? <Link to={`/contract/${pe.deal_id}`} className="text-primary underline font-mono">{pe.deal_id.slice(0,8)}…</Link> : "—"}</div>
                    <div>From: {inv.first_name || ""} {inv.last_name || ""} {inv.email ? `· ${inv.email}` : ""}</div>
                    {card && <div>Card: ****{String(card).slice(-4)}</div>}
                    <div>{new Date(pe.created_at).toLocaleString()}</div>
                  </div>
                </div>;
              })}
            </TabsContent>

            <TabsContent value="reports" className="space-y-2">{reports.map(r => <Row key={r.id} title={`${r.target_type}: ${r.reason}`} sub={r.details || r.target_id} status={r.status}><Button size="sm" variant="outline" onClick={() => updateReport(r.id, "dismissed")}>{isAr ? "تجاهل" : "Dismiss"}</Button><Button size="sm" onClick={() => updateReport(r.id, "resolved")} className="gradient-primary border-0 text-primary-foreground">{isAr ? "حل" : "Resolve"}</Button></Row>)}</TabsContent>

            <TabsContent value="ideas" className="space-y-2">{ideas.map(i => <Row key={i.id} title={i.title} sub={`${i.sector} · ${i.listing_type || "—"} · Score ${i.ai_score ?? "—"}`} status={i.status}><Button size="sm" variant="outline" onClick={() => updateIdeaStatus(i.id, "rejected")}><X className="h-4 w-4" /></Button><Button size="sm" onClick={() => updateIdeaStatus(i.id, "published")} className="gradient-primary border-0 text-primary-foreground"><Check className="h-4 w-4" /></Button></Row>)}</TabsContent>

            <TabsContent value="users" className="space-y-2">
              <div className="flex justify-end mb-2"><Button size="sm" onClick={() => setCreateAdminOpen(true)} className="gradient-primary border-0 text-primary-foreground"><UserPlus className="h-4 w-4 me-1" />{isAr ? "إضافة أدمن" : "Add Admin"}</Button></div>
              {users.map(u => <Row key={u.id} title={u.full_name || "—"} sub={`${u.phone_number || (isAr ? "بدون هاتف" : "No phone")} · ${new Date(u.created_at).toLocaleDateString()}`} status={u.is_blocked ? "blocked" : "active"}>
                {u.is_blocked ? <Button size="sm" variant="outline" onClick={() => unblockUser(u.id)}>{isAr ? "إلغاء حظر" : "Unblock"}</Button> : <Button size="sm" variant="outline" className="text-destructive" onClick={() => blockUser(u.id)}>{isAr ? "حظر" : "Block"}</Button>}
                <Button size="sm" variant="outline" className="text-destructive" onClick={() => deleteUser(u.id)}><Trash2 className="h-4 w-4" /></Button>
              </Row>)}
            </TabsContent>
          </Tabs>
        </>
      )}

      {selectedKyc && <KycModal kyc={selectedKyc} isAr={isAr} rejectReason={rejectReason} setRejectReason={setRejectReason} onClose={() => setSelectedKyc(null)} onApprove={approveKyc} onReject={rejectKyc} />}

      <Dialog open={createAdminOpen} onOpenChange={setCreateAdminOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{isAr ? "إنشاء حساب أدمن جديد" : "Create New Admin"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-xs text-muted-foreground">Email *</label><Input type="email" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} /></div>
            <div><label className="text-xs text-muted-foreground">Password *</label><Input type="password" value={newAdminPassword} onChange={e => setNewAdminPassword(e.target.value)} /></div>
            <div><label className="text-xs text-muted-foreground">{isAr ? "الاسم" : "Full name"}</label><Input value={newAdminName} onChange={e => setNewAdminName(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateAdminOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={createAdmin} disabled={creatingAdmin} className="gradient-primary border-0 text-primary-foreground">{creatingAdmin ? <Loader2 className="h-4 w-4 animate-spin me-1" /> : <UserPlus className="h-4 w-4 me-1" />}{isAr ? "إنشاء" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LoaderScreen() { return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>; }

function Row({ title, sub, status, children }: { title: string; sub?: string; status: string; children?: React.ReactNode }) {
  return <div className="glass rounded-xl p-4 flex items-center justify-between gap-3"><div className="flex-1 min-w-0"><p className="font-medium text-foreground truncate">{title}</p>{sub && <p className="text-xs text-muted-foreground truncate">{sub}</p>}</div><StatusBadge status={status} /><div className="flex gap-2 shrink-0">{children}</div></div>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = { approved: "bg-primary/10 text-primary border-primary/20", published: "bg-primary/10 text-primary border-primary/20", paid: "bg-primary/10 text-primary border-primary/20", active: "bg-primary/10 text-primary border-primary/20", pending: "bg-amber-500/10 text-amber-500 border-amber-500/20", unpaid: "bg-amber-500/10 text-amber-500 border-amber-500/20", rejected: "bg-destructive/10 text-destructive border-destructive/20", failed: "bg-destructive/10 text-destructive border-destructive/20", blocked: "bg-destructive/10 text-destructive border-destructive/20" };
  return <Badge variant="outline" className={map[status] || "bg-muted text-muted-foreground"}>{status}</Badge>;
}

function KycModal({ kyc, isAr, rejectReason, setRejectReason, onClose, onApprove, onReject }: { kyc: KycRow; isAr: boolean; rejectReason: string; setRejectReason: (v: string) => void; onClose: () => void; onApprove: (id: string) => void; onReject: (id: string) => void }) {
  const [frontUrl, setFrontUrl] = useState<string | null>(null);
  const [backUrl, setBackUrl] = useState<string | null>(null);
  useEffect(() => { (async () => {
    if (kyc.id_card_front_url) setFrontUrl((await supabase.storage.from("kyc-documents").createSignedUrl(kyc.id_card_front_url, 300)).data?.signedUrl || null);
    if (kyc.id_card_back_url) setBackUrl((await supabase.storage.from("kyc-documents").createSignedUrl(kyc.id_card_back_url, 300)).data?.signedUrl || null);
  })(); }, [kyc.id, kyc.id_card_front_url, kyc.id_card_back_url]);
  const ai = kyc.ai_verification_result;
  return <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur flex items-center justify-center p-4 overflow-y-auto"><div className="glass rounded-2xl shadow-glass max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto"><div className="flex items-start justify-between mb-4"><h3 className="text-lg font-bold text-foreground">{isAr ? "مراجعة KYC" : "Review KYC"} — {kyc.full_legal_name || "—"}</h3><Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button></div><div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4"><div><span className="text-muted-foreground">Name:</span> {kyc.full_legal_name}</div><div><span className="text-muted-foreground">National ID:</span> {kyc.national_id}</div><div><span className="text-muted-foreground">DOB:</span> {kyc.date_of_birth}</div><div><span className="text-muted-foreground">Phone:</span> {kyc.phone_number}</div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">{frontUrl ? <img src={frontUrl} alt="ID front" className="rounded-xl border border-border/60 w-full" /> : <div className="h-32 rounded-xl bg-muted flex items-center justify-center text-muted-foreground text-xs">No front</div>}{backUrl ? <img src={backUrl} alt="ID back" className="rounded-xl border border-border/60 w-full" /> : <div className="h-32 rounded-xl bg-muted flex items-center justify-center text-muted-foreground text-xs">No back</div>}</div>{ai && <div className="rounded-xl border border-border/60 bg-muted/20 p-4 mb-4 text-xs"><p className="font-semibold mb-2 flex items-center gap-2 text-foreground"><AlertCircle className="h-4 w-4" />AI Analysis</p><pre className="whitespace-pre-wrap text-muted-foreground">{JSON.stringify(ai, null, 2)}</pre></div>}{kyc.rejection_reason && <p className="text-xs text-destructive mb-3">{kyc.rejection_reason}</p>}<Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder={isAr ? "سبب الرفض..." : "Rejection reason..."} className="mb-3" rows={2} /><div className="flex gap-2 justify-end"><Button variant="outline" onClick={() => onReject(kyc.id)} className="text-destructive"><X className="h-4 w-4 me-1" />{isAr ? "رفض" : "Reject"}</Button><Button onClick={() => onApprove(kyc.id)} className="gradient-primary border-0 text-primary-foreground"><Check className="h-4 w-4 me-1" />{isAr ? "موافقة" : "Approve"}</Button></div></div></div>;
}