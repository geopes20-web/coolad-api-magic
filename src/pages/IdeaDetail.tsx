import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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
  Lock, CheckCircle, AlertTriangle, XCircle,
} from "lucide-react";

interface IdeaData {
  id: string; title: string; description: string; sector: string; location: string;
  capital_required: string; expected_revenue: string; team_size: string;
  team_experience: string; competitors: string; competitive_advantage: string;
  target_audience: string; timeline: string; additional_info: string;
  founder_id: string; ai_score: number; risk_score: number; market_score: number;
  innovation_score: number; ai_evaluation: string; created_at: string;
  execution_score: number; investment_score: number; decision: string;
  ai_recommendations: string;
  profiles?: { full_name: string } | null;
  [key: string]: unknown;
}

export default function IdeaDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [idea, setIdea] = useState<IdeaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [accessStatus, setAccessStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const { data } = await supabase.from("ideas").select("*, profiles(full_name)").eq("id", id).maybeSingle();
      setIdea(data as unknown as IdeaData);
      setLoading(false);

      if (user) {
        const { data: savedData } = await supabase.from("saved_ideas").select("id").eq("user_id", user.id).eq("idea_id", id).maybeSingle();
        setSaved(!!savedData);

        const { data: accessData } = await supabase.from("access_requests").select("status").eq("investor_id", user.id).eq("idea_id", id).maybeSingle();
        setAccessStatus(accessData?.status || null);
      }
    };
    load();
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
    } as Record<string, unknown>);
    if (!error) {
      setAccessStatus("pending");
      toast({ title: t.common.success, description: t.ideaDetail.accessRequested });
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  if (!idea) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <p className="text-muted-foreground text-lg mb-4">{t.ideaDetail.notFound}</p>
      <Link to="/marketplace"><Button variant="outline"><ArrowLeft className="h-4 w-4 me-2" />{t.ideaDetail.backToMarketplace}</Button></Link>
    </div>
  );

  const isOwner = user?.id === idea.founder_id;
  const hasFullAccess = isOwner || accessStatus === "approved";
  const decision = (idea as Record<string, unknown>).decision as string || "pending";
  const executionScore = (idea as Record<string, unknown>).execution_score as number || 0;
  const investmentScore = (idea as Record<string, unknown>).investment_score as number || 0;

  const scores = [
    { label: t.ideaDetail.overallScore, value: idea.ai_score, icon: Sparkles },
    { label: t.ideaDetail.marketPotential, value: idea.market_score, icon: BarChart3 },
    { label: t.ideaDetail.innovationLevel, value: idea.innovation_score, icon: TrendingUp },
    { label: t.ideaDetail.executionScore, value: executionScore, icon: Target },
    { label: t.ideaDetail.investmentScore, value: investmentScore, icon: DollarSign },
    { label: t.ideaDetail.riskLevel, value: idea.risk_score, icon: Shield },
  ];

  const DecisionIcon = decision === "accepted" ? CheckCircle : decision === "needs_improvement" ? AlertTriangle : XCircle;
  const decisionColor = decision === "accepted" ? "text-primary" : decision === "needs_improvement" ? "text-yellow-500" : "text-destructive";

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
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
            {user && !isOwner && (
              <>
                <Button variant="outline" size="sm" onClick={toggleSave}>
                  {saved ? <BookmarkCheck className="h-4 w-4 me-1" /> : <Bookmark className="h-4 w-4 me-1" />}
                  {saved ? t.ideaDetail.savedBtn : t.ideaDetail.saveBtn}
                </Button>
                {!accessStatus && (
                  <Button variant="outline" size="sm" onClick={requestAccess}>
                    <Lock className="h-4 w-4 me-1" />{t.ideaDetail.requestAccess}
                  </Button>
                )}
                {accessStatus === "pending" && (
                  <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">{t.ideaDetail.accessRequested}</Badge>
                )}
                {accessStatus === "approved" && (
                  <Badge className="bg-primary/10 text-primary border-primary/20">{t.ideaDetail.accessApproved}</Badge>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Scores */}
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

      {/* Tabs */}
      <Tabs defaultValue="overview" className="glass rounded-2xl shadow-glass overflow-hidden">
        <TabsList className="w-full justify-start bg-muted/50 rounded-none border-b border-border/50 px-4 flex-wrap">
          <TabsTrigger value="overview">{t.ideaDetail.overview}</TabsTrigger>
          <TabsTrigger value="evaluation">{t.ideaDetail.aiEvaluation}</TabsTrigger>
          {hasFullAccess && <TabsTrigger value="details">{t.ideaDetail.financialPotential}</TabsTrigger>}
          {(idea as Record<string, unknown>).ai_recommendations && <TabsTrigger value="recommendations">{t.ideaDetail.recommendations}</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="p-6">
          <p className="text-foreground leading-relaxed whitespace-pre-wrap">{idea.description}</p>
          {!hasFullAccess && !isOwner && (
            <div className="mt-6 glass rounded-xl p-6 text-center border-dashed border-2 border-border">
              <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm mb-3">Full details are restricted. Request access to see complete information.</p>
              {!accessStatus && <Button size="sm" onClick={requestAccess} className="gradient-primary border-0 text-primary-foreground"><Lock className="h-4 w-4 me-1" />{t.ideaDetail.requestAccess}</Button>}
            </div>
          )}
        </TabsContent>

        <TabsContent value="evaluation" className="p-6">
          {idea.ai_evaluation ? (
            <div className="prose prose-sm max-w-none text-foreground" dangerouslySetInnerHTML={{ __html: markdownToHtml(idea.ai_evaluation) }} />
          ) : (
            <p className="text-muted-foreground">No AI evaluation available.</p>
          )}
        </TabsContent>

        {hasFullAccess && (
          <TabsContent value="details" className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: t.ideaDetail.capitalRequired, value: idea.capital_required, icon: DollarSign },
                { label: t.ideaDetail.expectedRevenue, value: idea.expected_revenue, icon: TrendingUp },
                { label: t.ideaDetail.targetAudience, value: idea.target_audience, icon: Target },
                { label: t.ideaDetail.timeline, value: idea.timeline, icon: Clock },
                { label: t.ideaDetail.teamSize, value: idea.team_size, icon: Users },
                { label: t.ideaDetail.teamExperience, value: idea.team_experience, icon: Users },
                { label: t.ideaDetail.competitors, value: idea.competitors, icon: Shield },
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

        {(idea as Record<string, unknown>).ai_recommendations && (
          <TabsContent value="recommendations" className="p-6">
            <div className="prose prose-sm max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: markdownToHtml((idea as Record<string, unknown>).ai_recommendations as string) }} />
          </TabsContent>
        )}
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
