import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, FileText, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { motion } from "framer-motion";

export default function PaymentResult() {
  const [params] = useSearchParams();
  const navigate  = useNavigate();
  const { language } = useLanguage();
  const isAr = language === "ar";

  // Paymob redirects with ?merchant_order_id=DR_xxx_ts&success=true/false
  // We also stored deal_id in sessionStorage on initiate
  const merchantOrderId = params.get("merchant_order_id") || params.get("order");
  const successParam    = params.get("success");
  const storedDealId    = sessionStorage.getItem("paymob_deal_id");
  const storedIdeaId    = sessionStorage.getItem("paymob_idea_id");

  const [deal,        setDeal]        = useState<any>(null);
  const [loading,     setLoading]     = useState(true);
  const [showFallback, setShowFallback] = useState(false);
  const [checking,    setChecking]    = useState(false);

  // Look up deal by id (from session) or by external_reference (from merchant_order_id)
  const fetchDeal = async (): Promise<any> => {
    let dealData: any = null;

    // 1. Try by deal ID (most reliable)
    if (storedDealId) {
      const { data } = await supabase
        .from("deals")
        .select("id, payment_status, status, investment_amount_usd, contract_url")
        .eq("id", storedDealId)
        .maybeSingle();
      dealData = data;
    }

    // 2. Fallback: look up payment_events by merchant_order_id
    if (!dealData && merchantOrderId) {
      const { data: peRow } = await supabase
        .from("payment_events")
        .select("deal_id")
        .eq("external_reference", merchantOrderId)
        .maybeSingle();
      if (peRow?.deal_id) {
        const { data } = await supabase
          .from("deals")
          .select("id, payment_status, status, investment_amount_usd, contract_url")
          .eq("id", peRow.deal_id)
          .maybeSingle();
        dealData = data;
      }
    }

    setDeal(dealData);
    setLoading(false);
    return dealData;
  };

  useEffect(() => {
    // On success redirect from Paymob, also update data_room_access
    const ideaId = storedIdeaId;

    const handleSuccess = async () => {
      const d = await fetchDeal();
      if (d?.id) {
        // Update deal
        await supabase.from("deals").update({
          payment_status: "paid",
          escrow_status:  "held",
          status:         "signed",
        }).eq("id", d.id);

        // If it was a data_room_access payment, approve it
        if (ideaId && supabase.auth.getUser) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from("data_room_access").upsert({
              user_id:  user.id,
              idea_id:  ideaId,
              status:   "approved",
            }, { onConflict: "user_id,idea_id" });
          }
        }

        sessionStorage.removeItem("paymob_deal_id");
        sessionStorage.removeItem("paymob_idea_id");
        await fetchDeal(); // refresh
      }
    };

    if (!storedDealId && !merchantOrderId) {
      setLoading(false);
      return;
    }

    if (successParam === "true") {
      handleSuccess();
    } else if (successParam === "false") {
      fetchDeal().then(async (d) => {
        if (d?.id) {
          await supabase.from("deals").update({ payment_status: "failed" }).eq("id", d.id);
          await fetchDeal();
        }
      });
    } else {
      // Poll for webhook update
      let cancelled = false;
      let attempts  = 0;
      const poll = async () => {
        if (cancelled) return;
        const d = await fetchDeal();
        attempts++;
        if (cancelled) return;
        if (d && (d.payment_status === "paid" || d.payment_status === "failed")) return;
        if (attempts < 12) setTimeout(poll, 3000);
      };
      poll();
    }

    const timer = setTimeout(() => setShowFallback(true), 10000);
    return () => { clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleManualCheck = async () => {
    setChecking(true);
    await fetchDeal();
    setChecking(false);
  };

  const success = deal?.payment_status === "paid";
  const failed  = deal?.payment_status === "failed";

  // Auto-redirect to the signed contract once payment is confirmed
  useEffect(() => {
    if (success && deal?.id) {
      const t = setTimeout(() => navigate(`/contract/${deal.id}`), 2000);
      return () => clearTimeout(t);
    }
  }, [success, deal?.id, navigate]);

  return (
    <div className="container mx-auto px-4 py-12 max-w-xl text-center" dir={isAr ? "rtl" : "ltr"}>
      {loading ? (
        <div className="flex flex-col items-center gap-4 py-20">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-muted-foreground">{isAr ? "جاري التحقق من الدفع…" : "Verifying payment…"}</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-2xl p-10 shadow-glass"
        >
          {success ? (
            <>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}>
                <CheckCircle2 className="h-20 w-20 mx-auto text-green-500 mb-4" />
              </motion.div>
              <h1 className="text-2xl font-bold mb-2 text-foreground">
                {isAr ? "🎉 تم الدفع بنجاح!" : "🎉 Payment Successful!"}
              </h1>
              <p className="text-muted-foreground mb-2">
                {isAr
                  ? "تم تسجيل استثمارك وفتح الداتا روم. سيتم توجيهك إلى العقد الآن…"
                  : "Your investment is recorded & data room is unlocked. Redirecting to your contract…"}
              </p>
              <div className="flex items-center justify-center gap-2 mt-2 mb-6">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-primary font-medium">
                  {isAr ? "جاري التوجيه…" : "Redirecting…"}
                </span>
              </div>
            </>
          ) : failed ? (
            <>
              <XCircle className="h-20 w-20 mx-auto text-destructive mb-4" />
              <h1 className="text-2xl font-bold mb-2 text-foreground">
                {isAr ? "فشل الدفع" : "Payment Failed"}
              </h1>
              <p className="text-muted-foreground mb-6">
                {isAr
                  ? "لم تكتمل العملية. يمكنك المحاولة مجدداً من صفحة الفكرة."
                  : "The transaction did not complete. You can try again from the idea page."}
              </p>
            </>
          ) : (
            <>
              <Loader2 className="h-20 w-20 mx-auto text-primary mb-4 animate-spin" />
              <h1 className="text-2xl font-bold mb-2 text-foreground">
                {isAr ? "جاري التأكيد…" : "Confirming payment…"}
              </h1>
              <p className="text-muted-foreground mb-6">
                {isAr
                  ? "ننتظر تأكيد البنك. عادةً يستغرق بضع ثوانٍ."
                  : "Waiting for bank confirmation. This usually takes a few seconds."}
              </p>
              {showFallback && (
                <Button
                  onClick={handleManualCheck}
                  disabled={checking}
                  variant="outline"
                  className="mb-4"
                >
                  {checking && <Loader2 className="h-4 w-4 animate-spin me-2" />}
                  {isAr ? "هل استغرقت وقتًا طويلاً؟ تحقق يدوياً" : "Taking too long? Check manually"}
                </Button>
              )}
            </>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 justify-center flex-wrap mt-2">
            {success && deal?.id && (
              <Button
                onClick={() => navigate(`/contract/${deal.id}`)}
                className="gradient-primary border-0 text-primary-foreground"
              >
                <FileText className="h-4 w-4 me-2" />
                {isAr ? "عرض العقد" : "View Contract"}
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate("/deals")}>
              {isAr ? "صفقاتي" : "My Deals"}
            </Button>
            <Button variant="ghost" onClick={() => navigate("/marketplace")}>
              <Home className="h-4 w-4 me-2" />
              {isAr ? "السوق" : "Marketplace"}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}