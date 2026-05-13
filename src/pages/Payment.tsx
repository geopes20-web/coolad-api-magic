import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Loader2, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export default function Payment() {
  const { dealId } = useParams<{ dealId: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const iframeUrl = params.get("iframe");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [dealStatus, setDealStatus] = useState<string | null>(null);

  useEffect(() => {
    // Whitelist: only allow the official Paymob iframe host.
    if (iframeUrl && /^https:\/\/accept\.paymob\.com\//i.test(iframeUrl)) {
      setStatus("ready");
    } else {
      setStatus("error");
    }
  }, [iframeUrl]);

  // Poll deal payment status every 4s to detect webhook completion
  useEffect(() => {
    if (!dealId) return;
    const i = setInterval(async () => {
      const { data } = await supabase.from("deals").select("payment_status").eq("id", dealId).maybeSingle();
      if (data?.payment_status) setDealStatus(data.payment_status);
      if (data?.payment_status === "paid" || data?.payment_status === "failed") clearInterval(i);
    }, 4000);
    return () => clearInterval(i);
  }, [dealId]);

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
        {dealStatus === "paid" && (
          <div className="flex items-center gap-2 text-green-600"><CheckCircle2 className="h-5 w-5" /> Payment confirmed</div>
        )}
        {dealStatus === "failed" && (
          <div className="flex items-center gap-2 text-destructive"><XCircle className="h-5 w-5" /> Payment failed</div>
        )}
      </div>

      <div className="glass rounded-2xl shadow-glass overflow-hidden bg-background" style={{ height: "calc(100vh - 160px)" }}>
        {status === "loading" && (
          <div className="h-full flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
        )}
        {status === "error" && (
          <div className="h-full flex items-center justify-center text-destructive">Missing iframe URL.</div>
        )}
        {status === "ready" && iframeUrl && (
          <iframe
            src={iframeUrl}
            title="Paymob"
            className="w-full h-full border-0"
            allow="payment *; clipboard-write"
          />
        )}
      </div>
    </div>
  );
}
