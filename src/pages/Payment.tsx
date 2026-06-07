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
  const [status, setStatus] = useState<"loading" | "redirecting" | "error">("loading");

  useEffect(() => {
    if (!iframeUrl) {
      setStatus("error");
      return;
    }

    if (!/^https:\/\/accept\.paymob\.com\//i.test(iframeUrl)) {
      setStatus("error");
      return;
    }

    if (dealId) {
      sessionStorage.setItem("paymob_deal_id", dealId);
    }

    setStatus("redirecting");
    window.location.href = iframeUrl;

  }, [iframeUrl, dealId]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" dir={isAr ? "rtl" : "ltr"}>
      {status === "error" ? (
        <div className="text-destructive text-center">
          <p className="text-lg font-semibold mb-2">
            {isAr ? "خطأ في رابط الدفع" : "Invalid payment link"}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="text-sm underline text-muted-foreground"
          >
            {isAr ? "رجوع" : "Go back"}
          </button>
        </div>
      ) : (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">
            {isAr ? "جاري التحويل لصفحة الدفع الآمنة..." : "Redirecting to secure payment page..."}
          </p>
        </>
      )}
    </div>
  );
}