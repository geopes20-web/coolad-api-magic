import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  ArrowLeft, Bookmark, BookmarkCheck, DollarSign, TrendingUp,
  Users, Shield, Target, Clock, MapPin, Loader2, Sparkles, BarChart3,
  Lock, CheckCircle, AlertTriangle, XCircle, MessageCircle, FileText, FolderLock,
  CreditCard, X, ExternalLink
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface IdeaData {
  id: string; title: string; description: string; sector: string; location: string;
  capital_required: string; expected_revenue: string; team_size: string;
  team_experience: string; competitors: string; competitive_advantage: string;
  target_audience: string; timeline: string; additional_info: string;
  founder_id: string; ai_score: number; risk_score: number; market_score: number;
  innovation_score: number; ai_evaluation: string; created_at: string;
  execution_score: number; investment_score: number; decision: string;
  ai_recommendations: string; document_url?: string | null;
  profiles?: { full_name: string } | null;
  [key: string]: unknown;
}

interface DataRoomAccess {
  status: string;
  payment_reference?: string;
}

// ── Payment Modal ────────────────────────────────────────────────────────────
function PaymentModal({
  iframeUrl,
  onClose,
}: {
  iframeUrl: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative bg-background rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Secure Payment — Powered by Paymob</span>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-col items-center gap-3 p-4">
          <p className="text-xs text-muted-foreground">
            You'll be redirected to Paymob's secure payment page.
          </p>
          <a
            href={iframeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
          >
            <Button className="w-full gradient-primary border-0 text-primary-foreground h-11 font-semibold">
              <ExternalLink className="h-4 w-4 me-2" />
              Open Paymob Checkout
            </Button>
          </a>
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            After payment completes, return here and refresh to see your Data Room access.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function IdeaDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [idea, setIdea] = useState<IdeaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [accessStatus, setAccessStatus] = useState<string | null>(null);
  const [dataRoomAccess, setDataRoomAccess] = useState<DataRoomAccess | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [signedNda, setSignedNda] = useState(false);
  const [paymentModal, setPaymentModal] = useState<string | null>(null); // iframe URL

  // دالة ذكية لتنظيف الأرقام ومنع ظهور الـ NaN
  const cleanAndFormatNumber = (val: string | null | undefined, fallback = "0") => {
    if (!val) return fallback;
    const cleanStr = val.replace(/[^\d.]/g, "");
    const num = parseFloat(cleanStr);
    return isNaN(num) ? val : num.toLocaleString();
  };

  const loadData = async () => {
    if (!id) return;
    const { data } = await supabase.from("ideas").select("*, profiles(full_name)").eq("id", id).maybeSingle();
    setIdea(data as unknown as IdeaData);
    setLoading(false);

    if (user) {
      const [savedResult, accessResult, ndaResult, draResult] = await Promise.all([
        supabase.from("saved_ideas").select("id").eq("user_id", user.id).eq("idea_id", id).maybeSingle(),
        supabase.from("access_requests").select("status").eq("investor_id", user.id).eq("idea_id", id).maybeSingle() as any,
        supabase.from("nda_agreements").select("id").eq("investor_id", user.id).eq("idea_id", id).maybeSingle(),
        supabase.from("data_room_access").select("status, payment_reference").eq("user_id", user.id).eq("idea_id", id).maybeSingle(),
      ]);

      setSaved(!!savedResult.data);
      setAccessStatus((accessResult.data as any)?.status || null);
      setSignedNda(!!ndaResult.data);
      setDataRoomAccess(draResult.data as DataRoomAccess | null);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, user]);

  const toggleSave = async () => {
    if (!user || !id) return;
    if (saved) {
      await supabase.from("saved_ideas").delete().eq("user_id", user.id).eq("idea_id", id);
      setSaved(false);
    } else {
      await supabase.from("saved_ideas").insert({ user_id: user.id, idea_id: id });
      setSaved(true);
    }
  };

  const requestAccess = async () => {
    if (!user || !id || !idea) return;
    const { error } = await supabase.from("access_requests").insert({
      investor_id: user.id, idea_id: id, founder_id: idea.founder_id,
    } as any);
    if (!error) {
      setAccessStatus("pending");
      toast({ title: t.common.success, description: t.ideaDetail.accessRequested });
    }
  };

  // ── تفعيل الدفع عبر بايموب لفتح الداتا روم ($5) ──────────────────────────
  const handlePayDataRoom = async () => {
    if (!idea || !user) return;
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("paymob-initiate", {
        body: {
          idea_id: idea.id,
          amount_usd: 5.00,
          contract_terms: `Secure Data Room Access Fee for project: ${idea.title}`,
        },
      });
      setActionLoading(false);

      if (error || !data?.ok) {
        // Handle 409 duplicate
        if (data?.code === "ALREADY_PROCESSING") {
          toast({
            title: "Payment In Progress",
            description: data.hint || "You already have a pending payment for this idea.",
            variant: "destructive",
          });
          return;
        }
        toast({
          title: "Payment Error",
          description: data?.error || error?.message || "Gateway configuration missing",
          variant: "destructive",
        });
        return;
      }

      // ✅ Store deal_id for payment-result page
      sessionStorage.setItem("paymob_deal_id", data.deal_id);
      sessionStorage.setItem("paymob_idea_id", idea.id);

      const checkoutUrl = data?.iframe_url;
      if (checkoutUrl) {
        // Show modal instead of direct redirect
        setPaymentModal(checkoutUrl);
      } else {
        toast({ title: "Payment Error", description: "No checkout URL returned", variant: "destructive" });
      }
    } catch (err: any) {
      setActionLoading(false);
      toast({ title: "Connection Failed", description: err?.message || "Unknown error", variant: "destructive" });
    }
  };

  const handleSignNda = async () => {
    setActionLoading(true);
    const { error } = await supabase.from("nda_agreements").insert({
      investor_id: user!.id, idea_id: idea!.id, ip_address: "127.0.0.1", duration_months: 12,
    } as any);
    setActionLoading(false);
    if (!error) { setSignedNda(true); loadData(); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );

  if (!idea) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <p className="text-muted-foreground text-lg mb-4">{t.ideaDetail.notFound}</p>
      <Link to="/marketplace"><Button variant="outline"><ArrowLeft className="h-4 w-4 me-2" />{t.ideaDetail.backToMarketplace}</Button></Link>
    </div>
  );

  const isOwner      = user?.id === idea.founder_id;
  const hasFullAccess = isOwner || userRole === "admin" || accessStatus === "approved";
  const dataRoomApproved = isOwner || userRole === "admin" || dataRoomAccess?.status === "approved";
  const decision     = (idea as Record<string, unknown>).decision as string || "pending";
  const executionScore  = (idea as Record<string, unknown>).execution_score as number || 0;
  const investmentScore = (idea as Record<string, unknown>).investment_score as number || 0;

  const scores = [
    { label: t.ideaDetail.overallScore,     value: idea.ai_score,       icon: Sparkles  },
    { label: t.ideaDetail.marketPotential,  value: idea.market_score,   icon: BarChart3 },
    { label: t.ideaDetail.innovationLevel,  value: idea.innovation_score, icon: TrendingUp },
    { label: t.ideaDetail.executionScore,   value: executionScore,      icon: Target    },
    { label: t.ideaDetail.investmentScore,  value: investmentScore,     icon: DollarSign },
    { label: t.ideaDetail.riskLevel,        value: idea.risk_score,     icon: Shield    },
  ];

  const DecisionIcon  = decision === "accepted" ? CheckCircle : decision === "needs_improvement" ? AlertTriangle : XCircle;
  const decisionColor = decision === "accepted" ? "text-primary" : decision === "needs_improvement" ? "text-yellow-500" : "text-destructive";

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl text-left" dir="ltr">
      {/* Payment Modal */}
      {paymentModal && (
        <PaymentModal
          iframeUrl={paymentModal}
          onClose={() => { setPaymentModal(null); loadData(); }}
        />
      )}

      <Link to="/marketplace" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4 me-1" />{t.ideaDetail.backToMarketplace}
      </Link>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 md:p-8 shadow-glass mb-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{idea.title}</h1>
              <Badge variant="secondary">{idea.sector}</Badge>
              <div className={`flex items-center gap-1 ${decisionColor}`}>
                <DecisionIcon className="h-5 w-5" />
                <span className="text-sm font-semibold uppercase">{decision.replace("_", " ")}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
              <span>{t.ideaDetail.founder}: {idea.profiles?.full_name || "—"}</span>
              {idea.location && <><span>•</span><span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{idea.location}</span></>}
              <span>•</span><span>{t.ideaDetail.postedOn} {new Date(idea.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap">
            {user && isOwner && (
              <Badge className="bg-primary/10 text-primary border-primary/20">{t.ideaDetail.yourIdea || "Your Idea"}</Badge>
            )}
            {user && !isOwner && (
              <>
                <Button variant="outline" size="sm" onClick={toggleSave}>
                  {saved ? <BookmarkCheck className="h-4 w-4 me-1" /> : <Bookmark className="h-4 w-4 me-1" />}
                  {saved ? t.ideaDetail.savedBtn : t.ideaDetail.saveBtn}
                </Button>
                {!accessStatus && (
                  <Button size="sm" onClick={requestAccess} className="gradient-primary border-0 text-primary-foreground">
                    <Lock className="h-4 w-4 me-1" />{t.ideaDetail.requestAccess}
                  </Button>
                )}
                {accessStatus === "pending" && (
                  <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">{t.ideaDetail.accessRequested}</Badge>
                )}
                {accessStatus === "approved" && (
                  <>
                    <Badge className="bg-primary/10 text-primary border-primary/20">{t.ideaDetail.accessApproved}</Badge>
                    <Button size="sm"
                      onClick={() => navigate(`/chat-founder/${idea.founder_id}?name=${encodeURIComponent(idea.profiles?.full_name || "—")}&ideaId=${id}`)}
                      className="gradient-primary border-0 text-primary-foreground">
                      <MessageCircle className="h-4 w-4 me-1" />{t.ideaDetail.chatWithFounder}
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>

      {hasFullAccess && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {scores.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass rounded-xl p-4 shadow-glass text-center">
              <s.icon className={`h-5 w-5 mx-auto mb-2 ${s.value >= 70 ? "text-primary" : s.value >= 40 ? "text-yellow-500" : "text-destructive"}`} />
              <div className={`text-2xl font-bold mb-1 ${s.value >= 70 ? "text-primary" : s.value >= 40 ? "text-yellow-500" : "text-destructive"}`}>{s.value}</div>
              <Progress value={s.value} className="h-1.5 mb-1" />
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="glass rounded-2xl shadow-glass overflow-hidden">
        <TabsList className="w-full justify-start bg-muted/50 rounded-none border-b border-border/50 px-4 flex-wrap">
          <TabsTrigger value="overview">{t.ideaDetail.overview}</TabsTrigger>
          {hasFullAccess && <TabsTrigger value="evaluation">System Report</TabsTrigger>}
          {hasFullAccess && <TabsTrigger value="details">Financials</TabsTrigger>}
          {hasFullAccess && (idea as Record<string, unknown>).ai_recommendations && <TabsTrigger value="recommendations">System Recommendations</TabsTrigger>}
          <TabsTrigger value="dataroom">Secure Data Room Space</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="p-6">
          <p className="text-foreground leading-relaxed whitespace-pre-wrap">{idea.description}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-6 font-mono text-xs">
            <div className="border border-border/50 p-4 rounded-xl bg-background/50 shadow-inner">
              <span className="text-muted-foreground text-[10px] block font-sans font-bold uppercase tracking-wider mb-1">Required Capital</span>
              <strong className="text-sm font-black text-foreground">${cleanAndFormatNumber(idea.capital_required, "700,000")}</strong>
            </div>
            <div className="border border-border/50 p-4 rounded-xl bg-background/50 shadow-inner">
              <span className="text-muted-foreground text-[10px] block font-sans font-bold uppercase tracking-wider mb-1">Projected Yield</span>
              <strong className="text-sm font-black text-foreground">${cleanAndFormatNumber(idea.expected_revenue, "900,000")}</strong>
            </div>
          </div>

          {!hasFullAccess && !isOwner && (
            <div className="mt-6 glass rounded-xl p-6 text-center border-dashed border-2 border-border">
              <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm mb-3">Full details are restricted. Request access to see complete information.</p>
              {!accessStatus && <Button size="sm" onClick={requestAccess} className="gradient-primary border-0 text-primary-foreground"><Lock className="h-4 w-4 me-1" />{t.ideaDetail.requestAccess}</Button>}
            </div>
          )}
        </TabsContent>

        {hasFullAccess && <TabsContent value="evaluation" className="p-6">
          {idea.ai_evaluation ? (
            <div className="prose prose-sm max-w-none text-foreground" dangerouslySetInnerHTML={{ __html: markdownToHtml(idea.ai_evaluation) }} />
          ) : (
            <p className="text-muted-foreground">No System evaluation available.</p>
          )}
        </TabsContent>}

        {hasFullAccess && (
          <TabsContent value="details" className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: t.ideaDetail.capitalRequired,      value: idea.capital_required,      icon: DollarSign },
                { label: t.ideaDetail.expectedRevenue,      value: idea.expected_revenue,      icon: TrendingUp },
                { label: t.ideaDetail.targetAudience,       value: idea.target_audience,       icon: Target },
                { label: t.ideaDetail.timeline,             value: idea.timeline,              icon: Clock },
                { label: t.ideaDetail.teamSize,             value: idea.team_size,             icon: Users },
                { label: t.ideaDetail.teamExperience,       value: idea.team_experience,       icon: Users },
                { label: t.ideaDetail.competitors,          value: idea.competitors,           icon: Shield },
                { label: t.ideaDetail.competitiveAdvantage, value: idea.competitive_advantage, icon: Sparkles },
              ].filter(d => d.value).map((d, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
                  <d.icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs text-muted-foreground">{d.label}</div>
                    <div className="text-sm font-medium text-foreground">{d.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        )}

        {hasFullAccess && (idea as Record<string, unknown>).ai_recommendations && (
          <TabsContent value="recommendations" className="p-6">
            <div className="prose prose-sm max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: markdownToHtml((idea as Record<string, unknown>).ai_recommendations as string) }} />
          </TabsContent>
        )}

        {/* ── Data Room Tab ─────────────────────────────────────────── */}
        <TabsContent value="dataroom" className="p-6">
          {dataRoomApproved ? (
            /* ✅ APPROVED: show the actual data room content */
            <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-4 max-w-3xl mx-auto">
              <h3 className="font-bold text-emerald-800 dark:text-emerald-400 text-sm flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-600" /> Secure Data Room Environment Validated
              </h3>
              {!signedNda && !isOwner ? (
                /* NDA step */
                <div className="p-6 border-2 border-dashed border-blue-300/60 rounded-xl text-center space-y-4">
                  <AlertTriangle className="h-10 w-10 mx-auto text-blue-500" />
                  <h4 className="text-base font-bold">Non-Disclosure Agreement Required</h4>
                  <p className="text-sm text-muted-foreground">Your payment is confirmed. Sign the NDA to unlock the file vault.</p>
                  <Button onClick={handleSignNda} disabled={actionLoading}
                    className="bg-blue-600 text-white hover:bg-blue-700 font-semibold h-10 px-8 rounded-xl">
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}
                    Accept & Sign Electronic NDA
                  </Button>
                </div>
              ) : (
                /* Document access */
                idea.document_url ? (
                  <div className="p-4 bg-background border border-border/40 rounded-xl flex items-center justify-between gap-3 flex-wrap shadow-sm">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FileText className="h-5 w-5 text-primary shrink-0" />
                      <span className="text-sm font-mono text-slate-800 dark:text-slate-200 font-bold truncate block max-w-[280px]">
                        {idea.document_url.split('/').pop()}
                      </span>
                    </div>
                    <Button size="sm" variant="outline" className="text-black dark:text-white border-slate-300 h-9 bg-white dark:bg-slate-800"
                      onClick={() => {
                        const { data } = supabase.storage.from('idea-documents').getPublicUrl(idea.document_url!);
                        window.open(data.publicUrl, '_blank');
                      }}>
                      Preview Verified Documentation Blueprint
                    </Button>
                  </div>
                ) : (
                  <div className="text-xs text-zinc-500 italic">No document uploaded. Core specifications are in the main visuals sheet.</div>
                )
              )}
            </div>
          ) : dataRoomAccess?.status === "pending" ? (
            /* ⏳ PENDING: payment made, waiting for webhook */
            <div className="p-8 border-2 border-dashed border-yellow-300/60 rounded-xl text-center space-y-4 max-w-2xl mx-auto">
              <Loader2 className="h-12 w-12 mx-auto text-yellow-500 animate-spin" />
              <h3 className="text-lg font-bold tracking-tight">Payment Being Confirmed</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your payment is being processed. This usually takes a few seconds.
                Refresh the page to check status.
              </p>
              <Button onClick={() => loadData()} variant="outline" className="mt-2">
                Refresh Status
              </Button>
            </div>
          ) : (
            /* 🔒 LOCKED: no payment yet */
            <div className="p-8 border-2 border-dashed border-border/60 rounded-xl text-center space-y-4 max-w-2xl mx-auto">
              <FolderLock className="h-12 w-12 mx-auto text-amber-500" />
              <h3 className="text-lg font-bold tracking-tight">Secure Corporate Data Room Locked</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This vault contains deep structural engineering blueprints and financial dossiers.
                Access requires a one-time platform fee of <strong>$5.00</strong> via secure payment gateway.
              </p>
              {!user ? (
                <Link to="/login">
                  <Button className="gradient-primary text-white px-8 font-semibold h-10 shadow-sm">
                    Login to Unlock
                  </Button>
                </Link>
              ) : (
                <Button
                  onClick={handlePayDataRoom}
                  disabled={actionLoading}
                  className="gradient-primary text-white px-8 font-semibold h-10 shadow-sm"
                >
                  {actionLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin me-2" />Initializing Gateway…</>
                  ) : (
                    <><CreditCard className="h-4 w-4 me-2" />Unlock Secure Vault ($5.00)</>
                  )}
                </Button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold text-primary mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-primary mt-8 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-primary mt-8 mb-4">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-foreground">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li class="ms-4 mb-1">• $1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ms-4 mb-1"><span class="text-primary font-bold">$1.</span> $2</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}