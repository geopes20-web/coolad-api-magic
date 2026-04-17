import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ProjectData {
  name: string; description: string; sector: string; location: string;
  capital: string; expectedRevenue: string; teamSize: string;
  teamExperience: string; competitors: string; competitiveAdvantage: string;
  targetAudience: string; timeline: string; additionalInfo?: string;
  documentContent?: string;
}

// RAG: fetch most relevant similar companies from dataset
async function fetchSimilarCompanies(supabase: any, projectData: ProjectData) {
  // Get companies from same sector first; fall back to all
  const { data: sectorMatches } = await supabase
    .from("companies_dataset")
    .select("company_name, sector, description, problem, solution, target_audience, team_size, founded_year, total_funding_usd, funding_round, risk_score, success_probability, market_share_pct, status")
    .ilike("sector", `%${projectData.sector || ""}%`)
    .limit(8);

  let companies = sectorMatches || [];

  // If too few, broaden the search
  if (companies.length < 5) {
    const { data: broader } = await supabase
      .from("companies_dataset")
      .select("company_name, sector, description, problem, solution, team_size, founded_year, total_funding_usd, funding_round, risk_score, success_probability, market_share_pct, status")
      .limit(10);
    companies = [...companies, ...(broader || [])].slice(0, 12);
  }

  return companies;
}

function formatCompaniesContext(companies: any[]): string {
  if (!companies || companies.length === 0) return "";
  const lines = companies.map((c, i) => {
    const fund = c.total_funding_usd ? `$${(c.total_funding_usd / 1000000).toFixed(2)}M (${c.funding_round || 'N/A'})` : 'N/A';
    return `${i + 1}. ${c.company_name} [${c.sector}] — ${c.description || c.solution || ''}
   Team: ${c.team_size || '?'} | Founded: ${c.founded_year || '?'} | Funding: ${fund}
   Risk: ${c.risk_score || '?'} | Success Prob: ${c.success_probability || '?'} | Market Share: ${c.market_share_pct || '?'}% | Status: ${c.status || '?'}`;
  }).join('\n\n');
  return lines;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { projectData } = await req.json() as { projectData: ProjectData };
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // RAG: Fetch reference companies from dataset
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const similarCompanies = await fetchSimilarCompanies(supabase, projectData);
    const referenceContext = formatCompaniesContext(similarCompanies);

    const systemPrompt = `You are IDEVEST AI, an expert startup evaluator. You have access to a CURATED DATABASE of REAL Egyptian/MENA startups with their actual outcomes (funding, success probability, risk scores, market share). Use these as benchmarks to ground your evaluation in reality — NOT speculation.

ALWAYS respond in the SAME LANGUAGE the user submits their idea in (Arabic or English).

You MUST follow this EXACT structure:

# 📊 IDEVEST AI Evaluation Report

## 1. Idea Overview
Brief summary and value proposition.

## 2. Market Analysis
Reference real comparable companies from the database when discussing market size, growth, and competition.

## 3. Target Audience
- Primary segments
- Pain points addressed

## 4. Competitor Landscape
**IMPORTANT:** Cite SPECIFIC companies from the reference dataset that operate in similar space. Compare their funding, team size, and outcomes to the proposed idea.

## 5. Revenue Model
- Streams, pricing, unit economics

## 6. Scalability Potential
Compare growth trajectory to similar companies in the dataset.

## 7. Execution Difficulty
- Technical complexity, resources, time-to-market

## 8. Investment Potential
Reference funding rounds of similar companies in the dataset (Pre-Seed, Seed, Series A averages).

## 9. Risk Analysis
Use the risk_score and success_probability of comparable companies from the dataset to anchor your risk assessment.

## 10. Team Capability Evaluation

---

## 📈 AI SCORING (0-100)

You MUST output scores in this EXACT format on separate lines:

INNOVATION_SCORE: [0-100]
MARKET_SCORE: [0-100]
EXECUTION_SCORE: [0-100]
INVESTMENT_SCORE: [0-100]
RISK_SCORE: [0-100]
OVERALL_SCORE: [0-100]

OVERALL = Innovation*0.20 + Market*0.25 + Execution*0.20 + Investment*0.20 + (100-Risk)*0.15

## 🏷️ DECISION

DECISION: [ACCEPTED if >=75 / NEEDS_IMPROVEMENT if 50-74 / REJECTED if <50]

## 💡 IMPROVEMENT RECOMMENDATIONS

If not ACCEPTED, provide 3-5 specific recommendations:

### Recommendation [N]
**Problem:** [What holds the score back, referencing dataset benchmarks]
**Suggested Improvement:** [Specific actionable change]
**Expected Score Improvement:** +[N] points`;

    const userMessage = `Evaluate this startup idea using the reference dataset for grounding.

═══ STARTUP IDEA ═══
- Name: ${projectData.name}
- Description: ${projectData.description}
- Sector: ${projectData.sector}
- Location: ${projectData.location}
- Required Capital: ${projectData.capital}
- Expected Annual Revenue: ${projectData.expectedRevenue}
- Team Size: ${projectData.teamSize}
- Team Experience: ${projectData.teamExperience}
- Competitors: ${projectData.competitors}
- Competitive Advantage: ${projectData.competitiveAdvantage}
- Target Audience: ${projectData.targetAudience}
- Timeline: ${projectData.timeline}
${projectData.additionalInfo ? `- Additional Info: ${projectData.additionalInfo}` : ''}
${projectData.documentContent ? `\n--- ATTACHED DOCUMENT ---\n${projectData.documentContent}\n--- END ---` : ''}

═══ REFERENCE DATASET (Real comparable startups — use as benchmark) ═══
${referenceContext || 'No reference data available'}

Use these real companies as anchor points. Compare team sizes, funding amounts, risk scores, and success probabilities. Be specific and cite company names when relevant.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
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
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited. Please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
