import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export default function PaymentResult() {
  const [params] = useSearchParams();
  const success = params.get("success") === "true";
  const orderId = params.get("merchant_order_id") || params.get("order");
  const [deal, setDeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (orderId) {
        const { data } = await supabase.from("deals").select("*").eq("id", orderId).maybeSingle();
        setDeal(data);
      }
      setLoading(false);
    })();
  }, [orderId]);

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
          ) : (
            <>
              <XCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
              <h1 className="text-2xl font-bold mb-2">Payment Failed</h1>
              <p className="text-muted-foreground mb-6">The transaction did not complete. You can try again from the chat.</p>
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
