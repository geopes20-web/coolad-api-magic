import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Download, ArrowLeft, FileSignature } from "lucide-react";

type Profile = { id: string; full_name: string; avatar_url: string | null };
type Deal = {
  id: string;
  idea_id: string;
  founder_id: string;
  investor_id: string;
  investment_amount_usd: number;
  equity_percentage: number | null;
  valuation_usd: number | null;
  contract_terms: string;
  status: string;
  payment_status: string;
  founder_signed_at: string | null;
  investor_signed_at: string | null;
  platform_fee_amount: number | null;
  platform_fee_percentage: number;
  created_at: string;
};

export default function Contract() {
  const { dealId } = useParams<{ dealId: string }>();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [founder, setFounder] = useState<Profile | null>(null);
  const [investor, setInvestor] = useState<Profile | null>(null);
  const [ideaTitle, setIdeaTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dealId) return;
    (async () => {
      const { data: d } = await supabase.from("deals").select("*").eq("id", dealId).maybeSingle();
      if (!d) { setLoading(false); return; }
      setDeal(d as Deal);
      const [{ data: f }, { data: i }, { data: idea }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, avatar_url").eq("id", d.founder_id).maybeSingle(),
        supabase.from("profiles").select("id, full_name, avatar_url").eq("id", d.investor_id).maybeSingle(),
        supabase.from("ideas").select("title").eq("id", d.idea_id).maybeSingle(),
      ]);
      setFounder(f as Profile); setInvestor(i as Profile); setIdeaTitle(idea?.title || "");
      setLoading(false);
    })();
  }, [dealId]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!deal) return <div className="container mx-auto p-12 text-center">Contract not found.</div>;

  const fmt = (d: string | null) => d ? new Date(d).toLocaleString() : "—";

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-4 print:hidden">
        <Button variant="ghost" asChild><Link to="/deals"><ArrowLeft className="h-4 w-4 me-1" /> Back</Link></Button>
        <Button onClick={() => window.print()}><Download className="h-4 w-4 me-2" /> Download PDF</Button>
      </div>

      <div className="bg-card text-card-foreground border rounded-2xl p-10 shadow-glass print:shadow-none print:border-0">
        <div className="flex items-center justify-between border-b pb-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">ID</div>
            <div>
              <div className="font-bold text-lg">IDEVEST</div>
              <div className="text-xs text-muted-foreground">Investment Agreement</div>
            </div>
          </div>
          <div className="text-end text-xs text-muted-foreground">
            <div>Contract ID: {deal.id.slice(0, 8)}</div>
            <div>Date: {new Date(deal.created_at).toLocaleDateString()}</div>
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-2">Investment Agreement</h1>
        <p className="text-muted-foreground mb-8">Project: <span className="font-medium text-foreground">{ideaTitle}</span></p>

        <div className="grid grid-cols-2 gap-6 mb-8">
          {[
            { label: "Investor", p: investor },
            { label: "Founder", p: founder },
          ].map(({ label, p }) => (
            <div key={label} className="border rounded-xl p-4">
              <div className="text-xs uppercase text-muted-foreground mb-2">{label}</div>
              <div className="flex items-center gap-3">
                <Avatar><AvatarImage src={p?.avatar_url || undefined} /><AvatarFallback>{p?.full_name?.[0] || "?"}</AvatarFallback></Avatar>
                <div className="font-medium">{p?.full_name || "—"}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
          <Row label="Investment Amount" value={`$${Number(deal.investment_amount_usd).toLocaleString()}`} />
          <Row label="Equity Percentage" value={deal.equity_percentage != null ? `${deal.equity_percentage}%` : "—"} />
          <Row label="Valuation" value={deal.valuation_usd != null ? `$${Number(deal.valuation_usd).toLocaleString()}` : "—"} />
          <Row label="Platform Fee" value={`${deal.platform_fee_percentage}% ($${deal.platform_fee_amount ?? 0})`} />
          <Row label="Status" value={deal.status} />
          <Row label="Payment" value={deal.payment_status} />
        </div>

        <div className="mb-8">
          <div className="text-xs uppercase text-muted-foreground mb-2">Terms & Conditions</div>
          <div className="whitespace-pre-wrap text-sm border rounded-xl p-4 bg-muted/30">{deal.contract_terms}</div>
        </div>

        <div className="grid grid-cols-2 gap-6 pt-6 border-t">
          <Signature label="Investor Signature" name={investor?.full_name} signedAt={fmt(deal.investor_signed_at)} />
          <Signature label="Founder Signature" name={founder?.full_name} signedAt={fmt(deal.founder_signed_at)} />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded-lg p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function Signature({ label, name, signedAt }: { label: string; name?: string; signedAt: string }) {
  return (
    <div>
      <div className="text-xs uppercase text-muted-foreground mb-2">{label}</div>
      <div className="h-16 border-b-2 border-foreground/40 flex items-end pb-1 font-signature italic text-lg">
        <FileSignature className="h-4 w-4 me-2 opacity-50" />{name || "—"}
      </div>
      <div className="text-xs text-muted-foreground mt-1">Signed: {signedAt}</div>
    </div>
  );
}