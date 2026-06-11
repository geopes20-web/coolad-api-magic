import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

export default function PaymentResult() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, userRole } = useAuth();
  const isAr = language === "ar";

  const sessionDealId = sessionStorage.getItem("paymob_deal_id");
  const sessionPaymentType = sessionStorage.getItem("paymob_payment_type");
  const sessionIdeaId = sessionStorage.getItem("paymob_idea_id");
  const merchantRef =
    params.get("merchant_order_id") || params.get("order") || params.get("deal_id");
  const orderId = sessionDealId || merchantRef;
  const paymentType = params.get("payment_type") || sessionPaymentType || undefined;
  const ideaId = params.get("idea_id") || sessionIdeaId || undefined;
  const isDataRoom = paymentType === "data_room_fee";
  const isUuid = !!orderId && /^[0-9a-f-]{36}$/i.test(orderId);

  const successParam = params.get("success");

  const [deal, setDeal] = useState<any>(null);
  const [accessVerified, setAccessVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showFallback, setShowFallback] = useState(false);
  const [checking, setChecking] = useState(false);

  const fetchDeal = async () => {
    if (!orderId) { setLoading(false); return null; }
    const query = supabase
      .from("deals")
      .select("id, payment_status, status, investment_amount_usd, contract_url");
    const { data } = await (isUuid
      ? query.eq("id", orderId).maybeSingle()
      : query.eq("external_reference", orderId).maybeSingle());
    setDeal(data);
    setLoading(false);
    return data;
  };

  const fetchAccess = async () => {
    if (!user?.id || !ideaId) return false;
    const { data } = await supabase
      .from("data_room_access")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("idea_id", ideaId)
      .maybeSingle();
    const approved = !!data && data.status === "approved";
    setAccessVerified(approved);
    setLoading(false);
    return approved;
  };

  useEffect(() => {
    if (!orderId && !isDataRoom) { setLoading(false); return; }
    if (isDataRoom) {
      if (successParam === "false") {
        setLoading(false);
      } else {
        let cancelled = false;
        let attempts = 0;
        const poll = async () => {
          if (cancelled) return;
          const approved = await fetchAccess();
          attempts++;
          if (cancelled) return;
          if (approved || attempts >= 10) return;
          setTimeout(poll, 3000);
        };
        poll();
      }
    } else {
      if (!orderId) { setLoading(false); return; }
      if (successParam === "true") {
        const upd = supabase.from("deals").update({
          payment_status: "paid",
          escrow_status: "held",
          status: "signed",
        });
        (isUuid ? upd.eq("id", orderId) : upd.eq("external_reference", orderId))
          .then(() => {
            fetchDeal();
            sessionStorage.removeItem("paymob_deal_id");
          });
      } else if (successParam === "false") {
        const upd = supabase.from("deals").update({ payment_status: "failed" });
        (isUuid ? upd.eq("id", orderId) : upd.eq("external_reference", orderId))
          .then(() => fetchDeal());
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
    }

    const t = setTimeout(() => setShowFallback(true), 8000);
    return () => { clearTimeout(t); };
  }, [orderId, paymentType, user?.id, ideaId]);

  const handleManualCheck = async () => {
    setChecking(true);
    if (isDataRoom) await fetchAccess();
    else await fetchDeal();
    setChecking(false);
  };

  const success = isDataRoom ? accessVerified : deal?.payment_status === "paid";
  const failed = !isDataRoom && deal?.payment_status === "failed";

  useEffect(() => {
    if (success) {
      if (isDataRoom && ideaId) {
        const redirectPath = userRole === "admin" ? "/admin" : `/idea/${ideaId}`;
        const t = setTimeout(() => navigate(redirectPath), 1400);
        return () => clearTimeout(t);
      }
      if (!isDataRoom && deal?.id) {
        const t = setTimeout(() => navigate(`/contract/${deal.id}`), 1800);
        return () => clearTimeout(t);
      }
    }
  }, [success, deal?.id, ideaId, userRole, navigate]);

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
                {isAr ? "تم الدفع بنجاح" : isDataRoom ? "Access Unlocked" : "Payment Successful"}
              </h1>
              <p className="text-muted-foreground mb-6">
                {isAr
                  ? isDataRoom
                    ? "تم تفعيل وصولك إلى غرفة البيانات. سيتم إعادة توجيهك الآن إلى الفكرة." 
                    : "تم تسجيل استثمارك بنجاح. يمكنك الآن عرض العقد."
                  : isDataRoom
                    ? "Your secure data room access is granted. You will be redirected back to the idea." 
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
            {success && isDataRoom && ideaId && (
              <Button onClick={() => navigate(`/idea/${ideaId}`)}>
                {isAr ? "العودة إلى الفكرة" : "Back to Idea"}
              </Button>
            )}
            {success && !isDataRoom && deal?.id && (
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