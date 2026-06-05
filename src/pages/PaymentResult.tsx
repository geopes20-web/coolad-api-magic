import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export default function PaymentResult() {
  const [params] = useSearchParams();
  const orderId =
    params.get("merchant_order_id") ||
    params.get("order") ||
    params.get("deal_id");
  const [deal, setDeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showFallback, setShowFallback] = useState(false);
  const [checking, setChecking] = useState(false);

  const fetchDeal = async () => {
    if (!orderId) { setLoading(false); return null; }
    const { data } = await supabase
      .from("deals")
      .select("id, payment_status, status, investment_amount_usd, contract_url")
      .eq("id", orderId)
      .maybeSingle();
    setDeal(data);
    setLoading(false);
    return data;
  };

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const poll = async () => {
      if (cancelled) return;
      const d = await fetchDeal();
      attempts++;
      if (cancelled) return;
      if (d && (d.payment_status === "paid" || d.payment_status === "failed")) return;
      if (attempts < 10) setTimeout(poll, 3000);
    };
    poll();
    // Safety: after 8s, surface a manual-check fallback even if webhook lags.
    const t = setTimeout(() => setShowFallback(true), 8000);
    return () => { cancelled = true; clearTimeout(t); };
  }, [orderId]);

  const handleManualCheck = async () => {
    setChecking(true);
    await fetchDeal();
    setChecking(false);
  };

  const success = deal?.payment_status === "paid";
  const failed = deal?.payment_status === "failed";

  return (
    <div className="container mx-auto px-4 py-12 max-w-xl text-center">
      {loading ? <Loader2 className="h-8 w-8 mx-auto animate-spin" /> : (
        <div className="glass rounded-2xl p-10 shadow-glass">
          {success ? (
            <>
              <CheckCircle2 className="h-16 w-16 mx-auto text-green-600 mb-4" />
              <h1 className="text-2xl font-bold mb-2">Payment Successful</h1>
              <p className="text-muted-foreground mb-6">Your investment has been recorded. The contract is being generated.</p>
            </>
          ) : failed ? (
            <>
              <XCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
              <h1 className="text-2xl font-bold mb-2">Payment Failed</h1>
              <p className="text-muted-foreground mb-6">The transaction did not complete. You can try again from the chat.</p>
            </>
          ) : (
            <>
              <Loader2 className="h-16 w-16 mx-auto text-primary mb-4 animate-spin" />
              <h1 className="text-2xl font-bold mb-2">Confirming payment…</h1>
              <p className="text-muted-foreground mb-6">
                We are waiting for the bank confirmation (webhook). This usually takes a few seconds.
              </p>
              {showFallback && (
                <Button onClick={handleManualCheck} disabled={checking} variant="outline" className="mb-4">
                  {checking ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}
                  هل استغرقت العملية وقتًا طويلاً؟ تحقق من حالة المعاملة يدويًا
                </Button>
              )}
            </>
          )}
          <div className="flex gap-3 justify-center">
            <Button asChild><Link to="/deals">My Deals</Link></Button>
            <Button asChild variant="outline"><Link to="/marketplace">Marketplace</Link></Button>
          </div>
        </div>
      )}
    </div>
  );
}
