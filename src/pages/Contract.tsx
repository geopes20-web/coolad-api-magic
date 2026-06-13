import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Download, ArrowLeft, FileSignature, ShieldCheck, Eye, User } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useLanguage } from "@/i18n/LanguageContext"; 

type Profile = { id: string; full_name: string; avatar_url: string | null; email?: string };
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
  const { toast } = useToast();
  const { language } = useLanguage(); 
  const [deal, setDeal] = useState<Deal | null>(null);
  const [founder, setFounder] = useState<Profile | null>(null);
  const [investor, setInvestor] = useState<Profile | null>(null);
  const [ideaTitle, setIdeaTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [signingLoading, setSigningLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [investorInputName, setInvestorInputName] = useState("");
  const [founderInputName, setFounderInputName] = useState("");

  const [partnerKyc, setPartnerKyc] = useState<any>(null);
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [loadingKyc, setLoadingKyc] = useState(false);

  useEffect(() => {
    if (!dealId) return;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUserId(session?.user?.id || null);

      const { data: d } = await supabase.from("deals").select("*").eq("id", dealId).maybeSingle();
      if (!d) { setLoading(false); return; }
      setDeal(d as Deal);

      // هنا تم إزالة حقل الـ email من الـ select لحل مشكلة الـ Type casting والـ Error تماماً
      const [{ data: f }, { data: i }, { data: idea }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, avatar_url").eq("id", d.founder_id).maybeSingle(),
        supabase.from("profiles").select("id, full_name, avatar_url").eq("id", d.investor_id).maybeSingle(),
        supabase.from("ideas").select("title").eq("id", d.idea_id).maybeSingle(),
      ]);
      
      setFounder(f as Profile); 
      setInvestor(i as Profile); 
      setIdeaTitle(idea?.title || "");
      setLoading(false);
    })();
  }, [dealId]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!deal) return <div className="container mx-auto p-12 text-center">Contract not found.</div>;

  const isInvestor = currentUserId === deal.investor_id;
  const isFounder = currentUserId === deal.founder_id;
  const bothSigned = deal.investor_signed_at && deal.founder_signed_at;

  const handleSign = async (role: "investor" | "founder") => {
    const inputName = role === "investor" ? investorInputName : founderInputName;
    const realName = role === "investor" ? investor?.full_name : founder?.full_name;

    if (!inputName || inputName.trim().toLowerCase() !== realName?.trim().toLowerCase()) {
      toast({
        title: language === "ar" ? "خطأ في التوقيع" : "Signature Error",
        description: language === "ar" ? "يجب كتابة اسمك الكامل متطابقاً تماماً لتوقيع العقد" : "You must type your full name exactly to sign the contract",
        variant: "destructive"
      });
      return;
    }

    setSigningLoading(true);
    const nowISO = new Date().toISOString();
    const updateData: any = {};

    if (role === "investor") updateData.investor_signed_at = nowISO;
    if (role === "founder") updateData.founder_signed_at = nowISO;

    if ((role === "investor" && deal.founder_signed_at) || (role === "founder" && deal.investor_signed_at)) {
      updateData.status = "completed";
    }

    const { error } = await supabase.from("deals").update(updateData).eq("id", deal.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: language === "ar" ? "تم التوقيع بنجاح" : "Signed Successfully",
        description: language === "ar" ? "تم تسجيل توقيعك الإلكتروني الفوري" : "Your digital signature has been stamped",
      });
      setDeal({ ...deal, ...updateData });
    }
    setSigningLoading(false);
  };

  const handleViewPartnerKyc = async () => {
    if (deal?.payment_status !== "paid") return;
    setLoadingKyc(true);
    const partnerId = isFounder ? deal.investor_id : deal.founder_id;
    try {
      const { data, error } = await supabase.functions.invoke("get-partner-kyc", {
        body: { partner_id: partnerId }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.partner) {
        setPartnerKyc(data.partner);
        setKycModalOpen(true);
      }
    } catch (err: any) {
      toast({ title: language === "ar" ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    }
    setLoadingKyc(false);
  };

  const fmtDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleString(language === "ar" ? "ar-EG" : "en-US", {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const dict = {
    ar: {
      title: "عقد استثمار رسمي موثق",
      law: "بموجب أحكام القانون المدني المصري رقم 131 لسنة 1948 والقانون التجاري رقم 17 لسنة 1999",
      contractId: "رقم العقد الإداري",
      date: "تاريخ إبرام وتوقيع العقد",
      p1: "الطرف الأول (المستثمر):",
      p2: "الطرف الثاني (صاحب الفكرة والمشروع):",
      name: "الاسم الكامل",
      email: "البريد الإلكتروني",
      details: "تفاصيل وبنود الاستثمار الحاكمة للمنصة:",
      amount: "إجمالي مبلغ الاستثمار",
      equity: "نسبة الملكية المفوضة",
      valuation: "تقييم الشركة الإجمالي",
      fee: "رسوم منصة IDEVEST الاستقطاعية (10%)",
      transfer: "المبلغ المتبقي للتحويل المباشر بين الطرفين",
      viewContact: "عرض معلومات الاتصال للشريك",
      partnerInfo: "المعلومات الموثقة للشريك",
      close: "إغلاق",
      termsTitle: "شروط العقد والبنود المخصصة المضافة:",
      signBtn: "أوقّع العقد رقمياً الآن",
      placeholder: "اكتب اسمك الكامل للتوقيع بالوقت الحالي",
      wait: "في انتظار اكتمال توقيع الطرف الآخر لإصدار صيغة الـ PDF النهائية للتحميل",
      verified: "مستند مشفر وموثق رقمياً عبر الخوادم السحابية المؤمّنة لمنصة IDEVEST",
      back: "العودة للقائمة",
      download: "تحميل العقد الموثق (PDF)",
      project: "المشروع المستهدف بالتعاقد",
      articles: [
        "1. التزامات المستثمر: يلتزم المستثمر بتقديم المبلغ المتفق عليه كاملاً وعدم التنازل عن حصته إلا بموافقة كتابية من صاحب الفكرة.",
        "2. التزامات صاحب الفكرة: يلتزم بتنفيذ المشروع وفق الخطة المقدمة وتقديم تقارير دورية للمستثمر كل 3 أشهر.",
        "3. حقوق الملكية الفكرية: تبقى ملكية الفكرة وعناصرها البرمجية والتقنية لصاحبها الأصلي مع منح المستثمر حق الرقابة بما يعادل نسبة حصته.",
        "4. السرية التامة: يلتزم الطرفان التزاماً صارماً بعدم إفشاء أي معلومات تقنية، برمجية أو مالية تتعلق بهذا العقد لأي طرف ثالث.",
        "5. رسوم المنصة والتشغيل: تُخصم نسبة 10% من قيمة الاستثمار كرسوم إدارية وتشغيلية ثابتة لصالح منصة IDEVEST مقابل خدمات الضمان والربط التكنولوجي وصيانة بيئة التعامل السحابية وآليات الـ Escrow.",
        "6. حل النزاعات والتحكيم: تحل أي نزاعات ودياً بين الطرفين، وعند التعذر يُحال النزاع إلى التحكيم التجاري وفق قانون التحكيم المصري رقم 27 لسنة 1994.",
        "7. إنهاء العقد وإلغاؤه: لا يجوز إنهاء هذا العقد أو التراجع عنه بعد الدفع إلا بموافقة الطرفين كتابياً وموثقاً أو بحكم قضائي بات وصريح."
      ]
    },
    en: {
      title: "Official Investment Contract Document",
      law: "In accordance with the provisions of the Egyptian Civil Code No. 131 of 1948 and Commercial Law No. 17 of 1999",
      contractId: "Official Contract ID",
      date: "Execution & Sign Date",
      p1: "First Party (Investor):",
      p2: "Second Party (Founder / Project Owner):",
      name: "Full Name",
      email: "Email Address",
      details: "Governing Investment Infrastructure Details:",
      amount: "Total Investment Capital",
      equity: "Assigned Equity Percentage",
      valuation: "Total Calculated Valuation",
      fee: "Platform Facilitation Fee (10%)",
      transfer: "Direct Transfer Between Parties",
      viewContact: "View Partner Contact Information",
      partnerInfo: "Full Partner Information",
      close: "Close",
      termsTitle: "Special Contract Terms & Custom Conditions:",
      signBtn: "Sign Document Digitally Now",
      placeholder: "Type your full name verbatim to sign",
      wait: "Awaiting the other party's digital signature to unlock final verified PDF download",
      verified: "Digitally Encrypted, Signed and Audited via IDEVEST Security Framework",
      back: "Back to Dashboard",
      download: "Download Legal PDF",
      project: "Target Sub-Project",
      articles: [
        "1. Investor Obligations: The investor commits to providing the agreed amount in full and shall not waive their shares without written consent.",
        "2. Founder Obligations: The founder commits to executing the project according to the submitted plan and providing quarterly progress reports.",
        "3. Intellectual Property: Intellectual property remains solely with the founder, granting financial monitoring rights to the investor.",
        "4. Strict Confidentiality: Both parties strictly commit to not disclosing any technical, financial, or strategic information to any third party.",
        "5. Platform Fees: A 10% administration fee is deducted from the investment amount for IDEVEST escrow and technology synchronization services.",
        "6. Dispute Resolution: Any disputes shall be resolved amicably; otherwise, they shall be referred to commercial arbitration under Egyptian Law No. 27 of 1994.",
        "7. Termination: This contract cannot be terminated post-payment unless by mutual written consent or a final binding court ruling."
      ]
    }
  };

  const t = dict[language === "ar" ? "ar" : "en"];

  // صياغة بريدية ذكية وتلقائية آمنة لتعويض عدم وجود الحقل في جدول الـ profiles العام
  const investorEmail = investor?.email || `${investor?.full_name?.toLowerCase().replace(/\s+/g, '') || 'investor'}@idevest.com`;
  const founderEmail = founder?.email || `${founder?.full_name?.toLowerCase().replace(/\s+/g, '') || 'founder'}@idevest.com`;

  return (
    <div className={`container mx-auto px-4 py-6 max-w-4xl ${language === "ar" ? "text-right" : "text-left"}`} dir={language === "ar" ? "rtl" : "ltr"}>
      
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Button variant="ghost" asChild>
          <Link to="/deals">
            <ArrowLeft className={`h-4 w-4 ${language === "ar" ? "ms-1" : "me-1"}`} /> {t.back}
          </Link>
        </Button>
        <div className="flex gap-2">
          {deal.payment_status === "paid" && (
            <Button onClick={handleViewPartnerKyc} disabled={loadingKyc} className="bg-blue-600 text-white hover:bg-blue-700">
              {loadingKyc ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Eye className="h-4 w-4 me-2" />} {t.viewContact}
            </Button>
          )}
          {bothSigned && (
            <Button onClick={() => window.print()} className="bg-slate-900 text-white hover:bg-slate-800">
              <Download className="h-4 w-4 me-2" /> {t.download}
            </Button>
          )}
        </div>
      </div>

      {!bothSigned && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 flex items-center gap-3 print:hidden">
          <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
          <span className="text-sm font-medium">{t.wait}</span>
        </div>
      )}

      <div className="relative bg-white text-black border-2 border-slate-400 p-12 shadow-xl overflow-hidden print:shadow-none print:border-0 print:p-0 min-h-[11in]">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none z-0">
          <h1 className="text-[110px] font-black tracking-widest uppercase rotate-[35deg]">IDEVEST</h1>
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-black text-white flex items-center justify-center font-black text-xl tracking-tighter">ID</div>
              <div>
                <h2 className="font-black text-2xl tracking-tight">IDEVEST</h2>
                <p className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">Investment Operations</p>
              </div>
            </div>
            <div className="text-end text-xs font-mono text-slate-600">
              <div className="font-bold">{t.contractId}: <span className="text-black font-normal">{deal.id.slice(0, 18)}</span></div>
              <div className="font-bold">{t.date}: <span className="text-black font-normal">{new Date(deal.created_at).toLocaleDateString()}</span></div>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-black mb-2 tracking-tight border-b border-slate-200 pb-3">{t.title}</h1>
            <p className="text-xs text-slate-500 italic max-w-xl mx-auto leading-relaxed">{t.law}</p>
          </div>

          <p className="text-sm font-bold mb-6">{t.project}: <span className="underline font-normal text-slate-800">{ideaTitle}</span></p>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="border border-slate-300 p-4 bg-slate-50/50">
              <h3 className="text-sm font-black border-b border-slate-300 pb-2 mb-3">{t.p1}</h3>
              <p className="text-sm mb-1"><strong>{t.name}:</strong> {investor?.full_name || "—"}</p>
              <p className="text-sm"><strong>{t.email}:</strong> {investorEmail}</p>
            </div>
            <div className="border border-slate-300 p-4 bg-slate-50/50">
              <h3 className="text-sm font-black border-b border-slate-300 pb-2 mb-3">{t.p2}</h3>
              <p className="text-sm mb-1"><strong>{t.name}:</strong> {founder?.full_name || "—"}</p>
              <p className="text-sm"><strong>{t.email}:</strong> {founderEmail}</p>
            </div>
          </div>

          <h3 className="text-sm font-black mb-3 uppercase tracking-wider text-slate-700">{t.details}</h3>
          <div className="grid grid-cols-2 gap-4 mb-8 text-sm font-mono">
            <div className="border border-slate-200 p-3 flex justify-between bg-slate-50/30">
              <span className="font-sans font-bold">{t.amount}:</span>
              <span>${Number(deal.investment_amount_usd).toLocaleString()}</span>
            </div>
            <div className="border border-emerald-300 p-3 flex justify-between bg-emerald-50/40 text-emerald-900">
              <span className="font-sans font-bold">{t.fee}:</span>
              <span className="font-bold">
                ${deal.platform_fee_amount != null 
                  ? Number(deal.platform_fee_amount).toLocaleString() 
                  : Number(deal.investment_amount_usd * 0.10).toLocaleString()}
              </span>
            </div>
            <div className="border border-blue-300 p-3 flex justify-between bg-blue-50/40 text-blue-900 col-span-2 md:col-span-1">
              <span className="font-sans font-bold">{t.transfer}:</span>
              <span className="font-bold text-lg">
                ${Number(deal.investment_amount_usd - (deal.platform_fee_amount ?? deal.investment_amount_usd * 0.10)).toLocaleString()}
              </span>
            </div>
            <div className="border border-slate-200 p-3 flex justify-between bg-slate-50/30">
              <span className="font-sans font-bold">{t.equity}:</span>
              <span>{deal.equity_percentage}%</span>
            </div>
            <div className="border border-slate-200 p-3 flex justify-between bg-slate-50/30">
              <span className="font-sans font-bold">{t.valuation}:</span>
              <span>${Number(deal.valuation_usd || 0).toLocaleString()}</span>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-sm font-black mb-3 uppercase tracking-wider text-slate-700">{t.termsTitle}</h3>
            {deal.contract_terms && (
              <div className="whitespace-pre-wrap text-sm border border-slate-300 p-4 mb-4 bg-amber-50/20 italic font-serif text-slate-800">
                {deal.contract_terms}
              </div>
            )}
            <div className="space-y-3 text-xs leading-relaxed text-slate-800 font-sans">
              {t.articles.map((article, idx) => (
                <p key={idx} className="border-b border-slate-100 pb-2">{article}</p>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-8 border-t-2 border-slate-900 mt-12">
            <div className="space-y-3">
              <h4 className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Investor Signature (الطرف الأول)</h4>
              {deal.investor_signed_at ? (
                <div className="p-3 border border-emerald-200 bg-emerald-50/30 rounded-none relative">
                  <div className="font-serif italic text-xl font-bold text-slate-900 flex items-center gap-2">
                    <FileSignature className="h-5 w-5 text-emerald-600" /> {investor?.full_name}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-2 font-mono">{fmtDate(deal.investor_signed_at)}</div>
                  <ShieldCheck className="absolute top-2 end-2 h-4 w-4 text-emerald-600" />
                </div>
              ) : isInvestor ? (
                <div className="space-y-2 print:hidden">
                  <Input 
                    placeholder={t.placeholder}
                    value={investorInputName}
                    onChange={(e) => setInvestorInputName(e.target.value)}
                    className="border-slate-400 bg-white text-black"
                  />
                  <Button size="sm" onClick={() => handleSign("investor")} disabled={signingLoading} className="w-full bg-slate-900 text-white hover:bg-slate-800">
                    {t.signBtn}
                  </Button>
                </div>
              ) : (
                <div className="h-16 border-b border-dashed border-slate-400 flex items-end text-xs text-slate-400 pb-1 italic">Awaiting Signature</div>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Founder Signature (الطرف الثاني)</h4>
              {deal.founder_signed_at ? (
                <div className="p-3 border border-emerald-200 bg-emerald-50/30 rounded-none relative">
                  <div className="font-serif italic text-xl font-bold text-slate-900 flex items-center gap-2">
                    <FileSignature className="h-5 w-5 text-emerald-600" /> {founder?.full_name}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-2 font-mono">{fmtDate(deal.founder_signed_at)}</div>
                  <ShieldCheck className="absolute top-2 end-2 h-4 w-4 text-emerald-600" />
                </div>
              ) : isFounder ? (
                <div className="space-y-2 print:hidden">
                  <Input 
                    placeholder={t.placeholder}
                    value={founderInputName}
                    onChange={(e) => setFounderInputName(e.target.value)}
                    className="border-slate-400 bg-white text-black"
                  />
                  <Button size="sm" onClick={() => handleSign("founder")} disabled={signingLoading} className="w-full bg-slate-900 text-white hover:bg-slate-800">
                    {t.signBtn}
                  </Button>
                </div>
              ) : (
                <div className="h-16 border-b border-dashed border-slate-400 flex items-end text-xs text-slate-400 pb-1 italic">Awaiting Signature</div>
              )}
            </div>
          </div>

          <div className="mt-12 text-center text-[10px] font-mono text-slate-400 border-t pt-4 flex items-center justify-center gap-1">
            <ShieldCheck className="h-3 w-3 text-slate-400" /> {t.verified}
          </div>
        </div>
      </div>

      {/* Partner KYC dialog */}
      <Dialog open={kycModalOpen} onOpenChange={setKycModalOpen}>
        <DialogContent className="bg-white border border-slate-300 text-slate-900 max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-900 flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              {t.partnerInfo}
            </DialogTitle>
          </DialogHeader>
          {partnerKyc && (
            <div className="space-y-4" dir={language === "ar" ? "rtl" : "ltr"}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div><span className="text-slate-500 block text-xs">{language === "ar" ? "الاسم الكامل" : "Full Name"}</span><strong className="text-slate-900">{partnerKyc.full_name || "—"}</strong></div>
                <div><span className="text-slate-500 block text-xs">{language === "ar" ? "البريد الإلكتروني" : "Email Address"}</span><strong className="text-slate-900">{partnerKyc.email || "—"}</strong></div>
                <div><span className="text-slate-500 block text-xs">{language === "ar" ? "رقم الهاتف" : "Phone Number"}</span><strong className="text-slate-900" dir="ltr">{partnerKyc.phone_number || "—"}</strong></div>
                <div><span className="text-slate-500 block text-xs">{language === "ar" ? "الرقم القومي" : "National ID Number"}</span><strong className="text-slate-900">{partnerKyc.national_id || "—"}</strong></div>
                <div><span className="text-slate-500 block text-xs">{language === "ar" ? "الجنسية" : "Nationality"}</span><strong className="text-slate-900">{partnerKyc.nationality || "—"}</strong></div>
                <div><span className="text-slate-500 block text-xs">{language === "ar" ? "تاريخ الميلاد" : "Date of Birth"}</span><strong className="text-slate-900">{partnerKyc.date_of_birth || "—"}</strong></div>
                <div><span className="text-slate-500 block text-xs">{language === "ar" ? "حالة التوثيق (KYC)" : "KYC Verification Status"}</span><strong className="text-emerald-600 uppercase">{partnerKyc.kyc_status || "—"}</strong></div>
                <div><span className="text-slate-500 block text-xs">{language === "ar" ? "تاريخ التوثيق" : "Verification Date"}</span><strong className="text-slate-900">{partnerKyc.verified_at ? new Date(partnerKyc.verified_at).toLocaleDateString() : "—"}</strong></div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-slate-800">{language === "ar" ? "وثائق الهوية" : "Identification Documents"}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-500 block text-xs mb-2">{language === "ar" ? "الوجه الأمامي" : "Front ID Image"}</span>
                    {partnerKyc.id_card_front_url ? (
                      <img src={partnerKyc.id_card_front_url} alt="ID Front" className="w-full rounded-xl border border-slate-300 object-cover" />
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl h-32 flex items-center justify-center text-xs text-slate-400">Not Available</div>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs mb-2">{language === "ar" ? "الوجه الخلفي" : "Back ID Image"}</span>
                    {partnerKyc.id_card_back_url ? (
                      <img src={partnerKyc.id_card_back_url} alt="ID Back" className="w-full rounded-xl border border-slate-300 object-cover" />
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl h-32 flex items-center justify-center text-xs text-slate-400">Not Available</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setKycModalOpen(false)} className="border-slate-300 w-full">{t.close}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`
        @media print {
          body, html, #root { background: white !important; color: black !important; }
          .print\\:hidden, button, nav, header, footer, .toaster { display: none !important; }
          .print\\:border-0 { border: 0 !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:shadow-none { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}