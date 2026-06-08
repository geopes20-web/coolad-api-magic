import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

export default function Payment() {
  const { dealId } = useParams<{ dealId: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const iframeUrl = params.get("iframe");
  const [iframeReady, setIframeReady] = useState(false);
  const valid = !!iframeUrl && /^https:\/\/accept\.paymob\.com\//i.test(iframeUrl);

  useEffect(() => {
    if (dealId) sessionStorage.setItem("paymob_deal_id", dealId);
  }, [dealId]);

  // Listen for Paymob postMessage events (redirect after card capture)
  useEffect(() => {
    const onMsg = (event: MessageEvent) => {
      const data: any = event.data;
      if (!data) return;
      if (typeof data === "string" && data.includes("redirection_url")) return;
      if (data.redirection_url) {
        navigate(`/payment-result?merchant_order_id=${dealId || ""}&success=true`);
        return;
      }
      if (data.type === "PAYMOB_RESPONSE" || (event.origin || "").includes("paymob")) {
        const ok = data.success === true || data.success === "true";
        navigate(`/payment-result?merchant_order_id=${data.merchant_order_id || dealId || ""}&success=${ok ? "true" : "false"}`);
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [dealId, navigate]);

  if (!valid) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" dir={isAr ? "rtl" : "ltr"}>
        <p className="text-destructive text-lg font-semibold">
          {isAr ? "خطأ في رابط الدفع" : "Invalid payment link"}
        </p>
        <button onClick={() => navigate(-1)} className="text-sm underline text-muted-foreground">
          {isAr ? "رجوع" : "Go back"}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background" dir={isAr ? "rtl" : "ltr"}>
      <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-sm text-muted-foreground hover:text-foreground">
          {isAr ? "← رجوع" : "← Back"}
        </button>
        <span className="text-xs text-muted-foreground">
          {isAr ? "بوابة الدفع الآمنة — Paymob" : "Secure Payment — Paymob"}
        </span>
      </div>
      <div className="relative flex-1 min-h-[70vh]">
        {!iframeReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {isAr ? "جاري تحميل بوابة الدفع..." : "Loading payment gateway..."}
            </p>
          </div>
        )}
        <iframe
          src={iframeUrl!}
          title="Paymob payment"
          className="w-full h-full border-0"
          style={{ minHeight: "70vh" }}
          onLoad={() => setIframeReady(true)}
          allow="payment *"
        />
      </div>
    </div>
  );
}