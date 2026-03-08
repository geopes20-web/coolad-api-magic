import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { streamEvaluation, type ProjectData } from "@/lib/streamChat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  Building2, MapPin, DollarSign, TrendingUp, Users, Briefcase,
  Target, Clock, Shield, Sparkles, Loader2, ArrowRight, LogIn,
} from "lucide-react";
import { Link } from "react-router-dom";

function parseScoresFromEvaluation(text: string): { ai: number; risk: number; market: number; innovation: number } {
  const scores = { ai: 0, risk: 0, market: 0, innovation: 0 };
  // Try to extract scores from markdown text like "7/10" or "(8/10)"
  const overallMatch = text.match(/التقييم العام[^0-9]*(\d+)/i) || text.match(/overall[^0-9]*(\d+)/i);
  const marketMatch = text.match(/تقييم السوق[^0-9]*(\d+)/i) || text.match(/market[^0-9]*(\d+)/i);
  const riskMatch = text.match(/تقييم المخاطر[^0-9]*(\d+)/i) || text.match(/risk[^0-9]*(\d+)/i);
  const innovationMatch = text.match(/تقييم الابتكار[^0-9]*(\d+)/i) || text.match(/innovation[^0-9]*(\d+)/i);

  if (overallMatch) scores.ai = Math.min(parseInt(overallMatch[1]) * 10, 100);
  if (marketMatch) scores.market = Math.min(parseInt(marketMatch[1]) * 10, 100);
  if (riskMatch) scores.risk = Math.min(parseInt(riskMatch[1]) * 10, 100);
  if (innovationMatch) scores.innovation = Math.min(parseInt(innovationMatch[1]) * 10, 100);

  // Fallback: if no scores found, generate reasonable defaults
  if (scores.ai === 0) scores.ai = 70;
  if (scores.market === 0) scores.market = 65;
  if (scores.risk === 0) scores.risk = 50;
  if (scores.innovation === 0) scores.innovation = 60;

  return scores;
}

export default function SubmitIdea() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState("");
  const [showResult, setShowResult] = useState(false);

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
          <Link to="/login">
            <Button className="gradient-primary border-0 text-primary-foreground mt-4">
              {t.auth.signIn}
              <ArrowRight className="h-4 w-4 ms-2" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEvaluationResult("");
    setIsLoading(true);
    setShowResult(true);

    let fullResult = "";

    try {
      await streamEvaluation({
        projectData: form,
        onDelta: (chunk) => {
          fullResult += chunk;
          setEvaluationResult(prev => prev + chunk);
        },
        onDone: async () => {
          const scores = parseScoresFromEvaluation(fullResult);

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
            founder_id: user.id,
            ai_score: scores.ai,
            risk_score: scores.risk,
            market_score: scores.market,
            innovation_score: scores.innovation,
            status: "published",
            ai_evaluation: fullResult,
          });

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
        <div className="glass rounded-2xl overflow-hidden shadow-glass">
          <div className="h-1.5 gradient-primary" />
          <div className="p-6 md:p-8">
            <div
              className="prose prose-sm md:prose-base max-w-none text-foreground leading-relaxed"
              dangerouslySetInnerHTML={{ __html: markdownToHtml(evaluationResult) }}
            />
            {isLoading && (
              <div className="flex items-center gap-2 mt-4 text-primary">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">{t.submit.evaluating}</span>
              </div>
            )}
          </div>
        </div>
        {!isLoading && evaluationResult && (
          <div className="flex gap-3 justify-center mt-6">
            <Button onClick={() => navigate("/marketplace")} className="gradient-primary border-0 text-primary-foreground">
              {t.marketplace.title}
              <ArrowRight className="h-4 w-4 ms-2" />
            </Button>
            <Button variant="outline" onClick={() => { setShowResult(false); setEvaluationResult(""); }}>
              {t.submit.submitBtn}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{t.submit.title}</h1>
        <p className="text-muted-foreground">{t.submit.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((f) => (
            <div
              key={f.key}
              className={`glass rounded-xl p-5 shadow-glass ${f.textarea ? "md:col-span-2" : ""}`}
            >
              <Label className="flex items-center gap-2 mb-2 text-sm font-semibold text-foreground">
                <f.icon className="h-4 w-4 text-primary" />
                {f.label}
              </Label>
              {f.textarea ? (
                <Textarea value={form[f.key] || ""} onChange={e => set(f.key, e.target.value)}
                  placeholder={f.ph} className="min-h-[100px] bg-background/50 border-border/50" />
              ) : (
                <Input value={form[f.key] || ""} onChange={e => set(f.key, e.target.value)}
                  placeholder={f.ph} className="bg-background/50 border-border/50" />
              )}
            </div>
          ))}

          <div className="md:col-span-2 glass rounded-xl p-5 shadow-glass">
            <Label className="flex items-center gap-2 mb-2 text-sm font-semibold text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              {t.submit.additional}
            </Label>
            <Textarea value={form.additionalInfo || ""} onChange={e => set("additionalInfo", e.target.value)}
              placeholder={t.submit.additionalPh} className="min-h-[80px] bg-background/50 border-border/50" />
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <Button type="submit" disabled={!isValid || isLoading} size="lg"
            className="gradient-primary border-0 text-primary-foreground px-10 h-12 text-base font-semibold shadow-glow">
            {isLoading ? (
              <><Loader2 className="h-5 w-5 animate-spin me-2" />{t.submit.submitting}</>
            ) : (
              <><Sparkles className="h-5 w-5 me-2" />{t.submit.submitBtn}</>
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
    .replace(/^- (.+)$/gm, '<li class="ms-4 mb-1">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ms-4 mb-1"><span class="text-primary font-bold">$1.</span> $2</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}
