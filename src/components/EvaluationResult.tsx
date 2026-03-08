import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";

interface EvaluationResultProps {
  result: string;
  isLoading: boolean;
  onReset: () => void;
}

export default function EvaluationResult({ result, isLoading, onReset }: EvaluationResultProps) {
  return (
    <div className="space-y-6" dir="rtl">
      <Card className="shadow-elevated border-primary/20 overflow-hidden">
        <div className="h-1.5 gradient-hero" />
        <CardContent className="p-6 md:p-8">
          <div
            className="prose prose-sm md:prose-base max-w-none text-foreground leading-relaxed"
            style={{ direction: "rtl" }}
            dangerouslySetInnerHTML={{ __html: markdownToHtml(result) }}
          />
          {isLoading && (
            <div className="flex items-center gap-2 mt-4 text-primary">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">جاري التحليل...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {!isLoading && result && (
        <div className="flex justify-center">
          <Button
            onClick={onReset}
            variant="outline"
            size="lg"
            className="border-primary/30 text-primary hover:bg-primary/5 px-8"
          >
            <ArrowRight className="h-4 w-4 ml-2" />
            تقييم مشروع آخر
          </Button>
        </div>
      )}
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
    .replace(/^- (.+)$/gm, '<li class="mr-4 mb-1">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="mr-4 mb-1"><span class="text-primary font-bold">$1.</span> $2</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}
