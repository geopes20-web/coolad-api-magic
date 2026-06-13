import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  Loader2, Rocket, DollarSign, Compass, Lightbulb, TrendingUp,
  MessageSquare, Bookmark, ArrowRight, Plus, Sparkles, BarChart3,
  CheckCircle, AlertTriangle, XCircle, Lock, RotateCcw, Pencil, Trash2,
  Globe, EyeOff, Wallet, CheckCircle2, Clock,
} from "lucide-react";

interface IdeaRow {
  id: string; title: string; sector: string; ai_score: number;
  risk_score: number; created_at: string; status: string;
  decision: string; evaluation_version: number;
  [key: string]: unknown;
}

interface AccessRequestRow {
  id: string; idea_id: string; investor_id: string; founder_id: string; status: string; created_at: string;
  investor_profile?: { full_name: string } | null;
  idea_title?: string;
}

interface SavedRow {
  id: string; idea_id: string;
  ideas: { id: string; title: string; sector: string; ai_score: number } | null;
}

interface MessageRow {
  id: string; content: string; created_at: string; read: boolean;
  sender_id: string; receiver_id: string;
}

export default function Dashboard() {
  const { user, loading, userRole } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [myIdeas, setMyIdeas] = useState<IdeaRow[]>([]);
  const [savedIdeas, setSavedIdeas] = useState<SavedRow[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequestRow[]>([]);
  const [recentMessages, setRecentMessages] = useState<MessageRow[]>([]);
  const [founderDeals, setFounderDeals] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const promises: Promise<void>[] = [];

      // Always load ideas the user founded
      promises.push(
        supabase.from("ideas").select("id, title, sector, ai_score, risk_score, created_at, status, decision, evaluation_version")
          .eq("founder_id", user.id).order("created_at", { ascending: false })
          .then(({ data }) => { setMyIdeas((data as unknown as IdeaRow[]) || []); }) as unknown as Promise<void>
      );

      // Fetch founder's paid deals (to show payout status)
      if (userRole === "entrepreneur" || !userRole) {
        promises.push(
          supabase.from("deals")
            .select("id, idea_id, investment_amount_usd, payment_status, status, notes, created_at")
            .eq("founder_id", user.id)
            .eq("payment_status", "paid")
            .order("created_at", { ascending: false })
            .then(({ data }) => { setFounderDeals(data || []); }) as unknown as Promise<void>
        );
      }

      // Always load saved ideas
      promises.push(
        supabase.from("saved_ideas").select("id, idea_id, ideas(id, title, sector, ai_score)")
          .eq("user_id", user.id).order("created_at", { ascending: false })
          .then(({ data }) => { setSavedIdeas((data as unknown as SavedRow[]) || []); }) as unknown as Promise<void>
      );

      // Load access requests where user is founder OR investor
      promises.push(
        supabase.from("access_requests").select("id, idea_id, investor_id, founder_id, status, created_at, profiles!access_requests_investor_id_fkey(full_name), ideas!access_requests_idea_id_fkey(title)")
          .or(`founder_id.eq.${user.id},investor_id.eq.${user.id}`)
          .order("created_at", { ascending: false })
          .then(({ data }) => {
            const mapped = (data || []).map((r: any) => ({
              ...r,
              investor_profile: r.profiles || null,
              idea_title: r.ideas?.title || "",
            }));
            setAccessRequests(mapped as AccessRequestRow[]);
          }) as unknown as Promise<void>
      );

      promises.push(
        supabase.from("messages").select("id, content, created_at, read, sender_id, receiver_id")
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order("created_at", { ascending: false }).limit(10)
          .then(({ data }) => { setRecentMessages((data as unknown as MessageRow[]) || []); }) as unknown as Promise<void>
      );

      await Promise.all(promises);
      setDataLoading(false);
    };
    load();
  }, [user, userRole]);

  const handleAccessAction = async (requestId: string, action: "approved" | "rejected") => {
    await supabase.from("access_requests").update({ status: action } as any).eq("id", requestId);
    setAccessRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: action } : r));
    toast({ title: t.common.success, description: action === "approved" ? t.dashboard.approve : t.dashboard.reject });
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/login" replace />;

  const roleIcon = userRole === "entrepreneur" ? Rocket : userRole === "investor" ? DollarSign : Compass;
  const roleLabel = userRole === "entrepreneur" ? t.auth.entrepreneur : userRole === "investor" ? t.auth.investor : t.auth.explorer;
  const Icon = roleIcon;

  const getDecisionBadge = (decision?: string) => {
    if (decision === "accepted") return <Badge className="bg-primary/10 text-primary border-primary/20 text-xs"><CheckCircle className="h-3 w-3 me-1" />{t.dashboard.accepted}</Badge>;
    if (decision === "needs_improvement") return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 text-xs"><AlertTriangle className="h-3 w-3 me-1" />{t.dashboard.needsImprovement}</Badge>;
    if (decision === "rejected") return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-xs"><XCircle className="h-3 w-3 me-1" />{t.dashboard.rejected}</Badge>;
    return <Badge variant="outline" className="text-xs">{t.dashboard.pending}</Badge>;
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 shadow-glass mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center">
              <Icon className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t.nav.dashboard}</h1>
              <p className="text-muted-foreground text-sm">{roleLabel} • {user.email}</p>
            </div>
          </div>
          {userRole === "entrepreneur" && (
            <Link to="/submit">
              <Button className="gradient-primary border-0 text-primary-foreground">
                <Plus className="h-4 w-4 me-1" />{t.dashboard.newIdea}
              </Button>
            </Link>
          )}
          {(userRole === "investor" || userRole === "explorer") && (
            <Link to="/marketplace">
              <Button className="gradient-primary border-0 text-primary-foreground">
                <BarChart3 className="h-4 w-4 me-1" />{t.dashboard.browseIdeas}
              </Button>
            </Link>
          )}
        </div>
      </motion.div>

      {/* Founder Payout Summary — visible only when there are paid deals */}
      {userRole === "entrepreneur" && founderDeals.length > 0 && (() => {
        const allPayouts = founderDeals.flatMap(d => {
          let p: any[] = [];
          try { p = d.notes ? JSON.parse(d.notes) : []; } catch { p = []; }
          return Array.isArray(p) ? p : [];
        });
        const totalEntitlement = founderDeals.reduce((s, d) => s + d.investment_amount_usd * 0.9, 0);
        const totalReceived = allPayouts.reduce((s, p) => s + (p.amount || 0), 0);
        const remaining = Math.max(0, totalEntitlement - totalReceived);
        return (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-5 shadow-glass mb-6 border border-blue-500/20 bg-blue-500/5">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="h-5 w-5 text-blue-500" />
              <h2 className="font-bold text-foreground text-sm">
                {t?.dashboard?.myPayouts || "مستحقاتي من الصفقات"}
              </h2>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <p className="text-lg font-black text-foreground">${Number(totalEntitlement).toLocaleString()}</p>
                <p className="text-[11px] text-muted-foreground">إجمالي مستحقاتي (90%)</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-black text-emerald-600">${Number(totalReceived).toLocaleString()}</p>
                <p className="text-[11px] text-muted-foreground">وصلني حتى الآن</p>
              </div>
              <div className="text-center">
                <p className={`text-lg font-black ${remaining > 0 ? 'text-orange-500' : 'text-emerald-600'}`}>${Number(remaining).toLocaleString()}</p>
                <p className="text-[11px] text-muted-foreground">{remaining > 0 ? 'متبقي لم يصلني' : 'مكتمل ✅'}</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mb-3">
              <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                <span>التقدم</span>
                <span>{totalEntitlement > 0 ? Math.round((totalReceived / totalEntitlement) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${totalEntitlement > 0 ? Math.min(100, (totalReceived / totalEntitlement) * 100) : 0}%` }} />
              </div>
            </div>
            {/* Per-deal breakdown */}
            {founderDeals.map(d => {
              let payouts: any[] = [];
              try { payouts = d.notes ? JSON.parse(d.notes) : []; } catch { payouts = []; }
              const dealReceived = payouts.reduce((s: number, p: any) => s + (p.amount || 0), 0);
              const dealRemaining = Math.max(0, d.investment_amount_usd * 0.9 - dealReceived);
              return (
                <div key={d.id} className="border border-border/30 rounded-xl p-3 mb-2 bg-background/40">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-foreground">
                      صفقة ${Number(d.investment_amount_usd).toLocaleString()}
                    </span>
                    {dealRemaining === 0
                      ? <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> مكتمل</span>
                      : <span className="text-[10px] text-orange-500 font-bold flex items-center gap-1"><Clock className="h-3 w-3" /> متبقي ${Number(dealRemaining).toLocaleString()}</span>
                    }
                  </div>
                  {payouts.length === 0 ? (
                    <p className="text-[11px] text-amber-500">⏳ لم تصلك أي دفعة بعد — قيد المعالجة من الفريق</p>
                  ) : (
                    <div className="space-y-1">
                      {payouts.map((p: any, i: number) => (
                        <div key={p.id || i} className="flex justify-between text-[11px] text-muted-foreground">
                          <span className="text-emerald-600 font-bold">✓ ${Number(p.amount).toLocaleString()} <span className="text-muted-foreground font-normal">via {p.method}</span></span>
                          <span>{new Date(p.date).toLocaleDateString("ar-EG")}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {remaining > 0 && (
              <p className="text-[11px] text-muted-foreground text-center mt-1 italic">
                سيتم تحويل المبالغ المتبقية على دفعات. تواصل مع الفريق لأي استفسار.
              </p>
            )}
          </motion.div>
        );
      })()}

      {dataLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <Tabs defaultValue={userRole === "entrepreneur" || myIdeas.length > 0 ? "ideas" : "saved"} className="glass rounded-2xl shadow-glass overflow-hidden">
          <TabsList className="w-full justify-start bg-muted/50 rounded-none border-b border-border/50 px-4 flex-wrap">
            {(myIdeas.length > 0 || userRole === "entrepreneur") && (
              <TabsTrigger value="ideas"><Lightbulb className="h-4 w-4 me-1" />{t.dashboard.myIdeas}</TabsTrigger>
            )}
            <TabsTrigger value="saved"><Bookmark className="h-4 w-4 me-1" />{t.dashboard.savedIdeas}</TabsTrigger>
            <TabsTrigger value="access"><Lock className="h-4 w-4 me-1" />{t.dashboard.accessRequests}</TabsTrigger>
            <TabsTrigger value="messages"><MessageSquare className="h-4 w-4 me-1" />{t.dashboard.messages}</TabsTrigger>
          </TabsList>

          {(myIdeas.length > 0 || userRole === "entrepreneur") && (
            <TabsContent value="ideas" className="p-6">
              {myIdeas.length === 0 ? (
                <div className="text-center py-12">
                  <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">{t.dashboard.noIdeas}</p>
                  <Link to="/submit"><Button className="gradient-primary border-0 text-primary-foreground">{t.dashboard.newIdea}</Button></Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {myIdeas.map(idea => (
                    <motion.div key={idea.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/idea/${idea.id}`)}>
                      <div className="flex items-center gap-3 min-w-0">
                        <Sparkles className="h-5 w-5 text-primary shrink-0" />
                        <div className="min-w-0">
                          <span className="font-medium text-foreground block truncate">{idea.title}</span>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <Badge variant="secondary" className="text-xs">{idea.sector}</Badge>
                            {getDecisionBadge(idea.decision)}
                            {idea.evaluation_version > 1 && (
                              <Badge variant="outline" className="text-xs"><RotateCcw className="h-3 w-3 me-1" />v{idea.evaluation_version}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <div className="text-end">
                          <div className="flex items-center gap-1 text-sm">
                            <TrendingUp className="h-3.5 w-3.5 text-primary" />
                            <span className="font-semibold text-foreground">{idea.ai_score}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {idea.status === "published" ? (
                              <span className="text-primary flex items-center gap-0.5"><Globe className="h-3 w-3" /> Live</span>
                            ) : (
                              <span className="text-yellow-500 flex items-center gap-0.5"><EyeOff className="h-3 w-3" /> Draft</span>
                            )}
                          </div>
                        </div>
                        {/* Publish/Unpublish toggle */}
                        {idea.decision === "accepted" && idea.status !== "published" && (
                          <Button size="sm" variant="outline"
                            className="text-primary border-primary/30 text-xs h-7 px-2"
                            onClick={async () => {
                              const { error } = await supabase.from("ideas").update({ status: "published" }).eq("id", idea.id);
                              if (!error) {
                                setMyIdeas(prev => prev.map(i => i.id === idea.id ? { ...i, status: "published" } : i));
                                toast({ title: "Published!", description: "Your idea is now visible in the Marketplace." });
                              } else {
                                toast({ title: "Error", description: error.message, variant: "destructive" });
                              }
                            }}>
                            <Globe className="h-3 w-3 me-1" />Publish
                          </Button>
                        )}
                        {idea.status === "published" && (
                          <Button size="sm" variant="outline"
                            className="text-yellow-600 border-yellow-500/30 text-xs h-7 px-2"
                            onClick={async () => {
                              const { error } = await supabase.from("ideas").update({ status: "draft" }).eq("id", idea.id);
                              if (!error) setMyIdeas(prev => prev.map(i => i.id === idea.id ? { ...i, status: "draft" } : i));
                            }}>
                            <EyeOff className="h-3 w-3 me-1" />Unpublish
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="h-8 w-8" title="Edit"
                          onClick={() => navigate(`/submit?edit=${idea.id}`)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" title="Delete"
                          onClick={async () => {
                            if (!confirm("Delete this idea? This cannot be undone.")) return;
                            const { error } = await supabase.from("ideas").delete().eq("id", idea.id);
                            if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
                            else setMyIdeas(prev => prev.filter(i => i.id !== idea.id));
                          }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {/* Saved Ideas */}
          <TabsContent value="saved" className="p-6">
              {savedIdeas.length === 0 ? (
                <div className="text-center py-12">
                  <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">{t.dashboard.noSaved}</p>
                  <Link to="/marketplace"><Button className="gradient-primary border-0 text-primary-foreground">{t.dashboard.browseIdeas}</Button></Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedIdeas.map(s => s.ideas && (
                    <Link key={s.id} to={`/idea/${s.ideas.id}`}
                      className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <div>
                          <span className="font-medium text-foreground">{s.ideas.title}</span>
                          <Badge variant="secondary" className="text-xs ms-2">{s.ideas.sector}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <BarChart3 className="h-3.5 w-3.5 text-primary" />
                          <span className="font-semibold text-sm">{s.ideas.ai_score}</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>

          {/* Access Requests */}
          <TabsContent value="access" className="p-6">
            {accessRequests.length === 0 ? (
              <div className="text-center py-12">
                <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t.dashboard.noAccessRequests}</p>
              </div>
            ) : (
              <div className="space-y-3">
              {accessRequests.map(req => (
                  <div key={req.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                    <div className="flex items-center gap-3">
                      <Lock className="h-5 w-5 text-primary" />
                      <div>
                        <span className="text-sm font-medium text-foreground">
                          {user.id === req.founder_id
                            ? `${req.investor_profile?.full_name || "مستثمر"} — ${req.idea_title || "فكرة"}`
                            : `${req.idea_title || "Access request"}`}
                        </span>
                        <div className="text-xs text-muted-foreground mt-0.5">{new Date(req.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {req.status === "pending" && user.id === req.founder_id ? (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleAccessAction(req.id, "approved")} className="text-primary border-primary/30">{t.dashboard.approve}</Button>
                          <Button size="sm" variant="outline" onClick={() => handleAccessAction(req.id, "rejected")} className="text-destructive border-destructive/30">{t.dashboard.reject}</Button>
                        </>
                      ) : (
                        <>
                          <Badge variant={req.status === "approved" ? "default" : req.status === "rejected" ? "destructive" : "outline"}>
                            {req.status === "approved" ? t.dashboard.approve : req.status === "rejected" ? t.dashboard.reject : t.dashboard.pending}
                          </Badge>
                          {req.status === "approved" && (
                            <Button size="sm" variant="outline" className="text-primary border-primary/30"
                              onClick={() => {
                                const otherId = user.id === req.founder_id ? req.investor_id : req.founder_id;
                                const otherName = user.id === req.founder_id ? (req.investor_profile?.full_name || "مستثمر") : (req.idea_title || "مؤسس");
                                navigate(`/chat-founder/${otherId}?name=${encodeURIComponent(otherName)}&ideaId=${req.idea_id}`);
                              }}>
                              <MessageSquare className="h-3.5 w-3.5 me-1" />{t.dashboard.messages}
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Messages - grouped by conversation */}
          <TabsContent value="messages" className="p-6">
            {recentMessages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t.dashboard.noMessages}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(() => {
                  // Group messages by conversation partner
                  const convMap = new Map<string, MessageRow>();
                  for (const msg of recentMessages) {
                    const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
                    if (!convMap.has(partnerId)) convMap.set(partnerId, msg);
                  }
                  return Array.from(convMap.entries()).map(([partnerId, msg]) => (
                    <div key={partnerId}
                      className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/chat-founder/${partnerId}?name=${encodeURIComponent("محادثة")}`)}>
                      <MessageSquare className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground line-clamp-2">{msg.content}</p>
                        <span className="text-xs text-muted-foreground">{new Date(msg.created_at).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {!msg.read && msg.receiver_id === user.id && (
                          <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        )}
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
