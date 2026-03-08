import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { projectData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `أنت خبير تقييم مشاريع استثمارية محترف. قم بتحليل المشروع المقدم وأعطِ تقييماً شاملاً يتضمن:

1. **ملخص المشروع**: وصف مختصر للمشروع
2. **تقييم الجدوى المالية** (من 10): تحليل الإيرادات المتوقعة، التكاليف، نقطة التعادل، العائد على الاستثمار ROI
3. **تقييم السوق** (من 10): حجم السوق المستهدف، المنافسة، الطلب، الفرص
4. **تقييم المخاطر** (من 10): المخاطر المحتملة وخطط التخفيف منها
5. **تقييم فريق العمل** (من 10): كفاءة الفريق وخبراته
6. **تقييم الابتكار** (من 10): مدى تميز الفكرة والقيمة المضافة
7. **التقييم العام** (من 10): المتوسط المرجح
8. **التوصيات**: نصائح عملية لتحسين المشروع
9. **نقاط القوة**: أبرز نقاط القوة في المشروع
10. **نقاط الضعف**: أبرز نقاط الضعف والتحديات

أجب باللغة العربية بشكل منظم ومفصل. استخدم الأرقام والنسب المئوية عند الحاجة.
أجب بصيغة Markdown منسقة.`;

    const userMessage = `قيّم المشروع الاستثماري التالي:

- اسم المشروع: ${projectData.name}
- وصف المشروع: ${projectData.description}
- القطاع/المجال: ${projectData.sector}
- الموقع/المنطقة: ${projectData.location}
- رأس المال المطلوب: ${projectData.capital}
- الإيرادات المتوقعة سنوياً: ${projectData.expectedRevenue}
- عدد أعضاء الفريق: ${projectData.teamSize}
- خبرة الفريق: ${projectData.teamExperience}
- المنافسون الرئيسيون: ${projectData.competitors}
- الميزة التنافسية: ${projectData.competitiveAdvantage}
- الجمهور المستهدف: ${projectData.targetAudience}
- مدة التنفيذ المتوقعة: ${projectData.timeline}
${projectData.additionalInfo ? `- معلومات إضافية: ${projectData.additionalInfo}` : ''}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز حد الطلبات، حاول مرة أخرى لاحقاً." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد لحساب Lovable AI." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "خطأ في خدمة الذكاء الاصطناعي" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("evaluate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "خطأ غير معروف" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
