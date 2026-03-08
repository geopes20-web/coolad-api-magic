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

    const systemPrompt = `You are IDEVEST AI, an expert startup evaluator and investment analyst. You MUST respond in the SAME LANGUAGE the user submits their idea in. If the idea is in Arabic, respond in Arabic. If in English, respond in English.

You must generate a comprehensive startup evaluation report with the following EXACT structure:

# 📊 IDEVEST AI Evaluation Report

## 1. Idea Overview
Brief summary of the startup idea and its value proposition.

## 2. Market Analysis
- Market size and growth potential
- Market trends and timing
- Geographic considerations

## 3. Target Audience
- Primary target segments
- Customer pain points addressed
- Market demand assessment

## 4. Competitor Landscape
- Direct and indirect competitors
- Market positioning
- Barriers to entry

## 5. Revenue Model
- Revenue streams
- Pricing strategy
- Unit economics

## 6. Scalability Potential
- Growth trajectory
- Expansion opportunities
- Technology scalability

## 7. Execution Difficulty
- Technical complexity
- Resource requirements
- Time-to-market

## 8. Investment Potential
- Funding attractiveness
- Expected ROI timeline
- Exit opportunities

## 9. Risk Analysis
- Key risks identified
- Mitigation strategies
- Market risks vs execution risks

## 10. Team Capability Evaluation
- Team strengths
- Skill gaps
- Leadership assessment

---

## 📈 AI SCORING (0-100)

IMPORTANT: You MUST output scores in this EXACT format on separate lines:

INNOVATION_SCORE: [number 0-100]
MARKET_SCORE: [number 0-100]
EXECUTION_SCORE: [number 0-100]
INVESTMENT_SCORE: [number 0-100]
RISK_SCORE: [number 0-100]
OVERALL_SCORE: [number 0-100]

The OVERALL_SCORE should be a weighted average:
- Innovation: 20%
- Market Potential: 25%
- Execution Feasibility: 20%
- Investment Attractiveness: 20%
- Risk (inverted - lower risk = higher score): 15%

## 🏷️ DECISION

Based on the overall score:
- Score ≥ 75: DECISION: ACCEPTED ✅
- Score 50-74: DECISION: NEEDS_IMPROVEMENT ⚠️
- Score < 50: DECISION: REJECTED ❌

Output the decision in this exact format:
DECISION: [ACCEPTED/NEEDS_IMPROVEMENT/REJECTED]

## 💡 IMPROVEMENT RECOMMENDATIONS

If the idea is not ACCEPTED, provide 3-5 specific, actionable recommendations. Each must follow this format:

### Recommendation [number]
**Problem:** [What is holding the score back]
**Suggested Improvement:** [Specific actionable change]
**Expected Score Improvement:** +[number] points

Be specific, data-driven, and actionable in all recommendations.`;

    const userMessage = `Evaluate this startup idea:

- Name: ${projectData.name}
- Description: ${projectData.description}
- Sector: ${projectData.sector}
- Location: ${projectData.location}
- Required Capital: ${projectData.capital}
- Expected Annual Revenue: ${projectData.expectedRevenue}
- Team Size: ${projectData.teamSize}
- Team Experience: ${projectData.teamExperience}
- Main Competitors: ${projectData.competitors}
- Competitive Advantage: ${projectData.competitiveAdvantage}
- Target Audience: ${projectData.targetAudience}
- Expected Timeline: ${projectData.timeline}
${projectData.additionalInfo ? `- Additional Info: ${projectData.additionalInfo}` : ''}
${projectData.documentContent ? `\n--- ATTACHED DOCUMENT CONTENT ---\n${projectData.documentContent}\n--- END DOCUMENT ---` : ''}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("evaluate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
