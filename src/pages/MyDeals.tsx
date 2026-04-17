import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Loader2, FileCheck, ArrowLeft, DollarSign, Handshake, FileText } from "lucide-react";

interface Deal {
  id: string; idea_id: string; founder_id: string; investor_id: string;
  investment_amount_usd: number; equity_percentage: number; valuation_usd: number;
  status: string; payment_status: string; platform_fee_amount: number;
  created_at: string;
}

export default function MyDeals() {
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const navigate = useNavigate();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("deals").select("*").or(`founder_id.eq.${user.id},investor_id.eq.${user.id}`).order("created_at", { ascending: false });
      setDeals((data as Deal[]) || []);
      setLoading(false);
    })();
  }, [user]);

  if (authLoading || loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <button onClick={() => navigate(-1)} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4 me-1" /> {isAr ? "رجوع" : "Back"}
      </button>

      <div className="flex items-center gap-3 mb-6">
        <Handshake className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">{isAr ? "صفقاتي" : "My Deals"}</h1>
      </div>

      {deals.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center shadow-glass">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{isAr ? "لا توجد صفقات بعد" : "No deals yet"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deals.map(d => (
            <div key={d.id} className="glass rounded-xl p-5 shadow-glass">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={d.status === "completed" ? "default" : "outline"}>{d.status}</Badge>
                    <Badge variant={d.payment_status === "paid" ? "default" : "secondary"}>{d.payment_status}</Badge>
                    <span className="text-xs text-muted-foreground">{d.investor_id === user.id ? (isAr ? "كمستثمر" : "as investor") : (isAr ? "كمؤسس" : "as founder")}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-foreground"><DollarSign className="h-4 w-4 text-primary" />${d.investment_amount_usd?.toLocaleString()}</span>
                    {d.equity_percentage && <span className="text-muted-foreground">{d.equity_percentage}% equity</span>}
                    {d.platform_fee_amount && <span className="text-xs text-muted-foreground">Fee: ${d.platform_fee_amount?.toLocaleString()}</span>}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate(`/idea/${d.idea_id}`)}>
                  <FileCheck className="h-3 w-3 me-1" /> {isAr ? "عرض" : "View"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
