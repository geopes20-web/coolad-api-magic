import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import IdeaCard from "@/components/IdeaCard";
import { motion } from "framer-motion";
import { Search, Loader2, Lightbulb, CheckCircle, SlidersHorizontal, X } from "lucide-react";

interface IdeaRow {
  id: string; title: string; description: string; sector: string;
  location: string; capital_required: string; capital_required_usd: number | null;
  ai_score: number; risk_score: number; market_score: number; founder_id: string;
  created_at: string; profiles?: { full_name: string } | null;
}

// Parse human-readable capital strings to USD numbers
function parseCapitalToUSD(s: string | null | undefined): number {
  if (!s) return 0;
  const clean = s.toLowerCase().replace(/[,\s]/g, '');
  const num = parseFloat(clean.replace(/[^\d.]/g, ''));
  if (isNaN(num)) return 0;
  if (clean.includes('m') || clean.includes('مليون')) return num * 1_000_000;
  if (clean.includes('k') || clean.includes('الف') || clean.includes('ألف')) return num * 1_000;
  // Egyptian pound rough conversion (~50 EGP = 1 USD)
  if (clean.includes('جنيه') || clean.includes('egp')) return num / 50;
  return num;
}

export default function Marketplace() {
  const { t } = useLanguage();
  const [ideas, setIdeas] = useState<IdeaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sectorFilters, setSectorFilters] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState("all");
  const [capitalRange, setCapitalRange] = useState<[number, number]>([0, 5000000]);
  const [riskRange, setRiskRange] = useState<[number, number]>([0, 100]);
  const [scoreMin, setScoreMin] = useState<number>(0);
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    const fetchIdeas = async () => {
      const { data } = await supabase
        .from("ideas")
        .select("id, title, description, sector, location, capital_required, capital_required_usd, ai_score, risk_score, market_score, founder_id, created_at, profiles(full_name)")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      setIdeas((data as unknown as IdeaRow[]) || []);
      setLoading(false);
    };
    fetchIdeas();
  }, []);

  const sectors = useMemo(() => Array.from(new Set(ideas.map(i => i.sector).filter(Boolean))), [ideas]);
  const locations = useMemo(() => Array.from(new Set(ideas.map(i => i.location).filter(Boolean))), [ideas]);

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
    if (sectorFilters.length > 0) result = result.filter(i => sectorFilters.includes(i.sector));
    if (locationFilter !== "all") result = result.filter(i => i.location === locationFilter);
    result = result.filter(i => {
      const cap = i.capital_required_usd ?? parseCapitalToUSD(i.capital_required);
      return cap >= capitalRange[0] && cap <= capitalRange[1];
    });
    result = result.filter(i => i.risk_score >= riskRange[0] && i.risk_score <= riskRange[1]);
    result = result.filter(i => i.ai_score >= scoreMin);

    if (sortBy === "highestScore") result = [...result].sort((a, b) => b.ai_score - a.ai_score);
    else if (sortBy === "lowestRisk") result = [...result].sort((a, b) => a.risk_score - b.risk_score);
    else if (sortBy === "lowestCapital") result = [...result].sort((a, b) => {
      const ca = a.capital_required_usd ?? parseCapitalToUSD(a.capital_required);
      const cb = b.capital_required_usd ?? parseCapitalToUSD(b.capital_required);
      return ca - cb;
    });
    return result;
  }, [ideas, search, sectorFilters, locationFilter, capitalRange, riskRange, scoreMin, sortBy]);

  const activeFiltersCount = sectorFilters.length + (locationFilter !== "all" ? 1 : 0) +
    (capitalRange[0] > 0 || capitalRange[1] < 5000000 ? 1 : 0) +
    (riskRange[0] > 0 || riskRange[1] < 100 ? 1 : 0) + (scoreMin > 0 ? 1 : 0);

  const clearFilters = () => {
    setSectorFilters([]); setLocationFilter("all");
    setCapitalRange([0, 5000000]); setRiskRange([0, 100]); setScoreMin(0);
  };

  const toggleSector = (s: string) => {
    setSectorFilters(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const fmtCapital = (n: number) => n >= 1_000_000 ? `$${(n/1_000_000).toFixed(1)}M` : n >= 1000 ? `$${(n/1000).toFixed(0)}K` : `$${n}`;

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 mb-4">
          <Badge className="bg-primary/10 text-primary border-primary/20 text-sm px-3 py-1">
            <CheckCircle className="h-3.5 w-3.5 me-1" />{t.marketplace.accepted}
          </Badge>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{t.marketplace.title}</h1>
        <p className="text-muted-foreground">{t.marketplace.subtitle}</p>
      </div>

      {/* Search + Sort + Filter Toggle */}
      <div className="glass rounded-2xl p-4 shadow-glass mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.marketplace.searchPh} className="ps-9 bg-background/50" />
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="bg-background/50 relative">
                <SlidersHorizontal className="h-4 w-4 me-2" />
                {t.marketplace.filterSector}
                {activeFiltersCount > 0 && (
                  <Badge className="ms-2 h-5 px-1.5 bg-primary text-primary-foreground">{activeFiltersCount}</Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 max-h-[70vh] overflow-y-auto" align="end">
              <div className="space-y-5">
                {/* Sectors */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-foreground">{t.marketplace.filterSector}</label>
                    {sectorFilters.length > 0 && (
                      <button onClick={() => setSectorFilters([])} className="text-xs text-muted-foreground hover:text-foreground">
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {sectors.map(s => (
                      <label key={s} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded p-1">
                        <Checkbox checked={sectorFilters.includes(s)} onCheckedChange={() => toggleSector(s)} />
                        <span className="text-sm text-foreground">{s}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">{t.marketplace.filterLocation}</label>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.marketplace.allLocations}</SelectItem>
                      {locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Capital Range */}
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    {t.marketplace.filterCapital}: {fmtCapital(capitalRange[0])} – {fmtCapital(capitalRange[1])}
                  </label>
                  <Slider min={0} max={5000000} step={50000} value={capitalRange} onValueChange={(v) => setCapitalRange(v as [number, number])} />
                </div>

                {/* Risk Range */}
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    {t.marketplace.riskScore}: {riskRange[0]} – {riskRange[1]}
                  </label>
                  <Slider min={0} max={100} step={5} value={riskRange} onValueChange={(v) => setRiskRange(v as [number, number])} />
                </div>

                {/* Min AI Score */}
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    {t.marketplace.aiScore} ≥ {scoreMin}
                  </label>
                  <Slider min={0} max={100} step={5} value={[scoreMin]} onValueChange={(v) => setScoreMin(v[0])} />
                </div>

                {activeFiltersCount > 0 && (
                  <Button variant="outline" size="sm" className="w-full" onClick={clearFilters}>
                    <X className="h-3 w-3 me-1" /> Clear all
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-44 bg-background/50"><SelectValue placeholder={t.marketplace.sortBy} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t.marketplace.newest}</SelectItem>
              <SelectItem value="highestScore">{t.marketplace.highestScore}</SelectItem>
              <SelectItem value="lowestRisk">{t.marketplace.lowestRisk}</SelectItem>
              <SelectItem value="lowestCapital">{t.marketplace.lowestCapital || "Lowest Capital"}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active filter chips */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/30">
            {sectorFilters.map(s => (
              <Badge key={s} variant="secondary" className="cursor-pointer" onClick={() => toggleSector(s)}>
                {s} <X className="h-3 w-3 ms-1" />
              </Badge>
            ))}
            {locationFilter !== "all" && (
              <Badge variant="secondary" className="cursor-pointer" onClick={() => setLocationFilter("all")}>
                {locationFilter} <X className="h-3 w-3 ms-1" />
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="text-sm text-muted-foreground mb-4">
        {filtered.length} {filtered.length === 1 ? "result" : "results"}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{t.marketplace.noResults}</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((idea, index) => (
            <IdeaCard key={idea.id} index={index} id={idea.id} title={idea.title} description={idea.description}
              sector={idea.sector} location={idea.location} founderName={idea.profiles?.full_name || ""}
              aiScore={idea.ai_score} riskScore={idea.risk_score} marketScore={idea.market_score}
              capitalRequired={idea.capital_required} />
          ))}
        </div>
      )}
    </div>
  );
}
