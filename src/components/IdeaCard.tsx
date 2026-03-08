import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Shield, BarChart3, ArrowRight, MapPin } from "lucide-react";

interface IdeaCardProps {
  id: string;
  title: string;
  description: string;
  sector: string;
  location: string;
  founderName: string;
  aiScore: number;
  riskScore: number;
  marketScore: number;
  capitalRequired: string;
  index?: number;
}

export default function IdeaCard({
  id, title, description, sector, location,
  founderName, aiScore, riskScore, marketScore, capitalRequired, index = 0,
}: IdeaCardProps) {
  const { t } = useLanguage();

  const scoreColor = (score: number) =>
    score >= 70 ? "text-primary" : score >= 40 ? "text-yellow-500" : "text-destructive";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}
      whileHover={{ y: -6, scale: 1.02 }}
      className="glass glass-hover rounded-2xl p-6 shadow-glass flex flex-col h-full"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground text-lg truncate">{title}</h3>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <span>{t.marketplace.by} {founderName || "—"}</span>
            {location && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {location}
                </span>
              </>
            )}
          </div>
        </div>
        <Badge variant="secondary" className="shrink-0 ms-2">{sector}</Badge>
      </div>

      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{description}</p>

      {capitalRequired && (
        <p className="text-xs text-muted-foreground mb-3">💰 {capitalRequired}</p>
      )}

      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-1.5">
          <TrendingUp className={`h-4 w-4 ${scoreColor(aiScore)}`} />
          <span className={`font-semibold ${scoreColor(aiScore)}`}>{aiScore}</span>
          <span className="text-muted-foreground text-xs">{t.marketplace.aiScore}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Shield className={`h-4 w-4 ${scoreColor(100 - riskScore)}`} />
          <span className={`font-semibold ${scoreColor(100 - riskScore)}`}>{riskScore}</span>
          <span className="text-muted-foreground text-xs">{t.marketplace.riskScore}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <BarChart3 className={`h-4 w-4 ${scoreColor(marketScore)}`} />
          <span className={`font-semibold ${scoreColor(marketScore)}`}>{marketScore}</span>
          <span className="text-muted-foreground text-xs">{t.marketplace.marketScore}</span>
        </div>
      </div>

      <Link to={`/idea/${id}`}>
        <Button variant="outline" size="sm" className="w-full">
          {t.marketplace.viewDetails}
          <ArrowRight className="h-3.5 w-3.5 ms-1" />
        </Button>
      </Link>
    </motion.div>
  );
}
