import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ProjectData } from "@/lib/streamChat";
import {
  Building2,
  MapPin,
  DollarSign,
  TrendingUp,
  Users,
  Briefcase,
  Target,
  Clock,
  Shield,
  Sparkles,
  Loader2,
  LineChart,
  Handshake,
} from "lucide-react";

interface ProjectFormProps {
  onSubmit: (data: ProjectData & { listingType: string; financials: YearRow[] }) => void;
  isLoading: boolean;
}

export type YearRow = { year: number; revenue: string; costs: string };

const fields: {
  key: keyof ProjectData;
  label: string;
  placeholder: string;
  icon: React.ReactNode;
  type?: "textarea";
}[] = [
  { key: "name", label: "اسم المشروع", placeholder: "مثال: منصة توصيل طعام ذكية", icon: <Building2 className="h-4 w-4" /> },
  { key: "description", label: "وصف المشروع", placeholder: "اشرح فكرة المشروع بالتفصيل...", icon: <Sparkles className="h-4 w-4" />, type: "textarea" },
  { key: "sector", label: "القطاع / المجال", placeholder: "مثال: تكنولوجيا، عقارات، غذاء...", icon: <Target className="h-4 w-4" /> },
  { key: "location", label: "الموقع / المنطقة", placeholder: "مثال: القاهرة، مصر", icon: <MapPin className="h-4 w-4" /> },
  { key: "capital", label: "رأس المال المطلوب", placeholder: "مثال: 500,000 جنيه", icon: <DollarSign className="h-4 w-4" /> },
  { key: "expectedRevenue", label: "الإيرادات المتوقعة سنوياً", placeholder: "مثال: 1,200,000 جنيه", icon: <TrendingUp className="h-4 w-4" /> },
  { key: "teamSize", label: "عدد أعضاء الفريق", placeholder: "مثال: 5 أشخاص", icon: <Users className="h-4 w-4" /> },
  { key: "teamExperience", label: "خبرة الفريق", placeholder: "مثال: 10 سنوات في مجال التكنولوجيا", icon: <Briefcase className="h-4 w-4" /> },
  { key: "competitors", label: "المنافسون الرئيسيون", placeholder: "مثال: طلبات، مرسول...", icon: <Shield className="h-4 w-4" /> },
  { key: "competitiveAdvantage", label: "الميزة التنافسية", placeholder: "ما الذي يميز مشروعك عن المنافسين؟", icon: <Sparkles className="h-4 w-4" /> },
  { key: "targetAudience", label: "الجمهور المستهدف", placeholder: "مثال: شباب 18-35 سنة في المدن الكبرى", icon: <Target className="h-4 w-4" /> },
  { key: "timeline", label: "مدة التنفيذ المتوقعة", placeholder: "مثال: 6 أشهر", icon: <Clock className="h-4 w-4" /> },
];

export default function ProjectForm({ onSubmit, isLoading }: ProjectFormProps) {
  const [form, setForm] = useState<ProjectData>({
    name: "", description: "", sector: "", location: "", capital: "",
    expectedRevenue: "", teamSize: "", teamExperience: "", competitors: "",
    competitiveAdvantage: "", targetAudience: "", timeline: "", additionalInfo: "",
  });

  const handleChange = (key: keyof ProjectData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const isValid = form.name && form.description && form.sector && form.capital;

  return (
    <form onSubmit={handleSubmit} className="space-y-5" dir="rtl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {fields.map((f) => (
          <Card
            key={f.key}
            className={`shadow-card border-border/50 transition-all hover:shadow-elevated ${f.type === "textarea" ? "md:col-span-2" : ""}`}
          >
            <CardContent className="pt-5 pb-4 px-5">
              <Label className="flex items-center gap-2 mb-2 text-sm font-semibold text-foreground">
                <span className="text-primary">{f.icon}</span>
                {f.label}
              </Label>
              {f.type === "textarea" ? (
                <Textarea
                  value={form[f.key] || ""}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="min-h-[100px] bg-secondary/50 border-border/50 focus:border-primary"
                />
              ) : (
                <Input
                  value={form[f.key] || ""}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="bg-secondary/50 border-border/50 focus:border-primary"
                />
              )}
            </CardContent>
          </Card>
        ))}

        <Card className="md:col-span-2 shadow-card border-border/50">
          <CardContent className="pt-5 pb-4 px-5">
            <Label className="flex items-center gap-2 mb-2 text-sm font-semibold text-foreground">
              <span className="text-primary"><Sparkles className="h-4 w-4" /></span>
              معلومات إضافية (اختياري)
            </Label>
            <Textarea
              value={form.additionalInfo || ""}
              onChange={(e) => handleChange("additionalInfo", e.target.value)}
              placeholder="أي معلومات أخرى تود إضافتها..."
              className="min-h-[80px] bg-secondary/50 border-border/50 focus:border-primary"
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center pt-4">
        <Button
          type="submit"
          disabled={!isValid || isLoading}
          size="lg"
          className="gradient-hero text-primary-foreground px-12 py-6 text-lg font-bold rounded-xl shadow-elevated hover:opacity-90 transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin ml-2" />
              جاري التقييم...
            </>
          ) : (
            <>
              <TrendingUp className="h-5 w-5 ml-2" />
              قيّم المشروع بالذكاء الاصطناعي
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
