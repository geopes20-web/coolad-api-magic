import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { streamEvaluation, type ProjectData } from "@/lib/streamChat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  Building2, MapPin, DollarSign, TrendingUp, Users, Briefcase,
  Target, Clock, Shield, Sparkles, Loader2, ArrowRight, LogIn,
  CheckCircle, AlertTriangle, XCircle, RotateCcw, Zap, FileUp, X,
} from "lucide-react";
import { Link } from "react-router-dom";

interface ParsedScores {
  innovation: number; market: number; execution: number;
  investment: number; risk: number; overall: number;
  decision: string; recommendations: string;
}

function parseScoresFromEvaluation(text: string): ParsedScores {
  const scores: ParsedScores = {
    innovation: 0, market: 0, execution: 0, investment: 0, risk: 0, overall: 0,
    decision: "pending", recommendations: "",
  };

  const innovationMatch = text.match(/INNOVATION_SCORE:\s*(\d+)/i);
  const marketMatch = text.match(/MARKET_SCORE:\s*(\d+)/i);
  const executionMatch = text.match(/EXECUTION_SCORE:\s*(\d+)/i);
  const investmentMatch = text.match(/INVESTMENT_SCORE:\s*(\d+)/i);
  const riskMatch = text.match(/RISK_SCORE:\s*(\d+)/i);
  const overallMatch = text.match(/OVERALL_SCORE:\s*(\d+)/i);
  const decisionMatch = text.match(/DECISION:\s*(ACCEPTED|NEEDS_IMPROVEMENT|REJECTED)/i);

  if (innovationMatch) scores.innovation = Math.min(parseInt(innovationMatch[1]), 100);
  if (marketMatch) scores.market = Math.min(parseInt(marketMatch[1]), 100);
  if (executionMatch) scores.execution = Math.min(parseInt(executionMatch[1]), 100);
  if (investmentMatch) scores.investment = Math.min(parseInt(investmentMatch[1]), 100);
  if (riskMatch) scores.risk = Math.min(parseInt(riskMatch[1]), 100);
  if (overallMatch) scores.overall = Math.min(parseInt(overallMatch[1]), 100);
  if (decisionMatch) scores.decision = decisionMatch[1].toLowerCase();

  // Extract recommendations section
  const recMatch = text.match(/IMPROVEMENT RECOMMENDATIONS[\s\S]*$/i);
  if (recMatch) scores.recommendations = recMatch[0];

  // Fallbacks
  if (scores.overall === 0 && scores.innovation > 0) {
    scores.overall = Math.round(scores.innovation * 0.2 + scores.market * 0.25 + scores.execution * 0.2 + scores.investment * 0.2 + (100 - scores.risk) * 0.15);
  }
  if (scores.decision === "pending" && scores.overall > 0) {
    scores.decision = scores.overall >= 75 ? "accepted" : scores.overall >= 50 ? "needs_improvement" : "rejected";
  }

  return scores;
}

function DecisionBadge({ decision }: { decision: string }) {
  if (decision === "accepted") return <Badge className="bg-primary/10 text-primary border-primary/20 text-sm px-3 py-1"><CheckCircle className="h-4 w-4 me-1" />ACCEPTED</Badge>;
  if (decision === "needs_improvement") return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 text-sm px-3 py-1"><AlertTriangle className="h-4 w-4 me-1" />NEEDS IMPROVEMENT</Badge>;
  return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-sm px-3 py-1"><XCircle className="h-4 w-4 me-1" />REJECTED</Badge>;
}

function ScoreCard({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Sparkles }) {
  const color = value >= 70 ? "text-primary" : value >= 40 ? "text-yellow-500" : "text-destructive";
  return (
    <div className="glass rounded-xl p-4 shadow-glass text-center">
      <Icon className={`h-5 w-5 mx-auto mb-2 ${color}`} />
      <div className={`text-2xl font-bold mb-1 ${color}`}>{value}</div>
      <Progress value={value} className="h-1.5 mb-1" />
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

export default function SubmitIdea() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [parsedScores, setParsedScores] = useState<ParsedScores | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ProjectData>({
    name: "", description: "", sector: "", location: "", capital: "",
    expectedRevenue: "", teamSize: "", teamExperience: "", competitors: "",
    competitiveAdvantage: "", targetAudience: "", timeline: "", additionalInfo: "",
  });

  const set = (key: keyof ProjectData, val: string) => setForm(p => ({ ...p, [key]: val }));

  const fields: { key: keyof ProjectData; label: string; ph: string; icon: typeof Building2; textarea?: boolean }[] = [
    { key: "name", label: t.submit.name, ph: t.submit.namePh, icon: Building2 },
    { key: "description", label: t.submit.description, ph: t.submit.descriptionPh, icon: Sparkles, textarea: true },
    { key: "sector", label: t.submit.sector, ph: t.submit.sectorPh, icon: Target },
    { key: "location", label: t.submit.location, ph: t.submit.locationPh, icon: MapPin },
    { key: "capital", label: t.submit.capital, ph: t.submit.capitalPh, icon: DollarSign },
    { key: "expectedRevenue", label: t.submit.revenue, ph: t.submit.revenuePh, icon: TrendingUp },
    { key: "teamSize", label: t.submit.teamSize, ph: t.submit.teamSizePh, icon: Users },
    { key: "teamExperience", label: t.submit.teamExp, ph: t.submit.teamExpPh, icon: Briefcase },
    { key: "competitors", label: t.submit.competitors, ph: t.submit.competitorsPh, icon: Shield },
    { key: "competitiveAdvantage", label: t.submit.advantage, ph: t.submit.advantagePh, icon: Sparkles },
    { key: "targetAudience", label: t.submit.audience, ph: t.submit.audiencePh, icon: Target },
    { key: "timeline", label: t.submit.timeline, ph: t.submit.timelinePh, icon: Clock },
  ];

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="glass rounded-2xl p-10 shadow-glass text-center max-w-md">
          <LogIn className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">{t.submit.loginRequired}</h2>
          <Link to="/login"><Button className="gradient-primary border-0 text-primary-foreground mt-4">{t.auth.signIn}<ArrowRight className="h-4 w-4 ms-2" /></Button></Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEvaluationResult("");
    setParsedScores(null);
    setIsLoading(true);
    setShowResult(true);

    // Upload document if present
    let documentUrl: string | null = null;
    let documentText = "";
    if (documentFile) {
      setUploadingDoc(true);
      const filePath = `${user.id}/${Date.now()}-${documentFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("idea-documents")
        .upload(filePath, documentFile);
      setUploadingDoc(false);
      if (uploadError) {
        toast({ title: t.common.error, description: uploadError.message, variant: "destructive" });
        setIsLoading(false);
        setShowResult(false);
        return;
      }
      documentUrl = filePath;
      // Read text from document for AI analysis
      try {
        const text = await documentFile.text();
        if (text && text.length > 0) {
          documentText = text.substring(0, 10000); // Limit to 10k chars
        }
      } catch {
        // Binary file, can't extract text client-side
      }
    }

    let fullResult = "";

    try {
      const projectDataWithDoc = { ...form, documentContent: documentText };
      await streamEvaluation({
        projectData: projectDataWithDoc,
        onDelta: (chunk) => {
          fullResult += chunk;
          setEvaluationResult(prev => prev + chunk);
        },
        onDone: async () => {
          const scores = parseScoresFromEvaluation(fullResult);
          setParsedScores(scores);

          const status = scores.decision === "accepted" ? "published" : "draft";

          const { error } = await supabase.from("ideas").insert({
            title: form.name,
            description: form.description,
            sector: form.sector,
            location: form.location,
            capital_required: form.capital,
            expected_revenue: form.expectedRevenue,
            team_size: form.teamSize,
            team_experience: form.teamExperience,
            competitors: form.competitors,
            competitive_advantage: form.competitiveAdvantage,
            target_audience: form.targetAudience,
            timeline: form.timeline,
            additional_info: form.additionalInfo || "",
            document_url: documentUrl,
            founder_id: user.id,
            ai_score: scores.overall,
            risk_score: scores.risk,
            market_score: scores.market,
            innovation_score: scores.innovation,
            execution_score: scores.execution,
            investment_score: scores.investment,
            decision: scores.decision,
            ai_recommendations: scores.recommendations,
            status,
            ai_evaluation: fullResult,
            evaluation_version: 1,
            score_history: JSON.stringify([{ version: 1, score: scores.overall, date: new Date().toISOString() }]),
          } as any);

          setIsLoading(false);
          if (error) {
            toast({ title: t.common.error, description: error.message, variant: "destructive" });
          } else {
            toast({ title: t.submit.successTitle, description: t.submit.successDesc });
          }
        },
        onError: (err) => {
          toast({ title: t.common.error, description: err, variant: "destructive" });
          setIsLoading(false);
        },
      });
    } catch {
      toast({ title: t.common.error, description: "Connection failed", variant: "destructive" });
      setIsLoading(false);
    }
  };

  const isValid = form.name && form.description && form.sector && form.capital;

  if (showResult) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        {/* Decision & Scores */}
        {parsedScores && !isLoading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="glass rounded-2xl p-6 shadow-glass mb-6 text-center">
              <DecisionBadge decision={parsedScores.decision} />
              <div className="text-4xl font-black text-foreground mt-4">{parsedScores.overall}<span className="text-lg text-muted-foreground">/100</span></div>
              <p className="text-sm text-muted-foreground mt-1">{t.ideaDetail.overallScore}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              <ScoreCard label={t.ideaDetail.innovationLevel} value={parsedScores.innovation} icon={Sparkles} />
              <ScoreCard label={t.ideaDetail.marketPotential} value={parsedScores.market} icon={TrendingUp} />
              <ScoreCard label={t.ideaDetail.executionScore} value={parsedScores.execution} icon={Target} />
              <ScoreCard label={t.ideaDetail.investmentScore} value={parsedScores.investment} icon={DollarSign} />
              <ScoreCard label={t.ideaDetail.riskLevel} value={parsedScores.risk} icon={Shield} />
            </div>
          </motion.div>
        )}

        {/* Streaming evaluation */}
        <div className="glass rounded-2xl overflow-hidden shadow-glass">
          <div className="h-1.5 gradient-primary" />
          <div className="p-6 md:p-8">
            <div className="prose prose-sm md:prose-base max-w-none text-foreground leading-relaxed"
              dangerouslySetInnerHTML={{ __html: markdownToHtml(evaluationResult) }} />
            {isLoading && (
              <div className="flex items-center gap-2 mt-4 text-primary">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">{t.submit.evaluating}</span>
              </div>
            )}
          </div>
        </div>

        {!isLoading && evaluationResult && (
          <div className="flex gap-3 justify-center mt-6 flex-wrap">
            {parsedScores?.decision === "accepted" ? (
              <Button onClick={() => navigate("/marketplace")} className="gradient-primary border-0 text-primary-foreground">
                {t.nav.marketplace}<ArrowRight className="h-4 w-4 ms-2" />
              </Button>
            ) : (
              <Button onClick={() => { setShowResult(false); setEvaluationResult(""); setParsedScores(null); }} className="gradient-primary border-0 text-primary-foreground">
                <RotateCcw className="h-4 w-4 me-2" />{t.submit.editAndResubmit}
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              {t.nav.dashboard}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground mb-4">
          <Zap className="h-4 w-4 text-primary" />
          IDEVEST AI
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{t.submit.title}</h1>
        <p className="text-muted-foreground">{t.submit.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((f) => (
            <motion.div key={f.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className={`glass rounded-xl p-5 shadow-glass ${f.textarea ? "md:col-span-2" : ""}`}>
              <Label className="flex items-center gap-2 mb-2 text-sm font-semibold text-foreground">
                <f.icon className="h-4 w-4 text-primary" />{f.label}
              </Label>
              {f.textarea ? (
                <Textarea value={form[f.key] || ""} onChange={e => set(f.key, e.target.value)}
                  placeholder={f.ph} className="min-h-[100px] bg-background/50 border-border/50" />
              ) : (
                <Input value={form[f.key] || ""} onChange={e => set(f.key, e.target.value)}
                  placeholder={f.ph} className="bg-background/50 border-border/50" />
              )}
            </motion.div>
          ))}

          <div className="md:col-span-2 glass rounded-xl p-5 shadow-glass">
            <Label className="flex items-center gap-2 mb-2 text-sm font-semibold text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />{t.submit.additional}
            </Label>
            <Textarea value={form.additionalInfo || ""} onChange={e => set("additionalInfo", e.target.value)}
              placeholder={t.submit.additionalPh} className="min-h-[80px] bg-background/50 border-border/50" />
          </div>

          {/* Document Upload */}
          <div className="md:col-span-2 glass rounded-xl p-5 shadow-glass">
            <Label className="flex items-center gap-2 mb-2 text-sm font-semibold text-foreground">
              <FileUp className="h-4 w-4 text-primary" />
              {t.submit.document}
            </Label>
            <p className="text-xs text-muted-foreground mb-3">{t.submit.documentDesc}</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.md"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.size > 20 * 1024 * 1024) {
                    toast({ title: t.common.error, description: "File too large (max 20MB)", variant: "destructive" });
                    return;
                  }
                  setDocumentFile(file);
                }
              }}
            />
            {documentFile ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <FileUp className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm text-foreground truncate flex-1">{documentFile.name}</span>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => { setDocumentFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button type="button" variant="outline" className="w-full border-dashed" onClick={() => fileInputRef.current?.click()}>
                <FileUp className="h-4 w-4 me-2" />{t.submit.uploadDoc}
              </Button>
            )}
          </div>
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <Button type="submit" disabled={!isValid || isLoading} size="lg"
            className="gradient-primary border-0 text-primary-foreground px-10 h-12 text-base font-semibold shadow-glow">
            {isLoading ? (
              <><Loader2 className="h-5 w-5 animate-spin me-2" />{t.submit.submitting}</>
            ) : (
              <><Zap className="h-5 w-5 me-2" />{t.submit.submitBtn}</>
            )}
          </Button>
        </div>
      </form>
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
