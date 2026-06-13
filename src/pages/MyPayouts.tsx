/**
 * MyPayouts — Founder's Payout Dashboard
 * Shows idea owners their total entitlement (90% of investment),
 * how much they've received in installments, what remains, and the full ledger.
 * Uses existing payment_events table (event_type="founder_payout") — no Supabase changes needed.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Loader2, Wallet, ArrowLeft, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

type DealSummary = {
  id: string;
  idea_id: string;
  idea_title: string;
  investment_amount_usd: number;
  entitlement: number;
  platform_fee: number;
  status: string;
  payment_status: string;
  created_at: string;
  investor_id: string;
  investor_name: string;
  payouts: { id: string; amount_usd: number; provider: string; external_reference: string | null; note: string | null; created_at: string }[];
};

export default function MyPayouts() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const [deals, setDeals] = useState<DealSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: rawDeals } = await supabase
        .from("deals")
        .select("id, idea_id, investment_amount_usd, status, payment_status, investor_id, created_at, notes")
        .eq("founder_id", user.id)
        .order("created_at", { ascending: false });

      if (!rawDeals || rawDeals.length === 0) { setLoading(false); return; }

      const ideaIds = [...new Set(rawDeals.map(d => d.idea_id))];
      const investorIds = [...new Set(rawDeals.map(d => d.investor_id))];

      const [{ data: ideas }, { data: investors }] = await Promise.all([
        supabase.from("ideas").select("id, title").in("id", ideaIds),
        supabase.from("profiles").select("id, full_name").in("id", investorIds),
      ]);

      const ideaMap = Object.fromEntries((ideas || []).map(i => [i.id, i.title]));
      const investorMap = Object.fromEntries((investors || []).map(p => [p.id, p.full_name]));

      const summaries: DealSummary[] = rawDeals.map(d => {
        // Parse payout history directly from deals.notes JSON (written by admin)
        let myPayouts: any[] = [];
        try { myPayouts = d.notes ? JSON.parse(d.notes) : []; } catch { myPayouts = []; }
        if (!Array.isArray(myPayouts)) myPayouts = [];
        return {
          id: d.id,
          idea_id: d.idea_id,
          idea_title: ideaMap[d.idea_id] || d.idea_id,
          investment_amount_usd: d.investment_amount_usd,
          entitlement: d.investment_amount_usd * 0.90,
          platform_fee: d.investment_amount_usd * 0.10,
          status: d.status,
          payment_status: d.payment_status,
          created_at: d.created_at,
          investor_id: d.investor_id,
          investor_name: investorMap[d.investor_id] || "—",
          payouts: myPayouts.map((p: any) => ({
            id: p.id || String(Math.random()),
            amount_usd: p.amount || 0,
            provider: p.method || "—",
            external_reference: p.ref || null,
            note: p.note || null,
            created_at: p.date || new Date().toISOString(),
          })),
        };
      });

      setDeals(summaries);
      setLoading(false);
    })();
  }, [user]);

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  const totalEntitlement = deals.filter(d => d.payment_status === "paid").reduce((s, d) => s + d.entitlement, 0);
  const totalReceived = deals.reduce((s, d) => s + d.payouts.reduce((ps, p) => ps + p.amount_usd, 0), 0);
  const totalRemaining = Math.max(0, totalEntitlement - totalReceived);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" asChild>
          <Link to="/dashboard">
            <ArrowLeft className={`h-4 w-4 ${isAr ? "ms-1" : "me-1"}`} />
            {isAr ? "لوحة التحكم" : "Dashboard"}
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
          <Wallet className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{isAr ? "مستحقاتي المالية" : "My Payouts"}</h1>
          <p className="text-sm text-muted-foreground">
            {isAr ? "تتبع الدفعات المستلمة والمتبقية من صفقاتك" : "Track received and pending payments from your deals"}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="glass rounded-xl p-5 shadow-glass border border-emerald-500/20 bg-emerald-500/5">
          <TrendingUp className="h-5 w-5 text-emerald-500 mb-2" />
          <p className="text-2xl font-black text-emerald-600">${Number(totalEntitlement).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {isAr ? "إجمالي مستحقاتك (90% من الصفقات المدفوعة)" : "Total entitlement (90% of paid deals)"}
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass rounded-xl p-5 shadow-glass border border-blue-500/20 bg-blue-500/5">
          <CheckCircle2 className="h-5 w-5 text-blue-500 mb-2" />
          <p className="text-2xl font-black text-blue-600">${Number(totalReceived).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {isAr ? "المبالغ المستلمة حتى الآن" : "Total received so far"}
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="glass rounded-xl p-5 shadow-glass border border-orange-500/20 bg-orange-500/5">
          <Clock className="h-5 w-5 text-orange-500 mb-2" />
          <p className="text-2xl font-black text-orange-600">${Number(totalRemaining).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {isAr ? "المبالغ قيد الانتظار (لم تصلك بعد)" : "Pending balance (not yet received)"}
          </p>
        </motion.div>
      </div>

      {/* Per-Deal Breakdown */}
      {deals.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-muted-foreground">{isAr ? "لا توجد صفقات حتى الآن" : "No deals yet"}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {deals.map((deal, i) => {
            const paidOut = deal.payouts.reduce((s, p) => s + p.amount_usd, 0);
            const remaining = Math.max(0, deal.entitlement - paidOut);
            const pct = deal.entitlement > 0 ? Math.min(100, (paidOut / deal.entitlement) * 100) : 0;
            const isPaid = deal.payment_status === "paid";
            const isFullyPaid = remaining === 0 && isPaid && deal.payouts.length > 0;

            return (
              <motion.div key={deal.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="glass rounded-2xl overflow-hidden shadow-glass border border-border/40">

                {/* Deal Header */}
                <div className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-foreground">{deal.idea_title}</h3>
                      {isFullyPaid
                        ? <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px]">✓ {isAr ? "مكتمل" : "Fully Paid"}</Badge>
                        : isPaid
                          ? <Badge className="bg-blue-500/15 text-blue-600 border-blue-500/30 text-[10px]">{isAr ? "جاري التحويل" : "In Progress"}</Badge>
                          : <Badge variant="outline" className="text-amber-500 border-amber-500/40 text-[10px]">{isAr ? "في انتظار الدفع" : "Awaiting Payment"}</Badge>
                      }
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isAr ? "المستثمر: " : "Investor: "}
                      <span className="text-foreground font-medium">{deal.investor_name}</span>
                      {" · "}{new Date(deal.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex gap-4 text-xs mt-2 flex-wrap">
                      <div>
                        <span className="text-muted-foreground">{isAr ? "حجم الاستثمار" : "Investment"}: </span>
                        <span className="font-bold">${Number(deal.investment_amount_usd).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{isAr ? "عمولة المنصة (10%)" : "Platform (10%)"}: </span>
                        <span className="font-bold text-slate-500">${Number(deal.platform_fee).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{isAr ? "مستحقك (90%)" : "Your share (90%)"}: </span>
                        <span className="font-bold text-blue-600">${Number(deal.entitlement).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <Link to={`/contract/${deal.id}`}>
                      <Button size="sm" variant="outline" className="h-8 text-xs">
                        {isAr ? "عرض العقد" : "View Contract"}
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Progress Bar */}
                {isPaid && (
                  <div className="px-5 pb-4">
                    <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5">
                      <span>
                        {isAr ? "تم استلام" : "Received"}: <span className="font-bold text-foreground">${Number(paidOut).toLocaleString()}</span>
                      </span>
                      <span>{Math.round(pct)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${isFullyPaid ? 'bg-emerald-500' : 'bg-blue-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] mt-1">
                      <span className="text-muted-foreground">
                        {isAr ? "متبقي" : "Remaining"}: <span className={`font-bold ${remaining > 0 ? 'text-orange-500' : 'text-emerald-600'}`}>${Number(remaining).toLocaleString()}</span>
                      </span>
                      {remaining > 0 && (
                        <span className="text-muted-foreground italic text-[10px]">
                          {isAr ? "سيتم تحويله على دفعات من الأدمن" : "Will be sent in installments by admin"}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Payout Ledger */}
                {deal.payouts.length > 0 && (
                  <div className="border-t border-border/30 bg-muted/20 px-5 py-3 space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      {isAr ? "سجل الدفعات المستلمة" : "Received Payments Ledger"}
                    </p>
                    {deal.payouts.map((p, idx) => (
                      <div key={p.id} className="flex items-center justify-between text-xs bg-background/60 border border-border/30 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span className="text-muted-foreground font-mono">#{idx + 1}</span>
                          <span className="font-bold text-emerald-600">${Number(p.amount_usd).toLocaleString()}</span>
                          <span className="text-muted-foreground capitalize">{p.provider}</span>
                          {p.external_reference && <span className="text-muted-foreground font-mono">· {p.external_reference}</span>}
                          {p.note && <span className="text-muted-foreground italic">· {p.note}</span>}
                        </div>
                        <span className="text-muted-foreground shrink-0">{new Date(p.created_at).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* No payouts yet — still waiting */}
                {isPaid && deal.payouts.length === 0 && (
                  <div className="border-t border-border/30 bg-amber-500/5 px-5 py-3 text-xs text-amber-600 flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    {isAr
                      ? "لم يتم استلام أي دفعة بعد. سيقوم فريق IDEVEST بتحويل مستحقاتك قريباً."
                      : "No payouts received yet. The IDEVEST team will transfer your funds soon."}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
