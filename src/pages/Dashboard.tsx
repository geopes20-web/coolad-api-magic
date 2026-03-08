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
  CheckCircle, AlertTriangle, XCircle, Lock, RotateCcw,
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

      {dataLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <Tabs defaultValue={myIdeas.length > 0 ? "ideas" : "saved"} className="glass rounded-2xl shadow-glass overflow-hidden">
          <TabsList className="w-full justify-start bg-muted/50 rounded-none border-b border-border/50 px-4 flex-wrap">
            {myIdeas.length > 0 && (
              <TabsTrigger value="ideas"><Lightbulb className="h-4 w-4 me-1" />{t.dashboard.myIdeas}</TabsTrigger>
            )}
            <TabsTrigger value="saved"><Bookmark className="h-4 w-4 me-1" />{t.dashboard.savedIdeas}</TabsTrigger>
            <TabsTrigger value="access"><Lock className="h-4 w-4 me-1" />{t.dashboard.accessRequests}</TabsTrigger>
            <TabsTrigger value="messages"><MessageSquare className="h-4 w-4 me-1" />{t.dashboard.messages}</TabsTrigger>
          </TabsList>

          {myIdeas.length > 0 && (
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
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-end">
                          <div className="flex items-center gap-1 text-sm">
                            <TrendingUp className="h-3.5 w-3.5 text-primary" />
                            <span className="font-semibold text-foreground">{idea.ai_score}</span>
                          </div>
                        </div>
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

          {/* Messages */}
          <TabsContent value="messages" className="p-6">
            {recentMessages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t.dashboard.noMessages}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentMessages.map(msg => (
                  <div key={msg.id} className="flex items-start gap-3 p-4 rounded-xl bg-muted/30">
                    <MessageSquare className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground line-clamp-2">{msg.content}</p>
                      <span className="text-xs text-muted-foreground">{new Date(msg.created_at).toLocaleString()}</span>
                    </div>
                    {!msg.read && msg.receiver_id === user.id && (
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
