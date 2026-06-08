import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";

export default function PaymentResult() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const orderId =
    params.get("merchant_order_id") ||
    params.get("order") ||
    params.get("deal_id") ||
    sessionStorage.getItem("paymob_deal_id");

  const successParam = params.get("success");

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
    if (!orderId) { setLoading(false); return; }

    if (successParam === "true") {
      supabase.from("deals").update({
        payment_status: "paid",
        escrow_status: "held",
        status: "signed",
      }).eq("id", orderId).then(() => {
        fetchDeal();
        sessionStorage.removeItem("paymob_deal_id");
      });
    } else if (successParam === "false") {
      supabase.from("deals").update({
        payment_status: "failed",
      }).eq("id", orderId).then(() => fetchDeal());
    } else {
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
    }

    const t = setTimeout(() => setShowFallback(true), 8000);
    return () => { clearTimeout(t); };
  }, [orderId]);

  const handleManualCheck = async () => {
    setChecking(true);
    await fetchDeal();
    setChecking(false);
  };

  const success = deal?.payment_status === "paid";
  const failed = deal?.payment_status === "failed";

  // Auto-redirect to the signed contract once payment is confirmed paid.
  useEffect(() => {
    if (success && deal?.id) {
      const t = setTimeout(() => navigate(`/contract/${deal.id}`), 1800);
      return () => clearTimeout(t);
    }
  }, [success, deal?.id, navigate]);

  return (
    <div className="container mx-auto px-4 py-12 max-w-xl text-center" dir={isAr ? "rtl" : "ltr"}>
      {loading ? (
        <Loader2 className="h-8 w-8 mx-auto animate-spin" />
      ) : (
        <div className="glass rounded-2xl p-10 shadow-glass">
          {success ? (
            <>
              <CheckCircle2 className="h-16 w-16 mx-auto text-green-600 mb-4" />
              <h1 className="text-2xl font-bold mb-2">
                {isAr ? "تم الدفع بنجاح" : "Payment Successful"}
              </h1>
              <p className="text-muted-foreground mb-6">
                {isAr
                  ? "تم تسجيل استثمارك بنجاح. يمكنك الآن عرض العقد."
                  : "Your investment has been recorded. You can now view the contract."}
              </p>
            </>
          ) : failed ? (
            <>
              <XCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
              <h1 className="text-2xl font-bold mb-2">
                {isAr ? "فشل الدفع" : "Payment Failed"}
              </h1>
              <p className="text-muted-foreground mb-6">
                {isAr
                  ? "لم تكتمل العملية. يمكنك المحاولة مجدداً من المحادثة."
                  : "The transaction did not complete. You can try again from the chat."}
              </p>
            </>
          ) : (
            <>
              <Loader2 className="h-16 w-16 mx-auto text-primary mb-4 animate-spin" />
              <h1 className="text-2xl font-bold mb-2">
                {isAr ? "جاري التأكيد..." : "Confirming payment…"}
              </h1>
              <p className="text-muted-foreground mb-6">
                {isAr
                  ? "ننتظر تأكيد البنك. عادةً يستغرق بضع ثوانٍ."
                  : "We are waiting for the bank confirmation. This usually takes a few seconds."}
              </p>
              {showFallback && (
                <Button
                  onClick={handleManualCheck}
                  disabled={checking}
                  variant="outline"
                  className="mb-4"
                >
                  {checking && <Loader2 className="h-4 w-4 animate-spin me-2" />}
                  {isAr
                    ? "هل استغرقت العملية وقتًا طويلاً؟ تحقق يدويًا"
                    : "Taking too long? Check manually"}
                </Button>
              )}
            </>
          )}

          <div className="flex gap-3 justify-center flex-wrap mt-4">
            {success && deal?.id && (
              <Button onClick={() => navigate(`/contract/${deal.id}`)}>
                {isAr ? "عرض العقد" : "View Contract"}
              </Button>
            )}
            <Button onClick={() => navigate("/deals")}>
              {isAr ? "صفقاتي" : "My Deals"}
            </Button>
            <Button variant="outline" onClick={() => navigate("/marketplace")}>
              {isAr ? "السوق" : "Marketplace"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}