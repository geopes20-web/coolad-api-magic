import { useState } from "react";
import ProjectForm from "@/components/ProjectForm";
import EvaluationResult from "@/components/EvaluationResult";
import { streamEvaluation, type ProjectData } from "@/lib/streamChat";
import { toast } from "@/hooks/use-toast";
import { TrendingUp, Brain, Shield, BarChart3 } from "lucide-react";

const Index = () => {
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const handleSubmit = async (data: ProjectData) => {
    setResult("");
    setIsLoading(true);
    setShowResult(true);

    try {
      await streamEvaluation({
        projectData: data,
        onDelta: (chunk) => setResult((prev) => prev + chunk),
        onDone: () => setIsLoading(false),
        onError: (err) => {
          toast({ title: "خطأ", description: err, variant: "destructive" });
          setIsLoading(false);
        },
      });
    } catch {
      toast({ title: "خطأ", description: "فشل الاتصال بالخادم", variant: "destructive" });
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setShowResult(false);
    setResult("");
  };

  const features = [
    { icon: <Brain className="h-6 w-6" />, title: "تحليل ذكي", desc: "تقييم شامل باستخدام GPT-5" },
    { icon: <BarChart3 className="h-6 w-6" />, title: "جدوى مالية", desc: "تحليل العائد والتكاليف" },
    { icon: <Shield className="h-6 w-6" />, title: "تقييم المخاطر", desc: "تحديد وتخفيف المخاطر" },
    { icon: <TrendingUp className="h-6 w-6" />, title: "توصيات عملية", desc: "نصائح لتحسين المشروع" },
  ];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-10" />
        <div className="relative container mx-auto px-4 py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
            <Brain className="h-4 w-4" />
            مدعوم بالذكاء الاصطناعي
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-foreground mb-4 leading-tight">
            مُقيّم المشاريع
            <span className="block gradient-hero bg-clip-text text-transparent">الاستثمارية</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            أدخل تفاصيل مشروعك واحصل على تقييم شامل ومفصل من الذكاء الاصطناعي
          </p>
        </div>
      </header>

      {/* Features */}
      {!showResult && (
        <section className="container mx-auto px-4 -mt-6 mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <div
                key={i}
                className="bg-card rounded-xl p-5 shadow-card text-center border border-border/50"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-3">
                  {f.icon}
                </div>
                <h3 className="font-bold text-foreground text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-20">
        {showResult ? (
          <EvaluationResult result={result} isLoading={isLoading} onReset={handleReset} />
        ) : (
          <ProjectForm onSubmit={handleSubmit} isLoading={isLoading} />
        )}
      </main>
    </div>
  );
};

export default Index;
