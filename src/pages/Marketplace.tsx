import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import IdeaCard from "@/components/IdeaCard";
import { Search, Loader2, Lightbulb } from "lucide-react";

interface IdeaRow {
  id: string;
  title: string;
  description: string;
  sector: string;
  location: string;
  capital_required: string;
  ai_score: number;
  risk_score: number;
  market_score: number;
  founder_id: string;
  created_at: string;
  profiles?: { full_name: string } | null;
}

export default function Marketplace() {
  const { t } = useLanguage();
  const [ideas, setIdeas] = useState<IdeaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    const fetchIdeas = async () => {
      const { data } = await supabase
        .from("ideas")
        .select("id, title, description, sector, location, capital_required, ai_score, risk_score, market_score, founder_id, created_at, profiles(full_name)")
        .eq("status", "published")
        .order("created_at", { ascending: false });

      setIdeas((data as unknown as IdeaRow[]) || []);
      setLoading(false);
    };
    fetchIdeas();
  }, []);

  const sectors = useMemo(() => {
    const s = new Set(ideas.map(i => i.sector).filter(Boolean));
    return Array.from(s);
  }, [ideas]);

  const filtered = useMemo(() => {
    let result = ideas;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.sector.toLowerCase().includes(q)
      );
    }

    if (sectorFilter !== "all") {
      result = result.filter(i => i.sector === sectorFilter);
    }

    if (sortBy === "highestScore") {
      result = [...result].sort((a, b) => b.ai_score - a.ai_score);
    } else if (sortBy === "lowestRisk") {
      result = [...result].sort((a, b) => a.risk_score - b.risk_score);
    }

    return result;
  }, [ideas, search, sectorFilter, sortBy]);

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{t.marketplace.title}</h1>
        <p className="text-muted-foreground">{t.marketplace.subtitle}</p>
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-4 shadow-glass mb-8">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.marketplace.searchPh}
              className="ps-9 bg-background/50"
            />
          </div>
          <Select value={sectorFilter} onValueChange={setSectorFilter}>
            <SelectTrigger className="w-full md:w-48 bg-background/50">
              <SelectValue placeholder={t.marketplace.filterSector} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.marketplace.allSectors}</SelectItem>
              {sectors.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-48 bg-background/50">
              <SelectValue placeholder={t.marketplace.sortBy} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t.marketplace.newest}</SelectItem>
              <SelectItem value="highestScore">{t.marketplace.highestScore}</SelectItem>
              <SelectItem value="lowestRisk">{t.marketplace.lowestRisk}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{t.marketplace.noResults}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((idea) => (
            <IdeaCard
              key={idea.id}
              id={idea.id}
              title={idea.title}
              description={idea.description}
              sector={idea.sector}
              location={idea.location}
              founderName={idea.profiles?.full_name || ""}
              aiScore={idea.ai_score}
              riskScore={idea.risk_score}
              marketScore={idea.market_score}
              capitalRequired={idea.capital_required}
            />
          ))}
        </div>
      )}
    </div>
  );
}
